import { BetAPI } from '../api/betApi';
import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { gameConfig } from '../utils/gameConfig';
import { Slot } from './Slot';
import { slotGetSpinModeDelay } from './SlotConfig';
import { SlotSymbol } from './SlotSymbol';
import {
    slotGetEmptyPositions,
    slotFillUp,
    slotGetPieceType,
    slotGridToString,
    slotGetMatches,
    slotGetScatterMatches,
    slotGetRegularMatchesWinAmount,
    slotGetBigWinCategory,
    slotApplyGravity,
    slotGetMismatches,
    SlotGrid,
    SlotPosition,
} from './SlotUtility';

/**
 * Handles the entire board-resolution flow after each player action.
 * A full resolution consists of a series of async “process rounds.”
 *
 * Each round:
 *  - detects matches
 *  - clears them
 *  - drops remaining pieces (gravity)
 *  - refills new pieces from the top
 *
 * Rounds continue until the grid has no more matches and no empty spaces.
 * Everything runs through an async task queue, allowing clean sequencing and
 * precise timing for animations and gameplay transitions.
 */
export class SlotProcess {
    /** Reference to the Slot controller */
    private slot: Slot;

    /** Whether the board is currently resolving */
    private processing = false;

    /** Current round counter, reset at start */
    private round = 0;

    /** Whether the current round produced at least one match */
    private hasRoundWin = false;
    /** Bet */
    private betAmount = 0;
    /** Win amount */
    private winAmount = 0;

    /** Internal async queue handling ordered flow of animation + logic steps */
    private queue: AsyncQueue;

    constructor(slot: Slot) {
        this.slot = slot;
        this.queue = new AsyncQueue();
    }

    /** Whether the process is running */
    public isProcessing() {
        return this.processing;
    }

    // In SlotProcess class
    public addWinAmount(amount: number): void {
        this.winAmount += amount;
        this.slot.onWin?.(this.winAmount);
    }

    // Or if you need to set it directly
    public setWinAmount(amount: number): void {
        this.winAmount = amount;
        this.slot.onWin?.(this.winAmount);
    }

    /** Immediately stop processing and clear pending tasks */
    public reset() {
        this.processing = false;
        this.round = 0;
        this.queue.clear();
    }

    /** Pause queued tasks */
    public pause() {
        this.queue.pause();
    }

    /** Resume queued tasks */
    public resume() {
        this.queue.resume();
    }

    /** Begin resolving the board until no more actions remain */
    public async start(bet: number, feature?: number) {
        if (this.processing) return;
        this.processing = true;

        this.slot.onSpinStart?.();
        await this.slot.board.fallToBottomGrid();

        // Clean up
        this.slot.board.reset();
        this.slot.jackpot.reset();

        // Fill new symbols
        await this.fillGrid(bet, feature);

        this.betAmount = bet;
        this.winAmount = 0;
        this.round = 0;

        this.slot.onProcessStart?.();
        console.log('[Slot] ======= PROCESSING START ==========');
        this.runProcessRound();
    }

    /** Stop processing and print final debugging information */
    public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();

        console.log('[Slot] Sequence rounds:', this.round);
        console.log('[Slot] Board pieces:', this.slot.board.pieces.length);
        console.log('[Slot] Grid:\n' + slotGridToString(this.slot.board.grid));
        console.log('[Slot] ======= PROCESSING COMPLETE =======');

        this.slot.onProcessComplete?.();
    }

    /**
     * Executes one complete resolution round.
     * Steps:
     *  1. Increment round + update stats
     *  2. Clear regular matches
     *  3. Apply gravity (drop pieces)
     *  4. If there were wins:
     *       - run jackpot logic in parallel
     *       - refill new pieces at the same time
     *  5. Check if another round is required
     */
    private async runProcessRound() {
        // Step #1 – Start new round and analyze matches
        this.queue.add(async () => {
            this.round += 1;
            console.log(`[Slot] -- SEQUENCE ROUND #${this.round} START`);
            this.updateStats();
        });

        // Step #2 – Resolve standard matches
        this.queue.add(async () => {
            await this.processRegularMatches();
        });

        // Step #3 – Drop pieces (gravity)
        this.queue.add(async () => {
            await this.applyGravity();
        });

        // If this round had at least one match, do jackpot + refill
        if (this.hasRoundWin) {
            let jackpotPromise: Promise<void> | null = null;
            let refillReels: SlotGrid = [];

            // Step #4 & #5 – Jackpot processing + refill simultaneously
            this.queue.add(async () => {
                refillReels = await this.refillGrid();
            });

            // Step to replace some symbols to match from the reels grid
            this.queue.add(async () => {
                await this.processReplaceMismatchedPieces(refillReels);
                jackpotPromise = this.processJackpotMatches();
            });

            // Step #6 – Wait for jackpot to finish
            this.queue.add(async () => {
                if (jackpotPromise) await jackpotPromise;
            });

            this.hasRoundWin = false;
        }

        // Step #7 – Finalize round and decide if another is needed
        this.queue.add(async () => {
            console.log(`[Slot] -- SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    /**
     *
     * @param bet - {number} bet amount
     * @param feature - {number | undefined} 0 for normal spin, 1 for buy feature
     */
    public async fillGrid(bet: number, feature?: number) {
        const result = await BetAPI.spin({
            game: this.slot.game,
            bet,
            feature,
        });
        this.slot.board.grid = result.reels;

        // Add win free spins
        if (result.freeSpins) {
            this.slot.freeSpinsStats.reset();
            const winFreeSpinsData = { freeSpins: result.freeSpins };
            this.slot.freeSpinsStats.registerWinFreeSpins(winFreeSpinsData);
        }

        // Get all positions from the grid
        const positions: SlotPosition[] = [];
        for (let col = 0; col < this.slot.board.columns; col++) {
            for (let row = 0; row < this.slot.board.rows; row++) {
                if (this.slot.board.grid[row][col] !== 0) {
                    positions.push({ row, column: col });
                }
            }
        }

        // Group pieces by column
        const piecesByColumn: Record<number, Array<{ piece: SlotSymbol; x: number; y: number }>> = {};
        const piecesPerColumn: Record<number, number> = {};

        for (const position of positions) {
            const pieceType = slotGetPieceType(this.slot.board.grid, position);
            const piece = this.slot.board.createPiece(position, pieceType);

            // Count pieces per column so new pieces can be stacked up accordingly
            if (!piecesPerColumn[piece.column]) {
                piecesPerColumn[piece.column] = 0;
                piecesByColumn[piece.column] = [];
            }
            piecesPerColumn[piece.column] += 1;

            const x = piece.x;
            const y = piece.y;
            const columnCount = piecesPerColumn[piece.column];
            const height = this.slot.board.getHeight();
            piece.y = -height * 0.5 - columnCount * this.slot.config.tileSize;

            piecesByColumn[piece.column].push({ piece, x, y });
        }

        // Animate each column with a small delay between them
        const animPromises: Promise<void>[] = [];

        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];
            let hasScatter = false;

            // Start all animations in this column
            for (const { piece, x, y } of columnPieces) {
                animPromises.push(piece.animateFall(x, y));
                if (!hasScatter && piece.type == 10) {
                    hasScatter = true;
                }
            }

            // Wait before starting next column
            let delay = slotGetSpinModeDelay(this.slot.spinMode);

            // if interrupted change delay to 0
            if (this.slot.requireSpinInterrupt) {
                delay = 0;
            }

            this.slot.onColumnMoveStart?.({});
            await new Promise((resolve) => setTimeout(resolve, delay));
            this.slot.onColumnMoveComplete?.({
                hasScatter,
            });
        }

        // Always cancel interuption
        this.slot.requireSpinInterrupt = false;

        // Wait for all animations to complete
        await Promise.all(animPromises);
    }

    /** Update internal gameplay stats for any matches found */
    private async updateStats() {
        const matches = slotGetMatches(this.slot.board.grid);
        if (!matches.length) return;

        console.log('[Slot] Update stats');
    }

    /** Resolve and clear all standard pattern matches */
    private async processRegularMatches() {
        console.log('[Slot] Process regular matches');
        const matches = slotGetMatches(this.slot.board.grid);
        if (matches.length > 0) this.hasRoundWin = true;

        const animePlayPieces = [];
        const winMatches = [];

        for (const match of matches) {
            animePlayPieces.push(this.slot.board.playPieces(match));

            const types = this.slot.board.getTypesByPositions(match);
            const paytable = gameConfig.getPaytableByType(types[0]);
            const winAmount = slotGetRegularMatchesWinAmount(this.betAmount, types, paytable);
            winMatches.push({ amount: winAmount, types });
        }

        this.slot.onMatch?.({
            wins: winMatches,
        });

        await Promise.all(animePlayPieces);

        const winTotal = winMatches.reduce((acc, value) => (acc = acc + value.amount), 0);
        this.winAmount = this.winAmount + winTotal;
        this.slot.onWin?.(this.winAmount);

        const animPopPromises = [];

        for (const match of matches) {
            animPopPromises.push(this.slot.board.popPieces(match));
        }

        await Promise.all(animPopPromises);
    }

    private async displayBigWins() {
        const bigWinCatergory = slotGetBigWinCategory(this.winAmount, this.betAmount);
        if (bigWinCatergory) {
            await waitFor(0.5);
            await this.slot.onBigWinTrigger?.({
                amount: this.winAmount,
                category: bigWinCatergory,
            });
            await waitFor(0.5);
        }
    }

    /** Handle jackpot-related matches (grand, angelic, blessed, divine) */
    private async processJackpotMatches() {
        await this.slot.jackpot.process(this.betAmount);
    }

    /** Handle jackpot-related matches (grand, angelic, blessed, divine) */
    private async processReplaceMismatchedPieces(refillGrid: SlotGrid) {
        const mismatches = slotGetMismatches(this.slot.board.grid, refillGrid);

        const animReplacePromises = [];
        for (const mismatch of mismatches) {
            const { row, column } = mismatch;
            animReplacePromises.push(this.slot.board.replacePiece(mismatch, refillGrid[row][column]));
        }

        await Promise.all(animReplacePromises);

        await waitFor(0.7);
    }

    /** Move all existing pieces downward to fill empty cells */
    private async applyGravity() {
        const changes = slotApplyGravity(this.slot.board.grid);
        console.log('[Slot] Apply gravity - moved pieces:', changes.length);

        const animPromises = [];
        let hasScatter = false;

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.slot.board.getPieceByPosition(from);
            if (!piece) continue;

            piece.row = to.row;
            piece.column = to.column;

            const newPosition = this.slot.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPosition.x, newPosition.y));
            if (!hasScatter && piece.type == 10) {
                hasScatter = true;
            }
        }

        if (animPromises.length > 0) {
            this.slot.onColumnMoveStart?.({});
            await Promise.all(animPromises);
            this.slot.onColumnMoveComplete?.({
                hasScatter,
            });
        }
    }

    /** Create brand-new symbols in empty spaces and animate them falling in */
    private async refillGrid() {
        const result = await BetAPI.spin({
            game: this.slot.game,
            bet: this.betAmount,
        });
        const newPieces = slotFillUp(this.slot.board.grid, this.slot.board.commonTypes, result.reels);

        console.log('[Slot] Refill grid - new pieces:', newPieces.length);

        const animPromises = [];
        const piecesPerColumn: Record<number, number> = {};
        let hasScatter = false;

        for (const position of newPieces) {
            const pieceType = slotGetPieceType(this.slot.board.grid, position);
            const piece = this.slot.board.createPiece(position, pieceType);

            if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const columnIndex = piecesPerColumn[piece.column];
            const height = this.slot.board.getHeight();

            // Spawn piece above the board, stacked by column
            piece.y = -height * 0.5 - columnIndex * this.slot.config.tileSize;
            animPromises.push(piece.animateFall(x, y));
            if (!hasScatter && piece.type == 10) {
                hasScatter = true;
            }
        }

        if (animPromises.length > 0) {
            this.slot.onColumnMoveStart?.({});
            await Promise.all(animPromises);
            this.slot.onColumnMoveComplete?.({
                hasScatter,
            });
        }

        return result.reels as SlotGrid;
    }

    /** Detect scatter symbols and trigger free spins if requirements are met */
    private async processFreeSpinCheckpoint() {
        const scatterMatches = slotGetScatterMatches(this.slot.board.grid);
        const scatterTrigger = gameConfig.getScatterBlocksTrigger();

        const hasScatterTrigger = scatterMatches.some((group) => group.length >= scatterTrigger);

        if (hasScatterTrigger) {
            await waitFor(0.75);
            this.slot.onScatterMatch?.({ symbols: [] });
            const animatePlayPieces = scatterMatches.map((m) => this.slot.board.playPieces(m));
            await Promise.all(animatePlayPieces);
            await waitFor(1);
            const freeSpinCount = this.slot.freeSpinsStats.getAvailableFreeSpins();
            const freeSpinTriggerData = { totalFreeSpins: freeSpinCount };
            await this.slot.onWinFreeSpinTrigger?.(freeSpinTriggerData);
            this.slot.onWin?.(0);
        } else {
            this.stop();
        }
    }

    /** Determine if another resolution round is required or if processing is complete */
    private async processCheckpoint() {
        const newMatches = slotGetMatches(this.slot.board.grid);
        const emptySpaces = slotGetEmptyPositions(this.slot.board.grid);

        console.log('[Slot] Checkpoint - New matches:', newMatches.length);
        console.log('[Slot] Checkpoint - Empty spaces:', emptySpaces.length);

        if (newMatches.length || emptySpaces.length) {
            console.log('[Slot] Checkpoint - Another sequence run is needed');
            await this.runProcessRound();
        } else {
            console.log('[Slot] Checkpoint - Check for jackpot wins then check free spin wins');
            await this.slot.jackpot.displayJackpotWins();
            await this.displayBigWins();
            await this.processFreeSpinCheckpoint();
        }
    }
}
