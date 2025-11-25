import { Match3 } from './Match3';
import { slotGetMultiplierMatches } from './Match3Utility';
import { gameConfig } from '../utils/gameConfig';
import { waitFor } from '../utils/asyncUtils';

/**
 * Controls the special pieces in the game. Each special piece should have its own
 * special handler that will figure out match patterns (process) that will cause them to spawn
 * and release its power (trigger) when touched or popped out.
 */
export class Match3Jackpot {
    /** The Match3 instance */
    public match3: Match3;
    /** Special record */
    public multipliers: Record<string, number> = {};

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    /** Remove all specials handlers */
    public reset() {
        this.multipliers = {};
    }
    /**
     * Process all specials with existing matches
     */
    /**
     * Process all specials with existing matches
     */
    public async process() {
        this.multipliers = {};
        const matches = slotGetMultiplierMatches(this.match3.board.grid);

        const animePlayPieces = [];
        const pieces = [];
        for (const match of matches) {
            animePlayPieces.push(this.match3.board.playSpecialPieces(match));
            for (const position of match) {
                const piece = this.match3.board.getPieceByPosition(position);
                if (piece) {
                    pieces.push(piece);
                    this.multipliers[piece.type] = (this.multipliers[piece.type] || 0) + 1;
                }
            }
        }

        await Promise.all(animePlayPieces);

        await this.match3.onMultiplierMatch?.({
            pieces: pieces,
        });

        // Trigger jackpot wins sequentially
        await this.processMultiplierJackpots();
    }

    /**
     * Process and display multiplier jackpot wins one at a time
     */
    private async processMultiplierJackpots(): Promise<void> {
        await waitFor(0.5);
        const multipliers = gameConfig.getMultipliers();

        for (const mult of multipliers) {
            if (this.multipliers[mult.type] >= mult.requiredSymbols) {
                const occurance = Math.floor(this.multipliers[mult.type] / mult.requiredSymbols);

                if (this.match3.onMultiplierJackpotTrigger) {
                    await this.match3.onMultiplierJackpotTrigger({
                        multiplier: mult,
                        occurance,
                    });
                }
            }
        }
    }
}
