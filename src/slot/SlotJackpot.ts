import { Slot, SlotOnNextFreeSpinData } from './Slot';
import { SlotPosition, slotGetJackpotMatches, slotGetJackpotWinsByType } from './SlotUtility';
import { SlotSymbol } from './SlotSymbol';
import { Jackpot } from './SlotConfig';
import { waitFor } from '../utils/asyncUtils';

/**
 * Controls the special pieces in the game. Each special piece should have its own
 * special handler that will figure out match patterns (process) that will cause them to spawn
 * and release its power (trigger) when touched or popped out.
 */
export class SlotJackpot {
    public processing: boolean = false;
    /** The Slot instance */
    public slot: Slot;
    /** Bet amount */
    public betAmount = 0;
    /** Jackpot record */
    public jackpots: Record<string, { type: number; active: number; required: number }> = {};
    /** Jackpot record */
    public winJackpots: Record<string, { type: number; active: number; required: number }> = {};
    /** Config Jackpots */
    private configJackpots: Jackpot[];

    constructor(slot: Slot) {
        this.slot = slot;
        this.configJackpots = [];
        this.initializeJackpots();
    }

    public setup(jackpotConfig: Jackpot[]) {
        this.configJackpots = jackpotConfig;
    }

    /** Remove all specials handlers */
    public reset() {
        this.betAmount = 0;
        this.initializeJackpots();
        this.processing = false;
    }

    private initializeJackpots() {
        for (const config of this.configJackpots) {
            this.jackpots[config.type] = {
                type: config.type,
                active: 0,
                required: config.requiredSymbols,
            };
        }
    }

    public async process(bet: number) {
        this.betAmount = bet;

        const matches = slotGetJackpotMatches(this.slot.board.grid, this.configJackpots);
        const piecesByType: Record<number, SlotSymbol[]> = {};

        // Collect all pieces by type
        for (const match of matches) {
            for (const position of match) {
                const piece = this.slot.board.getPieceByPosition(position);
                if (piece) {
                    (piecesByType[piece.type] ??= []).push(piece);

                    // Simply increment - structure already exists
                    if (this.jackpots[piece.type]) {
                        this.jackpots[piece.type].active += 1;
                    }
                }
            }
        }

        // winPieces are grouped per jackpot symbol
        const winPieces: SlotSymbol[][] = [];
        const nonWinPieces: SlotSymbol[] = [];

        for (const configJackpot of this.configJackpots) {
            const piecesOfType = piecesByType[configJackpot.type] || [];
            if (piecesOfType.length >= configJackpot.requiredSymbols) {
                winPieces.push(piecesOfType);
            } else if (piecesOfType.length > 0) {
                nonWinPieces.push(...piecesOfType);
            }
        }

        // Sort by piece count, descending (most pieces first)
        winPieces.sort((a, b) => b.length - a.length);

        // Process winning groups one at a time
        for (const symbols of winPieces) {
            const positions: SlotPosition[] = symbols.map((symbol) => ({ row: symbol.row, column: symbol.column }));
            this.slot.board.playPieces(positions);
            await this.slot.onJackpotMatch?.({
                symbols,
            });
        }

        // Animate non-winning pieces all at once
        if (nonWinPieces.length > 0) {
            const positions: SlotPosition[] = nonWinPieces.map((symbol) => ({
                row: symbol.row,
                column: symbol.column,
            }));
            this.slot.board.playPieces(positions);
            await this.slot.onJackpotMatch?.({
                symbols: nonWinPieces,
            });
        }
    }

    public async displayJackpotWins() {
        const jackpotWinsByType = slotGetJackpotWinsByType(this.jackpots, this.configJackpots);

        // Display modals for each winning jackpot
        for (const [, jackpotWinData] of Object.entries(jackpotWinsByType)) {
            await waitFor(0.5);

            const amount = jackpotWinData.times * (this.betAmount * jackpotWinData.jackpot.multiplier);
            this.slot.process.addWinAmount(amount);

            await this.slot.onJackpotTrigger?.({
                jackpot: jackpotWinData.jackpot,
                times: jackpotWinData.times,
                amount: amount,
            });

            await waitFor(0.5);
        }
    }

    /** Carry over remaining points that did not win on last spin */
    public setupNextFreeSpinJackpots(data: SlotOnNextFreeSpinData) {
        this.jackpots = data.jackpots;
    }

    /** Free Spin display jackpot */
    public async displayFreeSpinJackpotWins() {
        const jackpotWinsByType = slotGetJackpotWinsByType(this.jackpots, this.configJackpots);

        // Display modals for each winning jackpot
        for (const [, jackpotWinData] of Object.entries(jackpotWinsByType)) {
            await waitFor(0.5);

            const amount = jackpotWinData.times * (this.betAmount * jackpotWinData.jackpot.multiplier);
            this.slot.freeSpinsProcess.addWinAmount(amount);

            await this.slot.onJackpotTrigger?.({
                jackpot: jackpotWinData.jackpot,
                times: jackpotWinData.times,
                amount: amount,
            });

            await waitFor(0.5);
        }
    }
}
