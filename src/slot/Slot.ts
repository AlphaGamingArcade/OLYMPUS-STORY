import { Container } from 'pixi.js';
import { SlotActions } from './SlotActions';
import { Jackpot, SlotConfig, slotGetConfig, SlotSpinMode } from './SlotConfig';
import { SlotProcess } from './SlotProcess';
import { SlotSymbol } from './SlotSymbol';
import { SlotJackpot } from './SlotJackpot';
import { gameConfig } from '../utils/gameConfig';
import { SlotBigWinCategory } from './SlotUtility';
import { SlotFreeSpinsStats, SlotOnWinExtraFreeSpinData } from './SlotFreeSpinsStats';
import { SlotFreeSpinsProcess } from './SlotFreeSpinsProcess';
import { SlotBoard } from './SlotBoard';
import { SlotAutoplayProcess } from './SlotAutoplayProcess';

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
export interface SlotOnScatterMatch {
    /** List of all matches detected in the grid */
    symbols: SlotSymbol[];
}

/** Interface for onMatch event data */
export interface SlotOnJackpotMatchData {
    /** List of all matches detected in the grid */
    symbols: SlotSymbol[];
}

export interface SlotOnWinFreeSpinTriggerData {
    /** Free spins won total */
    totalFreeSpins: number;
}

export interface SlotExtraFreeSpinTriggerData {
    /** Free spins won total */
    totalExtraFreeSpins: number;
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

/** Interface for onMatch event data */
export interface SlotOnColumnMoveStartData {}

/** Interface for onMatch event data */
export interface SlotOnColumnMoveCompleteData {}

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

export interface SlotOnAutoplaySpinCompleteData {
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
    /** Game code */
    public game = 'olympusstory';
    /** Playing flag */
    public playing = false;
    /** spin mode */
    public spinMode: SlotSpinMode = 'normal-spin';
    /** spin mode */
    public requireSpinInterrupt = false;
    /** Autoplay Playing flag */
    public autoplayPlaying = false;
    /** Autoplay Playing flag */
    public freeSpinPlaying = false;
    /** Slot game basic configuration */
    public config: SlotConfig;
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
    /** Fire when free spin triggered */
    public onWinExtraFreeSpinTrigger?: (data: SlotOnWinExtraFreeSpinData) => void;
    /** Fire when free spin triggered */
    public onWinFreeSpinTrigger?: (data: SlotOnWinFreeSpinTriggerData) => void;
    /** Fires when special triggered */
    public onScatterMatch?: (data: SlotOnJackpotMatchData) => Promise<void>;
    /** Fires when special triggered */
    public onJackpotMatch?: (data: SlotOnJackpotMatchData) => Promise<void>;
    /** Fires when multiplier jackpot triggered */
    public onJackpotTrigger?: (data: SlotOnJackpotTriggerData) => Promise<void>;

    /** Fires when multiplier jackpot triggered */
    public onColumnMoveStart?: (data: SlotOnColumnMoveStartData) => Promise<void>;
    /** Fires when multiplier jackpot triggered */
    public onColumnMoveComplete?: (data: SlotOnColumnMoveCompleteData) => Promise<void>;
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
    // Fires when autoplay start
    public onAutoplayStart?: (data: SlotOnAutoplayStartData) => void;
    // Fires when autoplay Spin start
    public onAutoplaySpinStart?: (data: SlotOnAutoplaySpinStartData) => void;
    // Fires when autoplay Spin start
    public onAutoplaySpinComplete?: (data: SlotOnAutoplaySpinStartData) => void;
    // Fires when autoplay completed
    public onAutoplayComplete?: (data: SlotOnAutoplayCompleteData) => void;

    constructor() {
        super();

        this.playing = false;
        this.autoplayPlaying = false;
        this.freeSpinPlaying = false;

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
    public setup(config: SlotConfig) {
        this.playing = false;
        this.autoplayPlaying = false;
        this.freeSpinPlaying = false;

        const jackpotConfig = gameConfig.getJackpots();
        this.config = config;
        this.reset();

        this.jackpot.setup(jackpotConfig);
        this.board.setup(config);
    }

    /** Fully reset the game */
    public reset() {
        this.playing = false;
        this.autoplayPlaying = false;
        this.freeSpinPlaying = false;

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
    public async startSpin(bet: number, spinMode: SlotSpinMode, feature?: number) {
        this.playing = true;
        this.spinMode = spinMode;
        this.requireSpinInterrupt = false;
        await this.actions.actionSpin(bet, feature);
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async stopSpin() {
        this.playing = false;
    }

    /** Start the spin and disable interaction */
    public async startFreeSpin(bet: number, spinMode: SlotSpinMode) {
        this.freeSpinPlaying = true;
        this.spinMode = spinMode;
        this.requireSpinInterrupt = false;
        await this.actions.actionFreeSpin(bet);
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async stopFreeSpin() {
        this.freeSpinPlaying = false;
    }

    /**
     * Start the spin and disable interaction
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async interruptSpin() {
        if (this.requireSpinInterrupt) return;
        console.log('[DELAY]Interrupted');
        this.requireSpinInterrupt = true;
    }

    /** Start the spin and disable interaction */
    public async startAutoplaySpin(bet: number, spinMode: SlotSpinMode, autoplays: number) {
        this.autoplayPlaying = true;
        this.spinMode = spinMode;
        await this.actions.actionAutoplaySpin(bet, autoplays);
    }

    /** Start the spin and disable interaction */
    public async stopAutoplaySpin() {
        this.autoplayPlaying = false;
        this.actions.actionStopAutoplaySpin();
    }

    /** Is playing */
    public isPlaying() {
        return this.playing;
    }
    /** Is playing */
    public isFreeSpinPlaying() {
        return this.freeSpinPlaying;
    }
    /** Is playing */
    public isAutoplayPlaying() {
        return this.autoplayPlaying;
    }

    /** Pause the game */
    public pause() {
        this.board.pause();
        this.process.pause();
        this.freeSpinsProcess.pause();
    }

    /** Resume the game */
    public resume() {
        this.board.resume();
        this.process.resume();
        this.freeSpinsProcess.resume();
    }

    /** Update the timer */
    public update() {
        // this.timer.update(delta);
    }
}
