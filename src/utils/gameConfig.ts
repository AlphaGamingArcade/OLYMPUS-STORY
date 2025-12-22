import { Jackpot, Paytable } from '../slot/SlotConfig';
import { SlotType } from '../slot/SlotUtility';

// Default fallbacks (keep your existing arrays as fallbacks)
const defaultTypes: SlotType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

const defaultBuyFeatureBetMultiplier: number = 100;

const defaultScatterType: SlotType = 10;
const defaultScatterTriggers: number[] = [4, 5, 6];

const defaultJackpot: Jackpot[] = [
    {
        type: 11,
        multiplier: 10.0,
        requiredSymbols: 2,
    },
    {
        type: 12,
        multiplier: 20.0,
        requiredSymbols: 3,
    },
    {
        type: 13,
        multiplier: 50,
        requiredSymbols: 4,
    },
    {
        type: 14,
        multiplier: 100,
        requiredSymbols: 5,
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
    private types: SlotType[] = defaultTypes;
    private scatterType: SlotType = 10;
    private scatterTriggers: number[] = [4, 5, 6];
    private scatterFreeSpins: number[] = [10, 15, 20];
    private extraScatterTriggers: number[] = [3, 4, 5, 6];
    private extraScatterFreeSpins: number[] = [5, 10, 15, 20];
    private paytables: Paytable[] = defaultPaytables;
    private paytablesByType: Record<number, Paytable> = {};
    private jackpots: Jackpot[] = defaultJackpot;
    private buyFeatureBetMultiplier: number = defaultBuyFeatureBetMultiplier;

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
    setTypes(types: SlotType[]) {
        this.types = types;
    }

    setScatterType(type: SlotType) {
        this.scatterType = type;
    }

    setScatterTriggers(triggers: number[]) {
        this.scatterTriggers = triggers;
    }

    setScatterFreeSpins(freeSpins: number[]) {
        this.scatterFreeSpins = freeSpins;
    }

    setExtraScatterTriggers(triggers: number[]) {
        this.extraScatterTriggers = triggers;
    }

    setExtraScatterFreeSpins(freeSpins: number[]) {
        this.extraScatterFreeSpins = freeSpins;
    }

    setBuyFeatureBetMultiplier(multiplier: number) {
        this.buyFeatureBetMultiplier = multiplier;
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
    getTypes(): SlotType[] {
        return this.types;
    }

    getScatterTriggers() {
        return this.scatterTriggers;
    }

    getScatterFreeSpins() {
        return this.scatterFreeSpins;
    }

    getExtraScatterTriggers() {
        return this.extraScatterTriggers;
    }

    getExtraScatterFreeSpins() {
        return this.extraScatterFreeSpins;
    }

    getBuyFeatureBetMultiplier() {
        return this.buyFeatureBetMultiplier;
    }

    getScatterType(): SlotType {
        return this.scatterType;
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
        this.types = defaultTypes;
        this.paytables = defaultPaytables;
        this.scatterType = defaultScatterType;
        this.scatterTriggers = defaultScatterTriggers;
    }
}

export const gameConfig = new GameConfig();
