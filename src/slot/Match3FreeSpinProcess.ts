import { BetAPI } from '../api/betApi';
import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { Match3 } from './Match3';
import {
    match3GetEmptyPositions,
    match3ApplyGravity,
    match3FillUp,
    match3GetPieceType,
    match3GridToString,
    slotGetMatches,
    Match3Position,
    slotGetJackpotMatches,
} from './SlotUtility';
import { SlotSymbol } from './SlotSymbol';

/**
 * Controls the entire free-spin resolution flow for the Match3 board.
 *
 * It follows the same overall pattern as the standard Match3Process, but includes
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
export class Match3FreeSpinProcess {
    /** Reference to main Match3 controller */
    private match3: Match3;

    /** Whether a free-spin round is currently running */
    private processing = false;

    /** Current internal resolution round index */
    private round = 0;

    /** Whether the current round produced at least one match */
    private hasRoundWin = false;

    /** Total free spins still available */
    private remainingFreeSpins = 0;

    /** The index of the free spin currently being played */
    private currentFreeSpin = 0;

    /** Task queue managing asynchronous step sequencing */
    private queue: AsyncQueue;

    constructor(match3: Match3) {
        this.match3 = match3;
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

    /** Begin the free-spin sequence with a specific number of spins */
    public async start(bet: number, freeSpinCount: number) {
        if (this.processing) return;
        this.processing = true;

        // Stop the normal board-processing flow
        this.match3.process.stop();

        this.round = 0;
        this.remainingFreeSpins = freeSpinCount;
        this.currentFreeSpin = 0;

        this.match3.onFreeSpinStart?.(freeSpinCount);

        console.log('[Match3] ======= FREE SPIN PROCESSING START ==========');
        console.log('[Match3] Total free spins:', freeSpinCount);

        this.runNextFreeSpin();
    }

    /** Stop the free-spin process and print debug info */
    public async stop() {
        if (!this.processing) return;

        this.processing = false;
        this.queue.clear();

        console.log('[Match3] FREE SPIN rounds:', this.round);
        console.log('[Match3] FREE SPIN Board pieces:', this.match3.board.pieces.length);
        console.log('[Match3] FREE SPIN Grid:\n' + match3GridToString(this.match3.board.grid));
        console.log('[Match3] ======= FREE SPIN PROCESSING COMPLETE =======');

        this.match3.onFreeSpinComplete?.();
    }

    /** Start the next free-spin round, or end the sequence if none remain */
    private async runNextFreeSpin() {
        if (this.remainingFreeSpins <= 0) {
            await waitFor(1);
            this.stop();
            return;
        }

        await waitFor(1);

        this.currentFreeSpin += 1;
        this.remainingFreeSpins -= 1;

        console.log(`[Match3] ======= FREE SPIN #${this.currentFreeSpin} START ==========`);

        this.match3.onFreeSpinRoundStart?.(this.currentFreeSpin, this.remainingFreeSpins);

        // Animate the previous grid falling away, then clear board
        await this.match3.board.fallToBottomGrid();
        this.match3.board.reset();

        // Queue filling for this free-spin round
        this.queue.add(async () => {
            await this.fillFreeSpinGrid();
        });

        // Begin the resolution sequence for this round
        this.runProcessRound();
    }

    /** Generate the board for a free-spin round using backend reel data */
    public async fillFreeSpinGrid() {
        const result = await BetAPI.spin('n');
        this.match3.board.grid = result.reels;

        // Collect all grid positions that contain pieces
        const positions: Match3Position[] = [];
        for (let col = 0; col < this.match3.board.columns; col++) {
            for (let row = 0; row < this.match3.board.rows; row++) {
                if (this.match3.board.grid[col][row] !== 0) {
                    positions.push({ row, column: col });
                }
            }
        }

        const piecesByColumn: Record<number, Array<{ piece: SlotSymbol; x: number; y: number }>> = {};
        const piecesPerColumn: Record<number, number> = {};

        // Instantiate all new pieces and place them above the board
        for (const position of positions) {
            const pieceType = match3GetPieceType(this.match3.board.grid, position);
            const piece = this.match3.board.createPiece(position, pieceType);

            if (!piecesPerColumn[piece.column]) {
                piecesPerColumn[piece.column] = 0;
                piecesByColumn[piece.column] = [];
            }
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const countInColumn = piecesPerColumn[piece.column];
            const height = this.match3.board.getHeight();

            // Spawn higher for each stacked element in the same column
            piece.y = -height * 0.5 - countInColumn * this.match3.config.tileSize;

            piecesByColumn[piece.column].push({ piece, x, y });
        }

        // Play each column’s fall animation with a small stagger
        const animPromises: Promise<void>[] = [];
        for (const column in piecesByColumn) {
            const columnPieces = piecesByColumn[column];

            for (const { piece, x, y } of columnPieces) {
                animPromises.push(piece.animateFall(x, y));
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        await Promise.all(animPromises);
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
            console.log(`[Match3] -- FREE SPIN SEQUENCE ROUND #${this.round} START`);
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

        // Step #4 – Process jackpot/special symbol matches
        this.queue.add(async () => {
            await this.processJackpotMatches();
        });

        // Step #5 – Refill empty cells with new pieces
        this.queue.add(async () => {
            await this.refillGrid();
        });

        // Step #6 – Finalize the round and check whether another is needed
        this.queue.add(async () => {
            console.log(`[Match3] -- FREE SPIN SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    /** Update stats for matches found during free spins */
    private async updateStats() {
        const matches = slotGetMatches(this.match3.board.grid);
        if (!matches.length) return;

        console.log('[Match3] Update free spin stats');
    }

    /** Handle all standard (non-jackpot) matches */
    private async processRegularMatches() {
        console.log('[Match3] Process regular matches (free spin)');
        const matches = slotGetMatches(this.match3.board.grid);

        if (matches.length > 0) this.hasRoundWin = true;

        const animePlayPieces = [];
        for (const match of matches) {
            animePlayPieces.push(this.match3.board.playPieces(match));
        }
        await Promise.all(animePlayPieces);

        const popPromises = [];
        for (const match of matches) {
            popPromises.push(this.match3.board.popPieces(match));
        }
        await Promise.all(popPromises);
    }

    /** Processes jackpot matches that occur during free spins */
    private async processJackpotMatches() {
        if (!this.hasRoundWin) return;
        this.hasRoundWin = false;

        const matches = slotGetJackpotMatches(this.match3.board.grid);

        const animePlayPieces = [];
        for (const match of matches) {
            animePlayPieces.push(this.match3.board.playPieces(match));
        }

        await Promise.all(animePlayPieces);
    }

    /** Apply gravity and animate pieces falling downward */
    private async applyGravity() {
        const changes = match3ApplyGravity(this.match3.board.grid);

        console.log('[Match3] Apply gravity (free spin) - moved pieces:', changes, changes.length);

        const animPromises = [];

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.match3.board.getPieceByPosition(from);
            if (!piece) continue;

            piece.row = to.row;
            piece.column = to.column;

            const newPos = this.match3.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPos.x, newPos.y));
        }

        await Promise.all(animPromises);
    }

    /** Refill all empty cells with brand-new pieces falling from above */
    private async refillGrid() {
        const result = await BetAPI.spin('r');

        const newPieces = match3FillUp(this.match3.board.grid, this.match3.board.commonTypes, result.reels);

        console.log('[Match3] Refill grid (free spin) - new pieces:', newPieces.length);

        const animPromises = [];
        const piecesPerColumn: Record<number, number> = {};

        for (const pos of newPieces) {
            const pieceType = match3GetPieceType(this.match3.board.grid, pos);
            const piece = this.match3.board.createPiece(pos, pieceType);

            if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const countInColumn = piecesPerColumn[piece.column];
            const height = this.match3.board.getHeight();

            piece.y = -height * 0.5 - countInColumn * this.match3.config.tileSize;

            animPromises.push(piece.animateFall(x, y));
        }

        await Promise.all(animPromises);
    }

    /**
     * Final checkpoint for the current round.
     * Determines whether another resolution round is necessary, or if the
     * free-spin round has ended and the next one should begin.
     */
    private async processCheckpoint() {
        const newMatches = slotGetMatches(this.match3.board.grid);
        const emptySpaces = match3GetEmptyPositions(this.match3.board.grid);

        console.log('[Match3] Checkpoint (free spin) - New matches:', newMatches.length);
        console.log('[Match3] Checkpoint (free spin) - Empty spaces:', emptySpaces.length);

        if (newMatches.length || emptySpaces.length) {
            console.log('[Match3] Checkpoint - Another sequence run is needed');
            this.runProcessRound();
        } else {
            console.log(`[Match3] ======= FREE SPIN #${this.currentFreeSpin} COMPLETE ==========`);

            this.match3.onFreeSpinRoundComplete?.(this.currentFreeSpin, this.remainingFreeSpins);

            this.round = 0; // Reset before starting next free spin

            this.runNextFreeSpin();
        }
    }
}
