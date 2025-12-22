import { gameConfig } from '../utils/gameConfig';
import { Jackpot, Pattern, Paytable } from './SlotConfig';

/** Piece type on each position in the grid */
export type SlotType = number;

/** Piece type on each position in the grid */
export type SlotFrame = string;

/** Two-dimensional array represeinting the game board */
export type SlotGrid = SlotType[][];

/** Pair of row & column representing grid coordinates */
export type SlotPosition = { row: number; column: number };

/** Pair of row & column representing grid coordinates */
export type SlotGlobalPosition = { x: number; y: number };

/** Orientation for match checks */
export type SlotOrientation = 'horizontal' | 'vertical';

/** Orientation for match checks */
export type SlotBigWinCategory = 'astounding' | 'remarkable' | 'elegant';

/** Orientation for match checks */
export type SlotJackpotName = 'divine' | 'blessed' | 'angelic' | 'grand';

/**
 * Create a 2D grid matrix filled up with given types
 * Example:
 * [[1, 1, 2, 3]
 *  [3, 1, 1, 3]
 *  [1, 2, 3, 2]
 *  [2, 3, 1, 3]]
 * @param rows Number of rows
 * @param columns Number of columns
 * @param types List of types avaliable to fill up slots
 * @returns A 2D array filled up with types
 */
export function match3CreateGrid(rows = 6, columns = 6, types: SlotType[]) {
    const grid: SlotGrid = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            let type = match3GetRandomType(types);

            // List of rejected types for this position, to prevent them to be picked again
            const excludeList: SlotType[] = [];

            // If the new type match previous types, randomise it again, excluding rejected type
            // to avoid building the grid with pre-made matches
            while (matchPreviousTypes(grid, { row: r, column: c }, type)) {
                excludeList.push(type);
                type = match3GetRandomType(types, excludeList);
            }

            // Create the new row if not exists
            if (!grid[r]) grid[r] = [];

            // Set type for the grid position
            grid[r][c] = type;
        }
    }

    return grid as SlotGrid;
}

/**
 * Create a copy of provided grid
 * @param grid The grid to be cloned
 * @returns A copy of the original grid
 */
export function match3CloneGrid(grid: SlotGrid) {
    const clone: SlotGrid = [];
    for (const row of grid) {
        clone.push(row.slice());
    }
    return clone;
}

/** Check if given type match previous positions in the grid  */
function matchPreviousTypes(grid: SlotGrid, position: SlotPosition, type: SlotType) {
    // Check if previous horizontal positions are forming a match
    const horizontal1 = grid?.[position.row]?.[position.column - 1];
    const horizontal2 = grid?.[position.row]?.[position.column - 2];
    const horizontalMatch = type === horizontal1 && type === horizontal2;

    // Check if previous vertical positions are forming a match
    const vertical1 = grid?.[position.row - 1]?.[position.column];
    const vertical2 = grid?.[position.row - 2]?.[position.column];
    const verticalMatch = type === vertical1 && type === vertical2;

    // Return if either horizontal or vertical psoitions are forming a match
    return horizontalMatch || verticalMatch;
}

/**
 * Get a random type from the type list
 * @param types List of types available to return
 * @param exclude List of types to be excluded from the result
 * @returns A random type picked from the given list
 */
export function match3GetRandomType(types: SlotType[], exclude?: SlotType[]) {
    let list = [...types];

    if (exclude) {
        // If exclude list is provided, exclude them from the available list
        list = types.filter((type) => !exclude.includes(type));
    }

    const index = Math.floor(Math.random() * list.length);

    return list[index];
}

/**
 * Swap two pieces in the grid, based on their positions
 * @param grid The grid to be changed
 * @param positionA The first piece to swap
 * @param positionB The second piece to swap
 */
export function match3SwapPieces(grid: SlotGrid, positionA: SlotPosition, positionB: SlotPosition) {
    const typeA = slotGetPieceType(grid, positionA);
    const typeB = slotGetPieceType(grid, positionB);

    // Only swap pieces if both types are valid (not undefined)
    if (typeA !== undefined && typeB !== undefined) {
        match3SetPieceType(grid, positionA, typeB);
        match3SetPieceType(grid, positionB, typeA);
    }
}

/**
 * Set the piece type in the grid, by position
 * @param grid The grid to be changed
 * @param position The position to be changed
 * @param type The new type for given position
 */
export function match3SetPieceType(grid: SlotGrid, position: SlotPosition, type: number) {
    grid[position.row][position.column] = type;
}

/**
 * Retrieve the piece type from a grid, by position
 * @param grid The grid to be looked up
 * @param position The position in the grid
 * @returns The piece type from given position, undefined if position is invalid
 */
export function slotGetPieceType(grid: SlotGrid, position: SlotPosition) {
    return grid?.[position.row]?.[position.column];
}

/**
 * Check if a position is valid in the grid
 * @param grid The grid in context
 * @param position The position to be validated
 * @returns True if position exists in the grid, false if out-of-bounds
 */
export function match3IsValidPosition(grid: SlotGrid, position: SlotPosition) {
    const rows = grid.length;
    const cols = grid[0].length;
    return position.row >= 0 && position.row < rows && position.column >= 0 && position.column < cols;
}

/**
 * Loop through every position in the grid
 * @param grid The grid in context
 * @param fn Callback for each position in the grid
 */
export function match3ForEach(grid: SlotGrid, fn: (position: SlotPosition, type: SlotType) => void) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            fn({ row: r, column: c }, grid[r][c]);
        }
    }
}

/**
 * Check if two positions are the same
 * @param a First position to compare
 * @param b Second position to compare
 * @returns True if position A row & column are the same of position B
 */
export function match3ComparePositions(a: SlotPosition, b: SlotPosition) {
    return a.row === b.row && a.column == b.column;
}

/**
 * Check if list of positions includes given position
 * @param positions List of positions to check
 * @param position The position to be checked
 * @returns True if position list contains the provided position, false otherwise
 */
export function match3IncludesPosition(positions: SlotPosition[], position: SlotPosition) {
    for (const p of positions) {
        if (match3ComparePositions(p, position)) return true;
    }
    return false;
}

/**
 * Get all matches in the grid, optionally filtering results that involves given positions
 * Example:
 * [[{row: 1, column: 1}, {row: 1, column: 2}, {row: 1, column: 3}]
 *  [{row: 1, column: 1}, {row: 2, column: 1}, {row: 2, column: 1}]]
 * @param grid The grid to be analysed
 * @param filter Optional list of positions that every match should have
 * @param matchSize The length of the match, defaults to 3
 * @returns A list of positions grouped by match, excluding ones not involving filter positions if provided
 */
export function slotGetMatches(grid: SlotGrid) {
    const paytable = gameConfig.getPaytables();
    const specialBlocks = gameConfig.getJackpots();
    const specialTypes = specialBlocks.map((sb) => sb.type);

    const gridMap: Record<string, { positions: SlotPosition[] }> = {};

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            const symbolType = grid[row][col];

            // Do not include special symbols
            if (!specialTypes.includes(symbolType)) {
                if (gridMap[symbolType]) {
                    // Symbol already exists, add position to existing array
                    gridMap[symbolType].positions.push({ column: col, row: row });
                } else {
                    // First occurrence of this symbol, create new entry
                    gridMap[symbolType] = {
                        positions: [{ column: col, row: row }],
                    };
                }
            }
        }
    }

    const allMatches: SlotPosition[][] = [];

    for (let i = 0; i < paytable.length; i++) {
        const symbolType = paytable[i].type;

        if (gridMap[symbolType]) {
            const patterns = paytable[i].patterns;
            const positions = gridMap[symbolType].positions;

            let matchedPattern: Pattern | null = null;

            // Patterns are ordered lowest to highest, so last match wins
            for (let p = 0; p < patterns.length; p++) {
                if (positions.length >= patterns[p].min && positions.length <= patterns[p].max) {
                    matchedPattern = patterns[p];
                }
            }

            // If we found a matching pattern, add to results
            if (matchedPattern) {
                allMatches.push(positions);
            }
        }
    }

    return allMatches;
}

/**
 * Get all special block positions in the grid, grouped by their special type
 * Example:
 * [
 *   [{row: 0, column: 1}, {row: 2, column: 3}],
 *   [{row: 1, column: 2}],
 *   [{row: 3, column: 4}, {row: 4, column: 0}]
 * ]
 * @param grid The grid to be analysed
 * @returns An array of position groups, where each group contains positions of the same special type
 */
export function slotGetJackpotMatches(grid: SlotGrid, configJackpots: Jackpot[]): SlotPosition[][] {
    const jackpotTypes = configJackpots.map((block) => block.type);

    // Use Map to efficiently group by type
    const matchesByType = new Map<number, SlotPosition[]>();

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const cellType = grid[row][col];

            if (jackpotTypes.includes(cellType)) {
                // Get or create group for this type
                let group = matchesByType.get(cellType);
                if (!group) {
                    group = [];
                    matchesByType.set(cellType, group);
                }

                // Add position to the group
                group.push({ row, column: col });
            }
        }
    }

    // Convert Map values to array
    const allMatches = Array.from(matchesByType.values());

    return allMatches;
}

/**
 * Get all special block positions in the grid, grouped by their special type
 * Example:
 * [
 *   [{row: 0, column: 1}, {row: 2, column: 3}],
 *   [{row: 1, column: 2}],
 *   [{row: 3, column: 4}, {row: 4, column: 0}]
 * ]
 * @param grid The grid to be analysed
 * @returns An array of position groups, where each group contains positions of the same special type
 */
export function slotGetExtraScatterMatches(grid: SlotGrid): SlotPosition[][] {
    const scatterTriggers = gameConfig.getExtraScatterTriggers();
    const scatterType = gameConfig.getScatterType();

    // Use Map to efficiently group by type
    const matchesByType = new Map<number, SlotPosition[]>();

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const cellType = grid[row][col];

            if (scatterType == cellType) {
                // Get or create group for this type
                let group = matchesByType.get(cellType);
                if (!group) {
                    group = [];
                    matchesByType.set(cellType, group);
                }

                // Add position to the group
                group.push({ row, column: col });
            }
        }
    }

    // Convert Map values to array
    const allMatches = Array.from(matchesByType.values());

    // Check if any group meets the trigger requirement
    const hasTriggered = allMatches.some((group) => scatterTriggers.includes(group.length));
    if (!hasTriggered) {
        return [];
    }

    return allMatches;
}

/**
 * Get all special block positions in the grid, grouped by their special type
 * Example:
 * [
 *   [{row: 0, column: 1}, {row: 2, column: 3}],
 *   [{row: 1, column: 2}],
 *   [{row: 3, column: 4}, {row: 4, column: 0}]
 * ]
 * @param grid The grid to be analysed
 * @returns An array of position groups, where each group contains positions of the same special type
 */
export function slotGetScatterMatches(grid: SlotGrid): SlotPosition[][] {
    const scatterTriggers = gameConfig.getScatterTriggers();
    const scatterType = gameConfig.getScatterType();

    // Use Map to efficiently group by type
    const matchesByType = new Map<number, SlotPosition[]>();

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const cellType = grid[row][col];

            if (scatterType == cellType) {
                // Get or create group for this type
                let group = matchesByType.get(cellType);
                if (!group) {
                    group = [];
                    matchesByType.set(cellType, group);
                }

                // Add position to the group
                group.push({ row, column: col });
            }
        }
    }

    // Convert Map values to array
    const allMatches = Array.from(matchesByType.values());

    // Check if any group meets the trigger requirement
    const hasScatterTrigger = allMatches.some((matches) => matches.length >= Math.min(...scatterTriggers));
    if (!hasScatterTrigger) {
        return [];
    }

    return allMatches;
}

/**
 * Move all pieces in the grid to their next empty position, vertically
 * @param grid The grid to be changed
 * @returns All position that have been changed.
 * Ex.: [[{row: 1, column: 1}, {row: 2, column: 1}]] - That piece moved 1 row down
 */
export function slotGetMismatches(grid: SlotGrid, refillGrid: SlotGrid) {
    const rows = grid.length;
    const columns = grid[0].length;
    const mismatches: SlotPosition[] = [];

    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < columns; c++) {
            const position = { row: r, column: c };
            const type = slotGetPieceType(grid, position);
            if (type != refillGrid[r][c]) {
                mismatches.push({ row: r, column: c });
            }
        }
    }
    return mismatches;
}

/**
 * Move all pieces in the grid to their next empty position, vertically
 * @param grid The grid to be changed
 * @returns All position that have been changed.
 * Ex.: [[{row: 1, column: 1}, {row: 2, column: 1}]] - That piece moved 1 row down
 */
export function slotApplyGravity(grid: SlotGrid) {
    const rows = grid.length;
    const columns = grid[0].length;
    const changes: SlotPosition[][] = [];
    for (let r = rows - 1; r >= 0; r--) {
        for (let c = 0; c < columns; c++) {
            let position = { row: r, column: c };
            const belowPosition = { row: r + 1, column: c };
            let hasChanged = false;

            // Skip this one if position below is out of bounds
            if (!match3IsValidPosition(grid, belowPosition)) continue;

            // Retrive the type of the position below
            let belowType = slotGetPieceType(grid, belowPosition);

            // Keep moving the piece down if position below is valid and empty
            while (match3IsValidPosition(grid, belowPosition) && belowType === 0) {
                hasChanged = true;
                match3SwapPieces(grid, position, belowPosition);
                position = { ...belowPosition };
                belowPosition.row += 1;
                belowType = slotGetPieceType(grid, belowPosition);
            }

            if (hasChanged) {
                // Append a new change if position has changed [<from>, <to>]
                changes.push([{ row: r, column: c }, position]);
            }
        }
    }

    return changes;
}

/**
 * Find out all empty spaces (type=0) in the grid
 * @param grid The grid to be verified
 * @returns A list of empty positions
 */
export function slotGetEmptyPositions(grid: SlotGrid) {
    const positions: SlotPosition[] = [];
    const rows = grid.length;
    const columns = grid[0].length;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            if (!grid[r][c]) {
                positions.push({ row: r, column: c });
            }
        }
    }
    return positions;
}

/**
 * Convert grid to a visual string representation, useful for debugging
 * @param grid The grid to be converted
 * @returns String representing the grid
 */
export function slotGridToString(grid: SlotGrid) {
    const lines: string[] = [];
    for (const row of grid) {
        const list = row.map((type) => String(type).padStart(2, '0'));
        lines.push('|' + list.join('|') + '|');
    }
    return lines.join('\n');
}

/**
 * Loop through the grid and fill up all empty positions with random types
 * @param grid The grid to be changed
 * @param types List of types available to randomise
 * @returns A list with all positions that have their types changed from empty (0) to something
 */
export function slotFillUp(grid: SlotGrid, _types: SlotType[], tempGrid: SlotGrid) {
    const rows = grid.length;
    const columns = grid[0].length;
    const newPositions: SlotPosition[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            // If this position is empty (0)...
            if (!grid[r][c]) {
                grid[r][c] = tempGrid[r][c];
                newPositions.push({ row: r, column: c });
            }
        }
    }

    return newPositions.reverse();
}

/**
 * Loop through the grid and fill up all empty positions with random types
 * @param grid The grid to be changed
 * @param types List of types available to randomise
 * @returns A list with all positions that have their types changed from empty (0) to something
 */
export function slotGetPositions(grid: SlotGrid) {
    const rows = grid.length;
    const columns = grid[0].length;
    const newPositions: SlotPosition[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            newPositions.push({ row: r, column: c });
        }
    }
    return newPositions.reverse();
}

/**
 * Filter out repeated positions from position list
 * @param positions List of positions to be filtered
 * @returns A new list without repeated positions
 */
export function match3FilterUniquePositions(positions: SlotPosition[]) {
    const result: SlotPosition[] = [];
    const register: string[] = [];

    for (const position of positions) {
        const id = position.row + ':' + position.column;
        if (!register.includes(id)) {
            register.push(id);
            result.push(position);
        }
    }

    return result;
}

/**
 * Convert a grid position to string, useful for mapping values
 * @param position The position to be stringified
 * @returns A string representation of the position. Ex.: {row: 3, column: 1} => "3:1"
 */
export function SlotPositionToString(position: SlotPosition) {
    return position.row + ':' + position.column;
}

/**
 * Convert back a string to grid position
 * @param str The string to be converted to a grid position
 * @returns A position object. Ex.: "3:1" => {row: 3, column: 1}
 */
export function match3StringToPosition(str: string) {
    const split = str.split(':');
    return { row: Number(split[0]), column: Number(split[1]) };
}

/** Regular matches win Amount */
export function slotGetRegularMatchesWinAmount(bet: number, types: number[], paytable: Paytable | undefined): number {
    if (types.length === 0 || !paytable) return 0;

    const matchedPattern = paytable.patterns.find(
        (pattern) => types.length >= pattern.min && types.length <= pattern.max,
    );

    return matchedPattern ? bet * matchedPattern.multiplier : 0;
}

/** Get  */
export function getRangeIndex(value: number, thresholds: number[]): number {
    const index = thresholds.findIndex((threshold) => value < threshold);
    return index === -1 ? thresholds.length : index;
}

export function slotGetBigWinCategory(amount: number, bet: number): undefined | SlotBigWinCategory {
    const bigWinMultipliers = [20, 40, 60];
    const bigWinCategory: SlotBigWinCategory[] = ['remarkable', 'elegant', 'astounding'];

    for (let i = 0; i < bigWinMultipliers.length; i++) {
        if (amount < bigWinMultipliers[i] * bet) {
            return i === 0 ? undefined : bigWinCategory[i - 1];
        }
    }

    // Amount >= highest threshold
    return bigWinCategory[bigWinCategory.length - 1];
}

export function slotGetJackpotWinsByType(
    jackpots: Record<string, { type: number; active: number }>,
    configJackpots: Jackpot[],
) {
    const jackpotWinsByType: Record<string, { times: number; jackpot: Jackpot }> = {};
    for (const [type, jackpotData] of Object.entries(jackpots)) {
        const configJackpot = configJackpots.find((config) => config.type === Number(type));

        if (configJackpot && jackpotData.active >= configJackpot.requiredSymbols) {
            const times = Math.floor(jackpotData.active / configJackpot.requiredSymbols);

            if (times > 0) {
                jackpotWinsByType[type] = {
                    times,
                    jackpot: configJackpot,
                };
            }
        }
    }
    return jackpotWinsByType;
}

/**
 * Carry over remaining jackpot symbols that did not win to the next free spin
 * @param jackpots - Record of jackpot data by type
 * @returns Updated jackpots with carryover values
 */
export function slotGetNextFreeSpinJackpots(
    jackpots: Record<string, { type: number; active: number; required: number }>,
): Record<string, { type: number; active: number; required: number }> {
    for (const [, jackpot] of Object.entries(jackpots)) {
        const remainder = jackpot.active % jackpot.required;
        jackpot.active = remainder;
    }

    return jackpots;
}
