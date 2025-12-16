import { gameConfig } from '../utils/gameConfig';

/** Default match3 configuration */
const defaultConfig = {
    rows: 5,
    columns: 6,
    tileSize: 140,
};

/** Slot configuration */
export type SlotConfig = typeof defaultConfig;

/** Build a config object overriding default values if suitable */
export function slotGetConfig(): SlotConfig {
    return defaultConfig;
}

export type SlotSpinMode = 'quick-spin' | 'turbo-spin' | 'normal-spin';

// This creates a readonly tuple type with 4 specific string values
export const SlotJackpotNames = ['grand', 'angelic', 'blessed', 'divine'];

export const SlotSymbols = [
    'symbol-laurel',
    'symbol-hourglass',
    'symbol-boot',
    'symbol-thunder',
    'symbol-chalice',
    'symbol-trident',
    'symbol-ring',
    'symbol-chestplate',
    'symbol-helmet',
    'symbol-scatter',
    'symbol-grand',
    'symbol-angelic',
    'symbol-blessed',
    'symbol-divine',
];

export function slotGetSpinModeDelay(mode: SlotSpinMode): number {
    if (mode == 'normal-spin') {
        return 100;
    }
    if (mode == 'quick-spin') {
        return 50;
    }
    return 0;
}

/**
 * Map of all available blocks for the game.
 * Each item in these lists should have a corresponding pixi texture with the same name
 */

export type Block = number;

/** Mount a list of blocks available */
export function slotGetTypes(): Block[] {
    return gameConfig.getTypes();
}

/** Mount a list of blocks available */
export function slotGetSymbols(): string[] {
    return SlotSymbols;
}

/** Mount a list of blocks available */
export function slotGetJackpotNames(): string[] {
    return SlotJackpotNames;
}

/** Default special block tier configuration */
const defaultJackpot = {
    type: 9,
    multiplier: 100,
    requiredSymbols: 5,
};

export type Jackpot = typeof defaultJackpot;

/** Default pattern configuration */

export type Pattern = {
    min: number;
    max: number;
    multiplier: number;
};

const defaultPaytable = {
    type: 0,
    patterns: [] as Pattern[],
};

export type Paytable = typeof defaultPaytable;

/** Mount a list of patterns available*/
export function slotGetPaytables(): Paytable[] {
    return gameConfig.getPaytables();
}
