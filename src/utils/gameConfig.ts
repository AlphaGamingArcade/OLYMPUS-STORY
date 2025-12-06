import { Block, Jackpot, Paytable } from '../slot/SlotConfig';

// Default fallbacks (keep your existing arrays as fallbacks)
const defaultBlocks: Block[] = [
    {
        type: 1,
        symbol: 'symbol-laurel',
        name: 'Laurel',
    },
    {
        type: 2,
        symbol: 'symbol-hourglass',
        name: 'Hourglass',
    },
    {
        type: 3,
        symbol: 'symbol-boot',
        name: 'Boot',
    },
    {
        type: 4,
        symbol: 'symbol-thunder',
        name: 'Thunder',
    },
    {
        type: 5,
        symbol: 'symbol-chalice',
        name: 'Chalice',
    },
    {
        type: 6,
        symbol: 'symbol-trident',
        name: 'Trident',
    },
    {
        type: 7,
        symbol: 'symbol-ring',
        name: 'Ring',
    },
    {
        type: 8,
        symbol: 'symbol-chestplate',
        name: 'Chestplate',
    },
    {
        type: 9,
        symbol: 'symbol-helmet',
        name: 'Helmet',
    },
    {
        type: 10,
        symbol: 'symbol-scatter',
        name: 'Scatter',
    },
    {
        type: 11,
        symbol: 'symbol-grand',
        name: 'Grand',
    },
    {
        type: 12,
        symbol: 'symbol-angelic',
        name: 'Angelic',
    },
    {
        type: 13,
        symbol: 'symbol-blessed',
        name: 'Blessed',
    },
    {
        type: 14,
        symbol: 'symbol-divine',
        name: 'Divine',
    },
];
const defaultScatterBlocksTrigger: number = 4;

const defaultBuyFreeSpinBetMultiplier: number = 100;

const defaultScatterBlocks: Block[] = [
    {
        type: 10,
        symbol: 'symbol-scatter',
        name: 'Scatter',
    },
];

const defaultSpecialBlocks: Block[] = [
    {
        type: 11,
        symbol: 'symbol-grand',
        name: 'Grand',
    },
    {
        type: 12,
        symbol: 'symbol-angelic',
        name: 'Angelic',
    },
    {
        type: 13,
        symbol: 'symbol-blessed',
        name: 'Blessed',
    },
    {
        type: 14,
        symbol: 'symbol-divine',
        name: 'Divine',
    },
];

const defaultJackpot: Jackpot[] = [
    {
        id: 'divine',
        name: 'DIVINE',
        type: 14,
        multiplier: 100,
        requiredSymbols: 5,
        order: 2,
    },
    {
        id: 'blessed',
        name: 'BLESSED',
        type: 13,
        multiplier: 50,
        requiredSymbols: 4,
        order: 3,
    },
    {
        id: 'angelic',
        name: 'ANGELIC',
        type: 12,
        multiplier: 20.0,
        requiredSymbols: 3,
        order: 4,
    },
    {
        id: 'grand',
        name: 'GRAND',
        type: 11,
        multiplier: 10.0,
        requiredSymbols: 2,
        order: 5,
    },
];

const defaultPaytables: Paytable[] = [
    {
        type: 1,
        patterns: [
            { min: 8, max: 9, multiplier: 20.0 },
            { min: 10, max: 11, multiplier: 50.0 },
            { min: 12, max: 30, multiplier: 100.0 },
        ],
    },
    {
        type: 2,
        patterns: [
            { min: 8, max: 9, multiplier: 5.0 },
            { min: 10, max: 11, multiplier: 20.0 },
            { min: 12, max: 30, multiplier: 50.0 },
        ],
    },
    {
        type: 3,
        patterns: [
            { min: 8, max: 9, multiplier: 4.0 },
            { min: 10, max: 11, multiplier: 10.0 },
            { min: 12, max: 30, multiplier: 30.0 },
        ],
    },
    {
        type: 4,
        patterns: [
            { min: 8, max: 9, multiplier: 3.0 },
            { min: 10, max: 11, multiplier: 4.0 },
            { min: 12, max: 30, multiplier: 24.0 },
        ],
    },
    {
        type: 5,
        patterns: [
            { min: 8, max: 9, multiplier: 2.0 },
            { min: 10, max: 11, multiplier: 3.0 },
            { min: 12, max: 30, multiplier: 20.0 },
        ],
    },
    {
        type: 6,
        patterns: [
            { min: 8, max: 9, multiplier: 1.6 },
            { min: 10, max: 11, multiplier: 2.4 },
            { min: 12, max: 30, multiplier: 16.0 },
        ],
    },
    {
        type: 7,
        patterns: [
            { min: 8, max: 9, multiplier: 1.0 },
            { min: 10, max: 11, multiplier: 2.0 },
            { min: 12, max: 30, multiplier: 10.0 },
        ],
    },
    {
        type: 8,
        patterns: [
            { min: 8, max: 9, multiplier: 1.0 },
            { min: 10, max: 11, multiplier: 2.0 },
            { min: 12, max: 30, multiplier: 10.0 },
        ],
    },
    {
        type: 9,
        patterns: [
            { min: 8, max: 9, multiplier: 1.0 },
            { min: 10, max: 11, multiplier: 2.0 },
            { min: 12, max: 30, multiplier: 10.0 },
        ],
    },
    {
        type: 10,
        patterns: [],
    },
    {
        type: 11,
        patterns: [],
    },
    {
        type: 12,
        patterns: [],
    },
    {
        type: 13,
        patterns: [],
    },
    {
        type: 14,
        patterns: [],
    },
];

class GameConfig {
    // Configuration data
    private blocks: Block[] = defaultBlocks;
    private specialBlocks: Block[] = defaultSpecialBlocks;
    private scatterBlocksTrigger: number = defaultScatterBlocksTrigger;
    private scatterBlocks: Block[] = defaultScatterBlocks;
    private paytables: Paytable[] = defaultPaytables;
    private paytablesByType: Record<number, Paytable> = {};
    private jackpots: Jackpot[] = defaultJackpot;
    private buyFreeSpinBetMultiplier: number = defaultBuyFreeSpinBetMultiplier;

    public constructor() {
        this.paytablesByType = this.paytables.reduce(
            (acc, paytable) => {
                acc[paytable.type] = paytable;
                return acc;
            },
            {} as Record<number, Paytable>,
        );
    }

    // Setters
    setBlocks(blocks: Block[]) {
        this.blocks = blocks;
    }

    setSpecialBlocks(blocks: Block[]) {
        this.specialBlocks = blocks;
    }

    setScatterBlocksTrigger(count: number) {
        this.scatterBlocksTrigger = count;
    }

    setBuyFreeSpinBetMultiplier(multiplier: number) {
        this.buyFreeSpinBetMultiplier = multiplier;
    }

    setScatterBlocks(blocks: Block[]) {
        this.scatterBlocks = blocks;
    }

    setPaytables(paytables: Paytable[]) {
        this.paytables = paytables;

        this.paytablesByType = this.paytables.reduce(
            (acc, paytable) => {
                acc[paytable.type] = paytable;
                return acc;
            },
            {} as Record<number, Paytable>,
        );
    }

    setJackpots(jackpots: Jackpot[]) {
        this.jackpots = jackpots;
    }

    // Getters
    getBlocks(): Block[] {
        return this.blocks;
    }

    getSpecialBlocks(): Block[] {
        return this.specialBlocks;
    }

    getScatterBlocksTrigger() {
        return this.scatterBlocksTrigger;
    }

    getBuyFreeSpinBetMultiplier() {
        return this.buyFreeSpinBetMultiplier;
    }

    getScatterBlocks(): Block[] {
        return this.scatterBlocks;
    }

    getPaytables(): Paytable[] {
        return this.paytables;
    }

    getPaytableByType(type: number): Paytable | undefined {
        const paytable = this.paytablesByType[type];
        return paytable;
    }

    getJackpots(): Jackpot[] {
        return this.jackpots;
    }

    // Useful for debugging
    reset(): void {
        this.blocks = defaultBlocks;
        this.paytables = defaultPaytables;
        this.scatterBlocks = defaultScatterBlocks;
        this.specialBlocks = defaultSpecialBlocks;
    }
}

export const gameConfig = new GameConfig();
