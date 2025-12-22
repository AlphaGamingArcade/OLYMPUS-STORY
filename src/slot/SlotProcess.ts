import { GameAPI } from '../api/gameApi';
import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { gameConfig } from '../utils/gameConfig';
import { Slot } from './Slot';
import { slotGetSpinModeDelay } from './SlotConfig';
import { SlotSymbol } from './SlotSymbol';
import {
    slotGetEmptyPositions,
    slotFillUp,
    slotGetPieceType,
    slotGetMatches,
    slotGetScatterMatches,
    slotGetRegularMatchesWinAmount,
    slotGetBigWinCategory,
    slotApplyGravity,
    slotGetMismatches,
    SlotGrid,
    slotGetPositions,
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
        await this.fallGrid();

        // Clean up
        this.slot.board.reset();
        this.slot.jackpot.reset();

        // Fill new symbols
        await this.fillGrid(bet, feature);

        this.betAmount = bet;
        this.winAmount = 0;
        this.round = 0;

        this.slot.onProcessStart?.();
        this.runProcessRound();
    }

    /** Stop processing and print final debugging information */
    public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();

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

            // Step to replace some symbols to match from the reels grid
            this.queue.add(async () => {
                jackpotPromise = this.processJackpotMatches();
            });

            // Step #4 & #5 – Jackpot processing + refill simultaneously
            this.queue.add(async () => {
                refillReels = await this.refillGrid();
                await this.processReplaceMismatchedPieces(refillReels);
            });

            // Step #6 – Wait for jackpot to finish
            this.queue.add(async () => {
                if (jackpotPromise) await jackpotPromise;
            });

            this.hasRoundWin = false;
        }

        // Step #7 – Finalize round and decide if another is needed
        this.queue.add(async () => {
            this.processCheckpoint();
        });
    }

    /**
     *
     * @param bet - {number} bet amount
     * @param feature - {number | undefined} 0 for normal spin, 1 for buy feature
     */
    public async fillGrid(bet: number, feature?: number) {
        const result = await GameAPI.spin({
            gamecode: this.slot.gamecode,
            bet,
            index: this.slot.spinIndex,
            feature,
        });
        this.slot.spinIndex++;
        this.slot.board.grid = result.reels;

        // Add win free spins
        if (result.freeSpins) {
            this.slot.freeSpinsStats.reset();
            const winFreeSpinsData = { freeSpins: result.freeSpins };
            this.slot.freeSpinsStats.registerWinFreeSpins(winFreeSpinsData);
        }

        // Get all positions from the grid
        const positions = slotGetPositions(this.slot.board.grid);

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
        const allColumnPromises: Promise<void>[] = [];

        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];
            let hasScatter = false;

            // Collect promises for this column only
            const columnAnimPromises: Promise<void>[] = [];

            // Start all animations in this column
            for (const { piece, x, y } of columnPieces) {
                columnAnimPromises.push(piece.animateFall(x, y));
                if (!hasScatter && piece.type == 10) {
                    hasScatter = true;
                }
            }

            // Create a promise that waits for this column to complete, then fires the callback
            const columnCompletePromise = Promise.all(columnAnimPromises).then(() => {
                this.slot.onColumnMoveComplete?.({
                    hasScatter,
                });
            });

            allColumnPromises.push(columnCompletePromise);

            // Wait before starting next column
            let delay = slotGetSpinModeDelay(this.slot.spinMode);

            // if interrupted change delay to 0
            if (this.slot.requireSpinInterrupt) {
                delay = 0;
            }

            this.slot.onColumnMoveStart?.({});
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Always cancel interruption
        this.slot.requireSpinInterrupt = false;

        // Wait for all columns to complete
        await Promise.all(allColumnPromises);
    }

    /** Update internal gameplay stats for any matches found */
    private async updateStats() {
        const matches = slotGetMatches(this.slot.board.grid);
        if (!matches.length) return;
    }

    /** Resolve and clear all standard pattern matches */
    private async processRegularMatches() {
        await waitFor(0.5);
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

    public async fallGrid() {
        // Get all positions from the grid
        const positions = slotGetPositions(this.slot.board.grid);

        // Group pieces by column
        const piecesByColumn: Record<number, Array<{ piece: SlotSymbol; x: number; y: number }>> = {};
        const piecesPerColumn: Record<number, number> = {};
        const height = this.slot.board.getHeight();

        // Instantiate all new pieces and place them above the board
        for (const position of positions) {
            const piece = this.slot.board.getPieceByPosition(position);

            if (!piece) continue;

            if (!piecesPerColumn[piece.column]) {
                piecesPerColumn[piece.column] = 0;
                piecesByColumn[piece.column] = [];
            }
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            piecesByColumn[piece.column].push({ piece, x, y });
        }

        // Animate each column with a small delay between them
        const animPromises: Promise<void>[] = [];
        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];
            for (const { piece, x, y } of columnPieces) {
                const targetY = y + height + 20;
                animPromises.push(piece.animateFall(x, targetY));
            }

            let delay = slotGetSpinModeDelay(this.slot.spinMode);
            if (this.slot.requireSpinInterrupt) {
                delay = 0;
            }

            if (delay >= 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }

            this.slot.onColumnMoveStart?.({});
        }

        await Promise.all(animPromises);
    }

    /** Create brand-new symbols in empty spaces and animate them falling in */
    private async refillGrid() {
        const result = await GameAPI.spin({
            gamecode: this.slot.gamecode,
            bet: this.betAmount,
            index: this.slot.spinIndex,
        });
        this.slot.spinIndex++;

        // Add win free spins
        if (result.freeSpins) {
            this.slot.freeSpinsStats.reset();
            const winFreeSpinsData = { freeSpins: result.freeSpins };
            this.slot.freeSpinsStats.registerWinFreeSpins(winFreeSpinsData);
        }

        const newPieces = slotFillUp(this.slot.board.grid, this.slot.board.commonTypes, result.reels);
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
        if (scatterMatches.length > 0) {
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

        if (newMatches.length || emptySpaces.length) {
            await this.runProcessRound();
        } else {
            await this.slot.jackpot.displayJackpotWins();
            await this.displayBigWins();
            await this.processFreeSpinCheckpoint();
        }
    }
}
