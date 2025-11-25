import { Match3 } from './Match3';
import { Match3Position, slotGetJackpotMatches } from './SlotUtility';
import { gameConfig } from '../utils/gameConfig';
import { SlotSymbol } from './SlotSymbol';

/**
 * Controls the special pieces in the game. Each special piece should have its own
 * special handler that will figure out match patterns (process) that will cause them to spawn
 * and release its power (trigger) when touched or popped out.
 */
export class Match3Jackpot {
    public processing: boolean = false;
    /** The Match3 instance */
    public match3: Match3;
    /** Jackpot record */
    public jackpots: Record<string, { type: number; active: number }> = {};

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    /** Remove all specials handlers */
    public reset() {
        this.jackpots = {};
        this.processing = false;
    }

    public async process() {
        this.jackpots = {};

        const configJackpots = gameConfig.getJackpots();
        const matches = slotGetJackpotMatches(this.match3.board.grid);
        const piecesByType: Record<number, SlotSymbol[]> = {};

        // Collect all pieces by type
        for (const match of matches) {
            for (const position of match) {
                const piece = this.match3.board.getPieceByPosition(position);
                if (piece) {
                    (piecesByType[piece.type] ??= []).push(piece);

                    this.jackpots[piece.type] = {
                        type: piece.type,
                        active: (this.jackpots[piece.type]?.active || 0) + 1,
                    };
                }
            }
        }

        const groupPieces: SlotSymbol[][] = [];
        const nonWinPieces: SlotSymbol[] = [];

        for (const configJackpot of configJackpots) {
            const piecesOfType = piecesByType[configJackpot.type] || [];
            if (piecesOfType.length >= configJackpot.requiredSymbols) {
                groupPieces.push(piecesOfType);
            } else if (piecesOfType.length > 0) {
                nonWinPieces.push(...piecesOfType);
            }
        }

        // Sort by piece count, descending (most pieces first)
        groupPieces.sort((a, b) => b.length - a.length);

        // Process winning groups one at a time
        for (const symbols of groupPieces) {
            const positions: Match3Position[] = symbols.map((symbol) => ({ row: symbol.row, column: symbol.column }));
            await this.match3.board.playPieces(positions);
            await this.match3.onJackpotMatch?.({
                symbols,
            });
        }

        // Animate non-winning pieces all at once
        if (nonWinPieces.length > 0) {
            const positions: Match3Position[] = nonWinPieces.map((symbol) => ({
                row: symbol.row,
                column: symbol.column,
            }));
            await this.match3.board.playPieces(positions);
            await this.match3.onJackpotMatch?.({
                symbols: nonWinPieces,
            });
        }
    }
}
