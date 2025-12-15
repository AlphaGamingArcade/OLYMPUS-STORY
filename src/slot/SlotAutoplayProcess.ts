import { AsyncQueue, waitFor } from '../utils/asyncUtils';
import { Slot } from './Slot';

/**
 * Controls autoplay flow - automatically plays multiple spins in sequence
 *
 * Each autoplay spin:
 *   1. Starts a normal spin process
 *   2. Waits for it to complete (including any free spins)
 *   3. Moves to next autoplay spin or stops
 */
export class SlotAutoplayProcess {
    /** Reference to main Slot controller */
    private slot: Slot;

    /** Whether autoplay is currently running */
    private processing = false;

    /** Bet amount for autoplay */
    private betAmount = 0;

    /** Total autoplay spins still available */
    private remainingAutoplaySpins = 0;

    /** The index of the autoplay spin currently being played */
    private currentAutoplaySpin = 0;

    /** Flag to stop autoplay */
    private stopRequired = false;

    /** Task queue managing asynchronous step sequencing */
    private queue: AsyncQueue;

    constructor(slot: Slot) {
        this.slot = slot;
        this.queue = new AsyncQueue();
    }

    /** Request autoplay to stop after current spin completes */
    public stopAutoplay(): void {
        this.stopRequired = true;
    }

    /** Whether autoplay is active */
    public isProcessing(): boolean {
        return this.processing;
    }

    /** Get current autoplay spin number */
    public getCurrentAutoplaySpin(): number {
        return this.currentAutoplaySpin;
    }

    /** Get remaining autoplay spins */
    public getRemainingAutoplaySpins(): number {
        return this.remainingAutoplaySpins;
    }

    /** Stop everything immediately and clear queued tasks */
    public reset(): void {
        this.processing = false;
        this.currentAutoplaySpin = 0;
        this.remainingAutoplaySpins = 0;
        this.stopRequired = false;
        this.queue.clear();
    }

    /** Pause the async queue */
    public pause(): void {
        this.queue.pause();
    }

    /** Resume the async queue */
    public resume(): void {
        this.queue.resume();
    }

    /** Start autoplay with specified number of spins */
    public async start(bet: number, autoplaySpins: number): Promise<void> {
        if (this.processing) return;

        this.processing = true;
        this.remainingAutoplaySpins = autoplaySpins;
        this.currentAutoplaySpin = 0;
        this.betAmount = bet;
        this.stopRequired = false;

        // Notify start
        const autoplayStartData = {
            totalSpins: autoplaySpins,
            currentSpin: this.currentAutoplaySpin,
            remainingSpins: this.remainingAutoplaySpins,
        };
        this.slot.onAutoplayStart?.(autoplayStartData);

        this.runNextAutoplaySpin();
    }

    /** Stop autoplay and cleanup */
    public async stop(): Promise<void> {
        if (!this.processing) return;

        this.processing = false;
        this.queue.clear();

        // mark autoplay as stop
        this.slot.stopAutoplaySpin();

        // Notify complete
        this.slot.onAutoplayComplete?.({
            totalSpins: this.currentAutoplaySpin,
        });
    }

    /** Start the next autoplay spin, or end if none remain or stop requested */
    private async runNextAutoplaySpin(): Promise<void> {
        // Check stop conditions
        if (this.stopRequired) {
            await this.stop();
            return;
        }

        if (this.remainingAutoplaySpins <= 0) {
            await waitFor(0.5);
            await this.stop();
            return;
        }

        this.currentAutoplaySpin += 1;
        this.remainingAutoplaySpins -= 1;

        // Notify spin start
        this.slot.onAutoplaySpinStart?.({
            currentSpin: this.currentAutoplaySpin,
            remainingSpins: this.remainingAutoplaySpins,
        });

        this.runProcessRound();
    }

    /** Run a single autoplay spin (waits for normal process + free spins to complete) */
    private async runProcessRound(): Promise<void> {
        // Step 1: Start the normal spin process
        this.queue.add(async () => {
            await this.slot.process.start(this.betAmount);
        });

        // Step 2: Wait for normal process to complete
        this.queue.add(async () => {
            if (this.slot.process.isProcessing()) {
                await this.waitForProcessComplete();
            }
        });

        // Step 3: If free spins were triggered, wait for them too
        this.queue.add(async () => {
            if (this.slot.freeSpinsProcess.isProcessing()) {
                await this.waitForFreeSpinsComplete();
            }
        });

        // Step 4: Check for user interruption
        this.queue.add(async () => {
            await this.processPlayerInterruption();
        });

        // Step 5: Move to checkpoint
        this.queue.add(async () => {
            await this.processCheckpoint();
        });
    }

    /** Wait for process to complete using event listener */
    private async waitForProcessComplete(): Promise<void> {
        return new Promise((resolve) => {
            const originalCallback = this.slot.onProcessComplete;

            this.slot.onProcessComplete = () => {
                // Call original callback if it exists
                if (originalCallback) {
                    originalCallback();
                }

                // Restore original callback
                this.slot.onProcessComplete = originalCallback;

                // Resolve promise
                resolve();
            };
        });
    }

    /** Wait for free spins to complete using event listener */
    private async waitForFreeSpinsComplete(): Promise<void> {
        return new Promise((resolve) => {
            const originalCallback = this.slot.onFreeSpinComplete;

            this.slot.onFreeSpinComplete = async (data) => {
                // Call original callback if it exists
                if (originalCallback) {
                    await originalCallback(data);
                }

                // Restore original callback
                this.slot.onFreeSpinComplete = originalCallback;

                // Resolve promise
                resolve();
            };
        });
    }

    /** Determine if another autoplay spin should run or if autoplay should stop */
    private async processPlayerInterruption(): Promise<void> {
        const data = {
            currentSpin: this.currentAutoplaySpin,
            remainingSpins: this.remainingAutoplaySpins,
        };
        this.slot.onAutoplaySpinComplete?.(data);
        await waitFor(1); // give time for user interruption
    }

    /** Determine if another autoplay spin should run or if autoplay should stop */
    private async processCheckpoint(): Promise<void> {
        // Check if we should continue
        if (this.stopRequired) {
            await this.stop();
        } else if (this.remainingAutoplaySpins > 0) {
            this.runNextAutoplaySpin();
        } else {
            await this.stop();
        }
    }
}
