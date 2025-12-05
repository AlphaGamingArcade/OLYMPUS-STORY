import { BetAPI } from '../api/betApi';
import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { gameConfig } from '../utils/gameConfig';
import { Match3 } from './Match3';
import {
    match3GetEmptyPositions,
    match3ApplyGravity,
    match3FillUp,
    match3GetPieceType,
    match3GridToString,
    slotGetMatches,
    slotGetScatterMatches,
    slotGetRegularMatchesWinAmount,
    slotGetBigWinCategory,
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
export class Match3Process {
    /** Reference to the Match3 controller */
    private match3: Match3;

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

    constructor(match3: Match3) {
        this.match3 = match3;
        this.queue = new AsyncQueue();
    }

    /** Whether the process is running */
    public isProcessing() {
        return this.processing;
    }

    // In Match3Process class
    public addWinAmount(amount: number): void {
        this.winAmount += amount;
        this.match3.onWin?.(this.winAmount);
    }

    // Or if you need to set it directly
    public setWinAmount(amount: number): void {
        this.winAmount = amount;
        this.match3.onWin?.(this.winAmount);
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
    public async start(bet: number) {
        if (this.processing) return;
        this.processing = true;

        this.betAmount = bet;
        this.winAmount = 0;

        this.round = 0;
        this.match3.onProcessStart?.();

        console.log('[Match3] ======= PROCESSING START ==========');
        this.runProcessRound();
    }

    /** Stop processing and print final debugging information */
    public async stop() {
        if (!this.processing) return;
        this.processing = false;
        this.queue.clear();

        console.log('[Match3] Sequence rounds:', this.round);
        console.log('[Match3] Board pieces:', this.match3.board.pieces.length);
        console.log('[Match3] Grid:\n' + match3GridToString(this.match3.board.grid));
        console.log('[Match3] ======= PROCESSING COMPLETE =======');

        this.match3.onProcessComplete?.();
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
            console.log(`[Match3] -- SEQUENCE ROUND #${this.round} START`);
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

            // Step #4 & #5 – Jackpot processing + refill simultaneously
            this.queue.add(async () => {
                jackpotPromise = this.processJackpotMatches();
                await this.refillGrid();
            });

            // Step #6 – Wait for jackpot to finish
            this.queue.add(async () => {
                if (jackpotPromise) await jackpotPromise;
            });

            this.hasRoundWin = false;
        }

        // Step #7 – Finalize round and decide if another is needed
        this.queue.add(async () => {
            console.log(`[Match3] -- SEQUENCE ROUND #${this.round} FINISH`);
            this.processCheckpoint();
        });
    }

    /** Update internal gameplay stats for any matches found */
    private async updateStats() {
        const matches = slotGetMatches(this.match3.board.grid);
        if (!matches.length) return;

        console.log('[Match3] Update stats');
    }

    /** Resolve and clear all standard pattern matches */
    private async processRegularMatches() {
        console.log('[Match3] Process regular matches');
        const matches = slotGetMatches(this.match3.board.grid);
        if (matches.length > 0) this.hasRoundWin = true;

        const animePlayPieces = [];
        const winMatches = [];

        for (const match of matches) {
            animePlayPieces.push(this.match3.board.playPieces(match));

            const types = this.match3.board.getTypesByPositions(match);
            const paytable = gameConfig.getPaytableByType(types[0]);
            const winAmount = slotGetRegularMatchesWinAmount(this.betAmount, types, paytable);
            winMatches.push({ amount: winAmount, types });
        }

        await Promise.all(animePlayPieces);

        this.match3.onMatch?.({
            wins: winMatches,
        });

        const winTotal = winMatches.reduce((acc, value) => (acc = acc + value.amount), 0);
        this.winAmount = this.winAmount + winTotal;
        this.match3.onWin?.(this.winAmount);

        const animPopPromises = [];

        for (const match of matches) {
            animPopPromises.push(this.match3.board.popPieces(match));
        }

        await Promise.all(animPopPromises);
    }

    private async displayBigWins() {
        const bigWinCatergory = slotGetBigWinCategory(this.winAmount, this.betAmount);
        if (bigWinCatergory) {
            await waitFor(0.5);
            await this.match3.onBigWinTrigger?.({
                amount: this.winAmount,
                category: bigWinCatergory,
            });
            await waitFor(0.5);
        }
    }

    /** Handle jackpot-related matches (grand, angelic, blessed, divine) */
    private async processJackpotMatches() {
        await this.match3.jackpot.process(this.betAmount);
    }

    /** Move all existing pieces downward to fill empty cells */
    private async applyGravity() {
        const changes = match3ApplyGravity(this.match3.board.grid);
        console.log('[Match3] Apply gravity - moved pieces:', changes, changes.length);

        const animPromises = [];

        for (const change of changes) {
            const from = change[0];
            const to = change[1];
            const piece = this.match3.board.getPieceByPosition(from);
            if (!piece) continue;

            piece.row = to.row;
            piece.column = to.column;

            const newPosition = this.match3.board.getViewPositionByGridPosition(to);
            animPromises.push(piece.animateFall(newPosition.x, newPosition.y));
        }

        await Promise.all(animPromises);
    }

    /** Create brand-new symbols in empty spaces and animate them falling in */
    private async refillGrid() {
        const result = await BetAPI.spin({
            game: this.match3.game,
            bet: this.betAmount,
        });
        const newPieces = match3FillUp(this.match3.board.grid, this.match3.board.commonTypes, result.reels);

        console.log('[Match3] Refill grid - new pieces:', newPieces.length);

        const animPromises = [];
        const piecesPerColumn: Record<number, number> = {};

        for (const position of newPieces) {
            const pieceType = match3GetPieceType(this.match3.board.grid, position);
            const piece = this.match3.board.createPiece(position, pieceType);

            if (!piecesPerColumn[piece.column]) piecesPerColumn[piece.column] = 0;
            piecesPerColumn[piece.column]++;

            const x = piece.x;
            const y = piece.y;

            const columnIndex = piecesPerColumn[piece.column];
            const height = this.match3.board.getHeight();

            // Spawn piece above the board, stacked by column
            piece.y = -height * 0.5 - columnIndex * this.match3.config.tileSize;

            animPromises.push(piece.animateFall(x, y));
        }

        await Promise.all(animPromises);
    }

    /** Detect scatter symbols and trigger free spins if requirements are met */
    private async processFreeSpinCheckpoint() {
        const scatterMatches = slotGetScatterMatches(this.match3.board.grid);
        const scatterTrigger = gameConfig.getScatterBlocksTrigger();

        const hasScatterTrigger = scatterMatches.some((group) => group.length >= scatterTrigger);

        if (hasScatterTrigger) {
            for (let i = 0; i < 3; i++) {
                const animatePlayPieces = scatterMatches.map((m) => this.match3.board.playPieces(m));
                await Promise.all(animatePlayPieces);

                if (i < 2) await waitFor(1);
            }

            const freeSpinCount = this.match3.freeSpinStats.getAvailableFreeSpins();
            const freeSpinTriggerData = { totalFreeSpins: freeSpinCount };
            await this.match3.onFreeSpinTrigger?.(freeSpinTriggerData);
        } else {
            this.stop();
        }
    }

    /** Determine if another resolution round is required or if processing is complete */
    private async processCheckpoint() {
        const newMatches = slotGetMatches(this.match3.board.grid);
        const emptySpaces = match3GetEmptyPositions(this.match3.board.grid);

        console.log('[Match3] Checkpoint - New matches:', newMatches.length);
        console.log('[Match3] Checkpoint - Empty spaces:', emptySpaces.length);

        if (newMatches.length || emptySpaces.length) {
            console.log('[Match3] Checkpoint - Another sequence run is needed');
            await this.runProcessRound();
        } else {
            console.log('[Match3] Checkpoint - Check for jackpot wins then check free spin wins');
            await this.match3.jackpot.displayJackpotWins();
            await this.displayBigWins();
            await this.processFreeSpinCheckpoint();
        }
    }
}
