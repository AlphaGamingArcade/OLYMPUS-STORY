import { BetAPI } from '../api/betApi';
import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { Slot } from './Slot';
import {
    slotFillUp,
    slotGetPieceType,
    slotGridToString,
    slotGetMatches,
    slotGetRegularMatchesWinAmount,
    slotGetBigWinCategory,
    slotGetNextFreeSpinJackpots,
    slotApplyGravity,
    slotGetEmptyPositions,
    SlotGrid,
    slotGetMismatches,
    slotGetScatterMatches,
    SlotPosition,
} from './SlotUtility';
import { gameConfig } from '../utils/gameConfig';
import { SlotSymbol } from './SlotSymbol';
import { slotGetSpinModeDelay } from './SlotConfig';

/**
 * Controls the entire free-spin resolution flow for the Slot board.
 *
 * It follows the same overall pattern as the standard SlotProcess, but includes
 * additional state tracking such as the current free spin number, remaining spins,
 * and special jackpot behavior intended specifically for free-spin rounds.
 *
 * Each free-spin round:
 *   1. Builds a fresh grid using backend-provided reels
 *   2. Detects and clears matches
 *   3. Applies gravity to drop pieces
 *   4. Runs jackpot logic
 *   5. Refills empty spaces with new pieces falling from above
 *
 * The process continues round-by-round until all free spins have been consumed.
 * Everything runs through an AsyncQueue, allowing animations and transitions
 * to be chained cleanly and asynchronously.
 */
export class SlotFreeSpinsProcess {
    /** Reference to main Slot controller */
    private slot: Slot;

    /** Whether a free-spin round is currently running */
    private processing = false;

    /** Current internal resolution round index */
    private round = 0;
    /** round win Amount */
    private currentSpinWinAmount = 0;
    /** Bet amount */
    private betAmount = 0;
    /** Whether the current round produced at least one match */
    private hasRoundWin = false;

    /** Total free spins still available */
    private remainingFreeSpins = 0;
    /** The index of the free spin currently being played */
    private currentFreeSpin = 0;
    /** The index of the free spin currently being played */
    private extraFreeSpins = 0;

    /** Task queue managing asynchronous step sequencing */
    private queue: AsyncQueue;

    constructor(slot: Slot) {
        this.slot = slot;
        this.queue = new AsyncQueue();
    }

    /** Whether a free-spin process is active */
    public isProcessing() {
        return this.processing;
    }

    /** Current resolution round number */
    public getProcessRound() {
        return this.round;
    }

    /** Remaining number of free spins */
    public getRemainingFreeSpins() {
        return this.remainingFreeSpins;
    }

    /** Current free-spin index */
    public getCurrentFreeSpin() {
        return this.currentFreeSpin;
    }

    /** Stop everything immediately and clear queued tasks */
    public reset() {
        this.processing = false;
        this.round = 0;
        this.remainingFreeSpins = 0;
        this.currentFreeSpin = 0;
        this.queue.clear();
    }

    /** Pause the async queue */
    public pause() {
        this.queue.pause();
    }

    /** Resume the async queue */
    public resume() {
        this.queue.resume();
    }

    public async start(bet: number) {
        if (this.processing) return;
        this.processing = true;

        this.slot.process.stop();

        this.round = 0;
        this.currentFreeSpin = 0;
        this.betAmount = bet;
        this.currentSpinWinAmount = 0;
        this.extraFreeSpins = 0;

        // Get free spin count from stats
        const freeSpinCount = this.slot.freeSpinsStats.getAvailableFreeSpins();
        this.remainingFreeSpins = freeSpinCount;

        const freeSpinStartData = {
            currentSpin: this.currentFreeSpin,
            remainingSpins: this.remainingFreeSpins,
        };

        this.slot.onFreeSpinStart?.(freeSpinStartData);

        console.log('[Slot] ======= FREE SPIN PROCESSING START ==========');
        console.log('[Slot] Total free spins:', freeSpinCount);

        this.runNextFreeSpin();
    }

    /** Stop the free-spin process and print debug info */
    public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();

        console.log('[Slot] FREE SPIN rounds:', this.round);
        console.log('[Slot] FREE SPIN Board pieces:', this.slot.board.pieces.length);
        console.log('[Slot] FREE SPIN Grid:\n' + slotGridToString(this.slot.board.grid));
        console.log('[Slot] ======= FREE SPIN PROCESSING COMPLETE =======');

        this.slot.stopFreeSpin();
        const data = {
            amount: this.slot.freeSpinsStats.getWin(),
            spins: this.slot.freeSpinsStats.getTotalFreeSpinsPlayed(),
        };
        await this.slot.onFreeSpinComplete?.(data);
    }

    /** Generate the board for a free-spin round using backend reel data this is different from board.fillGrid*/
    public async fillGrid() {
        const result = await BetAPI.spin({
            game: this.slot.game,
            bet: this.betAmount,
        });
        this.slot.board.grid = result.reels;

        // Add win free spins
        if (result.freeSpins) {
            const extraFreeSpins = result.freeSpins;
            this.extraFreeSpins = extraFreeSpins;
            const winFreeSpinsData = { freeSpins: extraFreeSpins };
            this.slot.freeSpinsStats.registerWinFreeSpins(winFreeSpinsData);
        }

        // Collect all grid positions that contain pieces
        const positions: SlotPosition[] = [];
        for (let col = 0; col < this.slot.board.columns; col++) {
            for (let row = 0; row < this.slot.board.rows; row++) {
                if (this.slot.board.grid[row][col] !== 0) {
                    positions.push({ row, column: col });
                }
            }
        }

        const piecesByColumn: Record<number, Array<{ piece: SlotSymbol; x: number; y: number }>> = {};
        const piecesPerColumn: Record<number, number> = {};

        // Instantiate all new pieces and place them above the board
        for (const position of positions) {
            const pieceType = slotGetPieceType(this.slot.board.grid, position);
            const piece = this.slot.board.createPiece(position, pieceType);

            if (!piecesPerColumn[piece.column]) {
                piecesPerColumn[piece.column] = 0;
                piecesByColumn[piece.column] = [];
            }
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const countInColumn = piecesPerColumn[piece.column];
            const height = this.slot.board.getHeight();

            // Spawn higher for each stacked element in the same column
            piece.y = -height * 0.5 - countInColumn * this.slot.config.tileSize;

            piecesByColumn[piece.column].push({ piece, x, y });
        }

        // Play each column’s fall animation with a small stagger
        const animPromises: Promise<void>[] = [];
        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];
            let hasScatter = false;

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

        this.slot.requireSpinInterrupt = false;

        await Promise.all(animPromises);
    }

    public async fallGrid() {
        // Group pieces by column
        const piecesByColumn: Record<number, Array<{ piece: any; x: number; y: number }>> = {};
        const piecesPerColumn: Record<number, number> = {};

        // Use existing pieces from the board
        for (const piece of this.slot.board.pieces) {
            if (!piecesPerColumn[piece.column]) {
                piecesPerColumn[piece.column] = 0;
                piecesByColumn[piece.column] = [];
            }
            piecesPerColumn[piece.column] += 1;

            const viewPosition = this.slot.board.getViewPositionByGridPosition({
                row: piece.row,
                column: piece.column,
            });

            piecesByColumn[piece.column].push({
                piece,
                x: viewPosition.x,
                y: viewPosition.y,
            });
        }

        const animPromises = [];
        const height = this.slot.board.getHeight();

        // Animate each column with a small delay between them
        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];
            const columnIndex = Number(column);

            for (const { piece, x, y } of columnPieces) {
                const targetY = y + height + this.slot.config.tileSize * columnIndex + 20;
                animPromises.push(piece.animateFall(x, targetY));
            }

            const delay = this.slot.requireSpinInterrupt ? 0 : slotGetSpinModeDelay(this.slot.spinMode);
            await new Promise((resolve) => setTimeout(resolve, delay));
            this.slot.onColumnMoveStart?.({});
        }

        this.slot.requireSpinInterrupt = false;
        await Promise.all(animPromises);
    }

    /** Start the next free-spin round, or end the sequence if none remain */
    private async runNextFreeSpin() {
        if (this.remainingFreeSpins <= 0) {
            await waitFor(1);
            this.stop();
            return;
        }

        console.log('[Slot] ======= FREE SPIN NEXT SPIN START =======');

        await waitFor(1);

        this.currentFreeSpin += 1;
        this.remainingFreeSpins -= 1;

        // Mark the free spin as consumed in stats
        this.slot.freeSpinsStats.consumeFreeSpin();

        // Clear jackpots that were already awarded and carryover for next spin the remaining points
        const nextFreeSpinJackpots = slotGetNextFreeSpinJackpots(this.slot.jackpot.jackpots);
        const data = {
            jackpots: nextFreeSpinJackpots,
            currentSpin: this.currentFreeSpin,
            remainingSpins: this.remainingFreeSpins,
        };
        this.slot.jackpot.setupNextFreeSpinJackpots(data);
        this.slot.onNextFreeSpinStart?.(data);

        // Animate the previous grid falling away, then clear board
        await this.fallGrid();
        this.slot.board.reset();

        // Reset the free spin win
        this.currentSpinWinAmount = 0;

        // Queue filling for this free-spin round
        this.queue.add(async () => {
            await this.fillGrid();
        });

        // Begin the resolution sequence for this round
        this.runProcessRound();
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
    }

    /**
     * Runs a single resolution sequence for a free-spin round.
     * Steps:
     *   1. Start round + update stats
     *   2. Clear common matches
     *   3. Apply gravity to remaining pieces
     *   4. Resolve jackpot/special matches
     *   5. Refill empty spaces with new pieces
     *   6. Check if another round is required, or move to next free spin
     */
    private async runProcessRound() {
        // Step #1 – Start round and analyze current matches
        this.queue.add(async () => {
            this.round += 1;
            console.log(`[Slot] -- FREE SPIN SEQUENCE ROUND #${this.round} START`);
            this.updateStats();
        });

        // Step #2 – Resolve common matches
        this.queue.add(async () => {
            await this.processRegularMatches();
        });

        // Step #3 – Apply gravity to falling pieces
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
                await waitFor(0.7);
                jackpotPromise = this.processJackpotMatches();
            });

            // Step #6 – Wait for jackpot to finish
            this.queue.add(async () => {
                if (jackpotPromise) await jackpotPromise;
            });

            this.hasRoundWin = false;
        }

        // Step #6 – Finalize the round and check whether another is needed
        this.queue.add(async () => {
            console.log(`[Slot] -- FREE SPIN SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    /** Update stats for matches found during free spins */
    private async updateStats() {
        const matches = slotGetMatches(this.slot.board.grid);
        if (!matches.length) return;

        console.log('[Slot] Update free spin stats');
    }

    /** Handle all standard (non-jackpot) matches */
    private async processRegularMatches() {
        console.log('[Slot] Process regular matches (free spin)');
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

        // register in free spin stats
        const winTotal = winMatches.reduce((acc, value) => (acc = acc + value.amount), 0);
        this.currentSpinWinAmount += winTotal;
        const winData = { amount: winTotal };
        this.slot.freeSpinsStats.registerWin(winData);
        this.slot.onWin?.(this.slot.freeSpinsStats.getWin());

        const popPromises = [];
        for (const match of matches) {
            popPromises.push(this.slot.board.popPieces(match));
        }
        await Promise.all(popPromises);
    }

    private async displayBigWins() {
        const bigWinCatergory = slotGetBigWinCategory(this.currentSpinWinAmount, this.betAmount);
        if (bigWinCatergory) {
            await waitFor(0.5);
            await this.slot.onBigWinTrigger?.({
                amount: this.currentSpinWinAmount,
                category: bigWinCatergory,
            });
            await waitFor(0.5);
        }
    }

    /** Handle jackpot-related matches (grand, angelic, blessed, divine) */
    private async processJackpotMatches() {
        await this.slot.jackpot.process(this.betAmount);
    }

    public addWinAmount(amount: number): void {
        this.currentSpinWinAmount += amount;
        const winData = { amount };
        this.slot.freeSpinsStats.registerWin(winData);
        this.slot.onWin?.(this.slot.freeSpinsStats.getWin());
    }

    /** Apply gravity and animate pieces falling downward */
    private async applyGravity() {
        const changes = slotApplyGravity(this.slot.board.grid);

        console.log('[Slot] Apply gravity (free spin) - moved pieces:', changes.length);

        const animPromises = [];
        let hasScatter = false;

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.slot.board.getPieceByPosition(from);
            if (!piece) continue;

            piece.row = to.row;
            piece.column = to.column;

            const newPos = this.slot.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPos.x, newPos.y));
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

    /** Refill all empty cells with brand-new pieces falling from above */
    private async refillGrid() {
        const result = await BetAPI.spin({
            game: this.slot.game,
            bet: this.betAmount,
        });

        const newPieces = slotFillUp(this.slot.board.grid, this.slot.board.commonTypes, result.reels);

        console.log('[Slot] Refill grid (free spin) - new pieces:', newPieces.length);

        const animPromises = [];
        const piecesPerColumn: Record<number, number> = {};
        let hasScatter = false;

        for (const pos of newPieces) {
            const pieceType = slotGetPieceType(this.slot.board.grid, pos);
            const piece = this.slot.board.createPiece(pos, pieceType);

            if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const countInColumn = piecesPerColumn[piece.column];
            const height = this.slot.board.getHeight();

            piece.y = -height * 0.5 - countInColumn * this.slot.config.tileSize;

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

        return result.reels;
    }

    /** Detect scatter symbols and trigger free spins if requirements are met */
    private async processExtraFreeSpinCheckpoint() {
        const scatterMatches = slotGetScatterMatches(this.slot.board.grid);
        const scatterTrigger = gameConfig.getScatterBlocksTrigger();

        const hasScatterTrigger = scatterMatches.some((group) => group.length >= scatterTrigger);

        if (hasScatterTrigger) {
            await waitFor(0.75);
            this.slot.onScatterMatch?.({ symbols: [] });
            const animatePlayPieces = scatterMatches.map((m) => this.slot.board.playPieces(m));
            await Promise.all(animatePlayPieces);
            await waitFor(1);
            const freeSpinTriggerData = { extraFreeSpins: this.extraFreeSpins };
            await this.slot.onWinExtraFreeSpinTrigger?.(freeSpinTriggerData);
            this.remainingFreeSpins += this.extraFreeSpins;
        }

        this.runNextFreeSpin();
    }

    /**
     * Final checkpoint for the current round.
     * Determines whether another resolution round is necessary, or if the
     * free-spin round has ended and the next one should begin.
     */
    private async processCheckpoint() {
        const newMatches = slotGetMatches(this.slot.board.grid);
        const emptySpaces = slotGetEmptyPositions(this.slot.board.grid);

        console.log('[Slot] Checkpoint (free spin) - New matches:', newMatches.length);
        console.log('[Slot] Checkpoint (free spin) - Empty spaces:', emptySpaces.length);

        if (newMatches.length || emptySpaces.length) {
            console.log('[Slot] Checkpoint - Another sequence run is needed');
            this.runProcessRound();
        } else {
            console.log(`[Slot] ======= FREE SPIN #${this.currentFreeSpin} COMPLETE ==========`);

            await this.slot.jackpot.displayFreeSpinJackpotWins();
            await this.displayBigWins();

            await this.processExtraFreeSpinCheckpoint();
        }
    }
}
