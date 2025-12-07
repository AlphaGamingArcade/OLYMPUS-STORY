import { Slot } from './Slot';

/** Interface for actions configuration */
interface Match3ActionsConfig {
    isFreeSpin: boolean;
}

/**
 * These are the actions player can take: move pieces (swap) or tap if they are special.
 * Action effects happens instantly, and the game will deal with whatever state the grid ends up with.
 */
export class SlotActions {
    /** The match3 instance */
    public slot: Slot;

    /** Free all moves, meaning that they will always be valid regardles of matching results */
    public freeMoves = false;

    constructor(slot: Slot) {
        this.slot = slot;
    }

    /**
     *
     * @param bet
     * @param feature  Feature 0 = normal and the default value 1 = for buy free spin
     *
     **/
    public async actionSpin(bet: number, feature?: number) {
        // Check balance here

        this.slot.process.start(bet, feature);
    }

    public async actionFreeSpin(bet: number) {
        // Check balance

        this.slot.freeSpinsProcess.start(bet);
    }

    public async actionAutoplaySpin(bet: number, totalSpins: number) {
        // Check balance

        this.slot.autoplayProcess.start(bet, totalSpins);
    }

    /**
     * Set up actions with given configuration
     * @param config Actions config params
     */
    public setup(config: Match3ActionsConfig) {
        this.freeMoves = config.isFreeSpin;
    }
}
