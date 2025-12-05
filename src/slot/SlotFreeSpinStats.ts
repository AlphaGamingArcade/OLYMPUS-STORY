import { Match3 } from './Match3';

/** Default gameplay stats data */
const defaultStatsData = {
    win: 0,
    totalFreeSpinsWon: 0,
    totalFreeSpinsPlayed: 0,
    availableFreeSpins: 0,
};

/** gameplay stats data */
export type SlotFreeSpinStatsData = typeof defaultStatsData;

export type SlotOnWinFreeSpinData = { freeSpins: number };
export type SlotOnWinData = { amount: number };

/**
 * Computes scores and general gameplay stats during the session.
 */
export class SlotFreeSpinStats {
    /** The Match3 instance */
    private match3: Match3;
    /** Current internal stats data */
    private data: SlotFreeSpinStatsData;

    constructor(match3: Match3) {
        this.match3 = match3;
        this.data = { ...defaultStatsData };
    }

    /**
     * Reset all stats
     */
    public reset() {
        this.data = { ...defaultStatsData };
    }

    /**
     * Register newly won free spins
     * @param data The free spin win data
     */
    public registerWinFreeSpins(data: SlotOnWinFreeSpinData) {
        this.data.totalFreeSpinsWon += data.freeSpins; // Accumulate, don't replace!
        this.data.availableFreeSpins += data.freeSpins;

        console.log(
            `[SlotFreeSpinStats] Won ${data.freeSpins} free spins! Total won: ${this.data.totalFreeSpinsWon} ${this.match3.board.grid}`,
        );
    }

    /**
     * Register newly won free spins
     * @param data The free spin win data
     */
    public registerWin(data: SlotOnWinData) {
        this.data.win += data.amount;
    }

    /**
     * Mark a free spin as consumed/played
     */
    public consumeFreeSpin() {
        if (this.data.availableFreeSpins > 0) {
            this.data.availableFreeSpins--;
            this.data.totalFreeSpinsPlayed++;

            console.log(`[SlotFreeSpinStats] Free spin consumed. Remaining: ${this.data.availableFreeSpins}`);
        }
    }

    /**
     * Check if player has free spins available
     */
    public hasAvailableFreeSpins(): boolean {
        return this.data.availableFreeSpins > 0;
    }

    /**
     * Get currently available free spins
     */
    public getAvailableFreeSpins(): number {
        return this.data.availableFreeSpins;
    }

    /**
     * Get total free spins won (historical)
     */
    public getTotalFreeSpinsWon(): number {
        return this.data.totalFreeSpinsWon;
    }

    /**
     * Get total free spins played (historical)
     */
    public getTotalFreeSpinsPlayed(): number {
        return this.data.totalFreeSpinsPlayed;
    }

    public getWin() {
        return this.data.win;
    }
}
