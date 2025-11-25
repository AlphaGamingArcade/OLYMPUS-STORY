import { Match3 } from './Match3';
import { Match3SpecialBlast } from './specials/Match3SpecialBlast';
import { Match3SpecialColour } from './specials/Match3SpecialColour';
import { Match3SpecialColumn } from './specials/Match3SpecialColumn';
import { Match3SpecialRow } from './specials/Match3SpecialRow';
import { Match3Position, Match3Type, slotGetMultiplierMatches } from './Match3Utility';

/** Interface for special handler */
export interface Match3SpecialHandler {
    /** Match3 instance */
    match3: Match3;
    /** The piece type attributed to this special */
    pieceType: Match3Type;
    /** Find out match patters and spawn special pieces  */
    process(matches: Match3Position[][]): Promise<void>;
    /** Trigger the special effect in position  */
    trigger(pieceType: Match3Type, position: Match3Position): Promise<void>;
}

/** Special handler constructor interface */
export interface Match3SpecialHandlerConstructor {
    new (match3: Match3, pieceType: Match3Type): Match3SpecialHandler;
}

/** All available specials - handlers can be found inside `match3/specials/` folder */
const availableSpecials: Record<string, Match3SpecialHandlerConstructor> = {
    /** Pops out the entire row */
    'special-row': Match3SpecialRow,
    /** Pops out the entire column */
    'special-column': Match3SpecialColumn,
    /** Pops out all pieces of a single type */
    'special-colour': Match3SpecialColour,
    /** Pops out surrounding pieces */
    'special-blast': Match3SpecialBlast,
};

/**
 * Controls the special pieces in the game. Each special piece should have its own
 * special handler that will figure out match patterns (process) that will cause them to spawn
 * and release its power (trigger) when touched or popped out.
 */
export class Match3Multiplier {
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

    /** Check if there are a special handler available with given name */
    public isSpecialAvailable(name: string) {
        return !!availableSpecials[name];
    }

    /**
     * Process all specials with existing matches
     */
    public async process() {
        const matches = slotGetMultiplierMatches(this.match3.board.grid);

        const animePlayPieces = [];
        const pieces = [];
        for (const match of matches) {
            animePlayPieces.push(this.match3.board.playSpecialPieces(match));
            for (const position of match) {
                const piece = this.match3.board.getPieceByPosition(position);
                if (piece) {
                    pieces.push(piece);
                    this.multipliers[piece.type] = (this.multipliers[piece.type] || 0) + 1; // track record
                }
            }
        }

        await Promise.all(animePlayPieces);

        await this.match3.onMultiplierMatch?.({
            pieces: pieces,
        });
    }
}
