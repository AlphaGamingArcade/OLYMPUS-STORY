import { Match3 } from './Match3';

/** Interface for actions configuration */
interface Match3ActionsConfig {
    isFreeSpin: boolean;
}

/** Feature
 *  0 = normal and the default value
 *  1 = for buy free spin
 */
type Feature = 0 | 1;

/**
 * These are the actions player can take: move pieces (swap) or tap if they are special.
 * Action effects happens instantly, and the game will deal with whatever state the grid ends up with.
 */
export class Match3Actions {
    /** The match3 instance */
    public match3: Match3;

    /** Free all moves, meaning that they will always be valid regardles of matching results */
    public freeMoves = false;

    constructor(match3: Match3) {
        this.match3 = match3;
    }

    public async actionSpin(bet: number, feature: Feature = 0) {
        this.match3.onSpinStart?.();

        await this.match3.board.fallToBottomGrid();
        this.match3.board.reset();

        await this.match3.board.fillGrid(bet, feature);

        this.match3.jackpot.reset();
        this.match3.process.start(bet);
    }

    public async actionFreeSpin(bet: number) {
        this.match3.freeSpinProcess.start(bet, 5);
    }

    /**
     * Set up actions with given configuration
     * @param config Actions config params
     */
    public setup(config: Match3ActionsConfig) {
        this.freeMoves = config.isFreeSpin;
    }
}
