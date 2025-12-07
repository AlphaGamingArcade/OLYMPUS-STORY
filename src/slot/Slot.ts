import { Container } from 'pixi.js';
import { SlotActions } from './SlotActions';
import { Jackpot, Match3Config, slotGetConfig } from './SlotConfig';
import { SlotProcess } from './SlotProcess';
import { SlotSymbol } from './SlotSymbol';
import { SlotJackpot } from './SlotJackpot';
import { gameConfig } from '../utils/gameConfig';
import { SlotBigWinCategory } from './SlotUtility';
import { SlotFreeSpinsStats } from './SlotFreeSpinsStats';
import { SlotFreeSpinsProcess } from './SlotFreeSpinsProcess';
import { SlotBoard } from './SlotBoard';
import { SlotAutoplayProcess } from './SlotAutoplayProcess';

// Match3.ts - Holds the state
export enum SpinState {
    IDLE = 'idle',
    SPINNING = 'spinning',
    COMPLETE = 'complete',
}

/** Interface for onMatch event data */
export interface WinMatch {
    types: number[];
    amount: number;
}

export interface SlotOnMatchData {
    /** List of all matches detected in the grid */
    wins: WinMatch[];
}

/** Interface for onMatch event data */
export interface SlotOnJackpotMatchData {
    /** List of all matches detected in the grid */
    symbols: SlotSymbol[];
}

export interface SlotFreeSpinTriggerData {
    /** Free spins won total */
    totalFreeSpins: number;
}

/** Interface for onMatch event data */
export interface SlotOnBigWinTriggerData {
    amount: number;
    category: SlotBigWinCategory;
}

/** Interface for onMatch event data */
export interface SlotOnJackpotTriggerData {
    /** List of all jackpot matches detected in the grid */
    jackpot: Jackpot;
    /** Occurance */
    times: number;
    /** Occurance */
    amount: number;
}

export interface SlotFreeSpinStartData {
    currentSpin: number;
    remainingSpins: number;
}

export interface SlotOnNextFreeSpinData {
    jackpots: Record<string, { type: number; active: number; required: number }>;
    currentSpin: number;
    remainingSpins: number;
}

export interface SlotOnFreeSpinCompleteData {
    amount: number;
    spins: number;
}

export interface SlotOnAutoplayStartData {
    totalSpins: number;
    currentSpin: number;
    remainingSpins: number;
}

export interface SlotOnAutoplaySpinStartData {
    currentSpin: number;
    remainingSpins: number;
}

export interface SlotOnAutoplayCompleteData {
    totalSpins: number;
}

/**
 * The main match3 class that sets up game's sub-systems and provide some useful callbacks.
 * All game events are set as plain callbacks for simplicity
 */
export class Slot extends Container {
    public game = 'olympusstory';
    /** State if spinning */
    public isPlaying: boolean;
    /** Match3 game basic configuration */
    public config: Match3Config;
    /** Compute score, grade, number of matches */
    public freeSpinsStats: SlotFreeSpinsStats;
    /** Holds the grid state and display */
    public board: SlotBoard;
    /** Sort out actions that the player can take */
    public actions: SlotActions;
    /** Process matches and fills up the grid */
    public process: SlotProcess;
    /** Process matches and fills up the grid */
    public freeSpinsProcess: SlotFreeSpinsProcess;
    /** Handles pieces with special powers */
    public jackpot: SlotJackpot;
    /** Handles pieces with special powers */
    public autoplayProcess: SlotAutoplayProcess;

    /** Fires when matches */
    public onMatch?: (data: SlotOnMatchData) => void;
    /** Fires when win */
    public onWin?: (win: number) => void;
    /** Fire when big win */
    public onBigWinTrigger?: (data: SlotOnBigWinTriggerData) => Promise<void>;
    /** Firew when a spin started, regardless of the spin type */
    public onSpinStart?: () => void;

    /** Firew when free spin triggered */
    public onFreeSpinTrigger?: (data: SlotFreeSpinTriggerData) => void;
    /** Fires when special triggered */
    public onJackpotMatch?: (data: SlotOnJackpotMatchData) => Promise<void>;
    /** Fires when multiplier jackpot triggered */
    public onJackpotTrigger?: (data: SlotOnJackpotTriggerData) => Promise<void>;

    /** Fires when the game start auto-processing the grid */
    public onFreeSpinStart?: (data: SlotFreeSpinStartData) => void;
    /** Fires when the game start auto-processing the grid */
    public onNextFreeSpinStart?: (data: SlotOnNextFreeSpinData) => void;
    /** Fires when the game finishes auto-processing the grid */
    public onFreeSpinComplete?: (data: SlotOnFreeSpinCompleteData) => Promise<void>;

    /** Fires when the game start auto-processing the grid */
    public onProcessStart?: () => void;
    /** Fires when the game finishes auto-processing the grid */
    public onProcessComplete?: () => void;
    // Autoplay callbacks
    public onAutoplayStart?: (data: SlotOnAutoplayStartData) => void;
    public onAutoplaySpinStart?: (data: SlotOnAutoplaySpinStartData) => void;
    public onAutoplayComplete?: (data: SlotOnAutoplayCompleteData) => void;

    constructor() {
        super();
        this.isPlaying = false;

        // Game sub-systems
        this.config = slotGetConfig();
        this.board = new SlotBoard(this);
        this.actions = new SlotActions(this);
        this.process = new SlotProcess(this);
        this.jackpot = new SlotJackpot(this);
        this.freeSpinsStats = new SlotFreeSpinsStats(this);
        this.freeSpinsProcess = new SlotFreeSpinsProcess(this);
        this.autoplayProcess = new SlotAutoplayProcess(this);
    }

    /**
     * Sets up a new match3 game with pieces, rows, columns, duration, etc.
     * @param config The config object in which the game will be based on
     */
    public setup(config: Match3Config) {
        const jackpotConfig = gameConfig.getJackpots();
        this.config = config;
        this.reset();

        this.jackpot.setup(jackpotConfig);
        this.board.setup(config);
    }

    /** Fully reset the game */
    public reset() {
        this.interactiveChildren = false;
        this.board.reset();
        this.process.reset();
        this.freeSpinsStats.reset();
        this.freeSpinsProcess.reset();
        this.jackpot.reset();
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async startSpin(bet: number, feature?: number) {
        this.interactiveChildren = false;
        await this.actions.actionSpin(bet, feature);
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async stopSpin() {
        this.interactiveChildren = true;
    }

    /** Start the spin and disable interaction */
    public async startFreeSpin(bet: number) {
        this.interactiveChildren = false;
        await this.actions.actionFreeSpin(bet);
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async stopFreeSpin() {
        this.interactiveChildren = false;
    }

    /** Start the spin and disable interaction */
    public async startAutoplaySpin(bet: number, autoplays: number) {
        this.interactiveChildren = false;
        await this.actions.actionAutoplaySpin(bet, autoplays);
    }

    /** Start the spin and disable interaction */
    public async stopAutoplaySpin(bet: number, autoplays: number) {
        this.interactiveChildren = false;
        await this.actions.actionAutoplaySpin(bet, autoplays);
    }

    /** Pause the game */
    public pause() {
        this.board.pause();
        this.process.pause();
    }

    /** Resume the game */
    public resume() {
        this.board.resume();
        this.process.resume();
    }

    /** Update the timer */
    public update(_delta: number) {
        // this.timer.update(delta);
    }
}
