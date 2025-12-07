import { Container, Ticker } from 'pixi.js';
import {
    Slot,
    SlotFreeSpinStartData,
    SlotFreeSpinTriggerData,
    SlotOnAutoplaySpinStartData,
    SlotOnAutoplayStartData,
    SlotOnBigWinTriggerData,
    SlotOnFreeSpinCompleteData,
    SlotOnJackpotMatchData,
    SlotOnJackpotTriggerData,
    SlotOnMatchData,
    SlotOnNextFreeSpinData,
} from '../slot/Slot';
import { Pillar } from '../ui/Pillar';
import { navigation } from '../utils/navigation';
import { GameEffects } from '../ui/GameEffects';
import { bgm } from '../utils/audio';
import { GameOvertime } from '../ui/GameOvertime';
import { waitFor } from '../utils/asyncUtils';
import { slotGetConfig } from '../slot/SlotConfig';
import { JackpotTier } from '../ui/JackpotTier';
import { GameLogo } from '../ui/GameLogo';
import { BuyFreeSpinButton } from '../ui/BuyFreeSpinButton';
import { RoundResult } from '../ui/RoundResult';
import { ControlPanel } from '../ui/ControlPanel';
import { BetAction, userSettings } from '../utils/userSettings';
import { BabyZeus } from '../ui/BabyZeus';
import { FreeSpinPopup, FreeSpinPopupData } from '../popups/FreeSpinPopup';
import { FreeSpinWinPopup, FreeSpinWinPopupData } from '../popups/FreeSpinWinPopup';
import { gameConfig } from '../utils/gameConfig';
import { JackpotWinPopup, JackpotWinPopupData } from '../popups/JackpotWinPopup';
import { BuyFreeSpinPopup, BuyFreeSpinPopupData } from '../popups/BuyFreeSpinPopup';
import { AutoplayPopup, AutoplayPopupData } from '../popups/AutoplayPopup';
import { SettingsPopup, SettingsPopupData } from '../popups/SettingsPopup';
import { InfoPopup, InfoPopupData } from '../popups/InfoPopup';
import { formatCurrency } from '../utils/formatter';
import { BigWinPopup, BigWinPopupData } from '../popups/BigWinPopup';

/** The screen tha holds the Match3 game */
export class GameScreen extends Container {
    /** Assets bundles required by this screen */
    public static assetBundles = ['game', 'common'];
    /** The Math3 game */
    public readonly slot: Slot;
    /** Inner container for the match3 */
    public readonly gameContainer: Container;
    /** Countdown displayed when the gameplay is about to finish */
    public readonly overtime: GameOvertime;
    /** The match3 book shelf background */
    public readonly pillar?: Pillar;

    /** The Divine Multiplier */
    public readonly divineJackpotTier: JackpotTier;
    /** The Blessed Multiplier */
    public readonly blessedJackpotTier: JackpotTier;
    /** The Angelic Multiplier */
    public readonly angelicJackpotTier: JackpotTier;
    /** The Grand Multiplier */
    public readonly grandJackpotTier: JackpotTier;
    /** The game logo */
    public readonly gameLogo: GameLogo;
    /** The buy free spin butotn */
    public readonly buyFreeSpinButton: BuyFreeSpinButton;
    /** The round result frame */
    public readonly roundResult: RoundResult;
    /** The floading mascot */
    public readonly babyZeus: BabyZeus;
    /** The Control Panel */
    public readonly controlPanel: ControlPanel;
    /** The special effects layer for the match3 */
    public readonly vfx?: GameEffects;
    /** Track if finish */
    public finished: boolean;
    /** Currency */
    public currency: string;
    /** Greetings */
    public preBetGreetings = ['HOLD SPACE FOR TURBO SPIN', 'PLACE YOUR BETS'];
    public betGreetings = ['HOLD SPACE FOR TURBO SPIN', 'GOOD LUCK!'];

    constructor() {
        super();
        this.currency = 'USD';
        this.gameContainer = new Container();
        this.addChild(this.gameContainer);

        this.pillar = new Pillar();
        this.gameContainer.addChild(this.pillar);

        this.gameLogo = new GameLogo();
        this.addChild(this.gameLogo);

        this.buyFreeSpinButton = new BuyFreeSpinButton();
        // Listen for press event (this is FancyButton's built-in click event)
        this.buyFreeSpinButton.onPress.connect(() => {
            if (this.finished) return;
            const amount = userSettings.getBet() * gameConfig.getBuyFreeSpinBetMultiplier();
            navigation.presentPopup<BuyFreeSpinPopupData>(BuyFreeSpinPopup, {
                currency: this.currency,
                amount: amount,
                callback: async (action) => {
                    await navigation.dismissPopup();
                    await waitFor(0.7);
                    if (action == 'confirm') {
                        this.startSpinning({ feature: 1 }); // 1 is is buy feature
                    }
                },
            });
        });
        this.addChild(this.buyFreeSpinButton);

        this.roundResult = new RoundResult();
        this.addChild(this.roundResult);

        this.babyZeus = new BabyZeus();
        this.addChild(this.babyZeus);

        this.divineJackpotTier = new JackpotTier({
            name: 'multiplier-label-divine',
            tier: 'frame_multiplier_divine',
            dotActive: 'multiplier_bullet_divine',
            points: 100,
            currency: this.currency,
        });
        this.addChild(this.divineJackpotTier);
        this.divineJackpotTier.setTotalDots(5);
        this.divineJackpotTier.setActiveDots(0);

        this.blessedJackpotTier = new JackpotTier({
            name: 'multiplier-label-blessed',
            tier: 'frame_multiplier_blessed',
            dotActive: 'multiplier_bullet_blessed',
            points: 50,
            currency: this.currency,
        });
        this.addChild(this.blessedJackpotTier);
        this.blessedJackpotTier.setTotalDots(4);
        this.blessedJackpotTier.setActiveDots(0);

        this.angelicJackpotTier = new JackpotTier({
            name: 'multiplier-label-angelic',
            tier: 'frame_multiplier_angelic',
            dotActive: 'multiplier_bullet_angelic',
            points: 20,
            currency: this.currency,
        });
        this.addChild(this.angelicJackpotTier);
        this.angelicJackpotTier.setTotalDots(3);
        this.angelicJackpotTier.setActiveDots(0);

        this.grandJackpotTier = new JackpotTier({
            name: 'multiplier-label-grand',
            tier: 'frame_multiplier_grand',
            dotActive: 'multiplier_bullet_grand',
            points: 10,
            currency: this.currency,
        });
        this.addChild(this.grandJackpotTier);
        this.grandJackpotTier.setTotalDots(2);
        this.grandJackpotTier.setActiveDots(0);

        this.slot = new Slot();
        this.slot.onMatch = this.onMatch.bind(this);
        this.slot.onWin = this.onWin.bind(this);
        this.slot.onBigWinTrigger = this.onBigWinTrigger.bind(this);
        this.slot.onSpinStart = this.onSpinStart.bind(this);
        this.slot.onJackpotMatch = this.onJackpotMatch.bind(this);
        this.slot.onJackpotTrigger = this.onJackpotTrigger.bind(this);

        this.slot.onFreeSpinTrigger = this.onFreeSpinTrigger.bind(this);
        this.slot.onFreeSpinStart = this.onFreeSpinStart.bind(this);
        this.slot.onNextFreeSpinStart = this.onNextFreeSpinStart.bind(this);
        this.slot.onFreeSpinComplete = this.onFreeSpinComplete.bind(this);

        this.slot.onProcessStart = this.onProcessStart.bind(this);
        this.slot.onProcessComplete = this.onProcessComplete.bind(this);

        this.slot.onAutoplayStart = this.onAutoplayStart.bind(this);
        this.slot.onAutoplayComplete = this.onAutoplayComplete.bind(this);
        this.slot.onAutoplaySpinStart = this.onAutoplaySpinStart.bind(this);

        this.gameContainer.addChild(this.slot);

        this.vfx = new GameEffects(this);
        this.addChild(this.vfx);

        this.overtime = new GameOvertime();
        this.addChild(this.overtime);

        /** Make sure this is always on bottom */
        this.controlPanel = new ControlPanel();
        this.addChild(this.controlPanel);
        this.controlPanel.setCredit(100000);
        this.controlPanel.setBet(2.0);
        this.controlPanel.setTitle(this.preBetGreetings[Math.floor(Math.random() * this.preBetGreetings.length)]);

        this.controlPanel.onSpin(() => this.startSpinning());
        this.controlPanel.onSpacebar(() => this.startSpinning());
        this.controlPanel.onAutoplay(() => {
            if (this.finished) return;
            navigation.presentPopup<AutoplayPopupData>(AutoplayPopup, {
                callback: async (spins: number) => {
                    if (this.finished) return;
                    await navigation.dismissPopup();
                    this.startSpinning({ autoplaySpins: spins });
                },
            });
        });

        this.controlPanel.onSettings(() => {
            navigation.presentPopup<SettingsPopupData>(SettingsPopup, {
                finished: this.finished,
                onBetSettingChanged: () => {
                    this.controlPanel.setBet(userSettings.getBet());
                    this.updateMultiplierAmounts();
                    this.updateBuyFreeSpinAmount();
                },
                onAudioSettingChanged: (isOn: boolean) => {
                    this.controlPanel.audioButton.setToggleState(isOn);
                },
            });
        });
        this.controlPanel.onInfo(() => {
            navigation.presentPopup<InfoPopupData>(InfoPopup, {
                finished: this.finished,
                onBetChanged: () => {
                    this.controlPanel.setBet(userSettings.getBet());
                    this.updateMultiplierAmounts();
                    this.updateBuyFreeSpinAmount();
                },
            });
        });

        // Init multiplier scores
        this.updateMultiplierAmounts();
        this.updateBuyFreeSpinAmount();

        this.controlPanel.setBet(userSettings.getBet());
        this.controlPanel.onIncreaseBet(() => {
            if (this.finished) return;
            userSettings.setBet(BetAction.INCREASE);
            this.controlPanel.setBet(userSettings.getBet());
            this.updateMultiplierAmounts();
            this.updateBuyFreeSpinAmount();

            // TODO: Do more here if bet is changed
        });
        this.controlPanel.onDecreaseBet(() => {
            if (this.finished) return;
            userSettings.setBet(BetAction.DECREASE);
            this.controlPanel.setBet(userSettings.getBet());
            this.updateMultiplierAmounts();
            this.updateBuyFreeSpinAmount();
            // TODO: Do more here if bet is changed
        });

        this.finished = false;
    }

    private updateBuyFreeSpinAmount() {
        const amount = userSettings.getBet() * gameConfig.getBuyFreeSpinBetMultiplier();
        this.buyFreeSpinButton.setAmount(formatCurrency(amount, this.currency));
    }

    private updateMultiplierAmounts() {
        const multipliers = gameConfig.getJackpots();
        for (let index = 0; index < multipliers.length; index++) {
            const multiplier = multipliers[index];
            const amount = userSettings.getBet() * multiplier.multiplier;
            if (multiplier.id == 'grand') {
                this.grandJackpotTier.amount = amount;
            } else if (multiplier.id == 'angelic') {
                this.angelicJackpotTier.amount = amount;
            } else if (multiplier.id == 'blessed') {
                this.blessedJackpotTier.amount = amount;
            } else if (multiplier.id == 'divine') {
                this.divineJackpotTier.amount = amount;
            }
        }
    }

    private async startSpinning(
        options: {
            feature?: number;
            autoplaySpins?: number;
        } = {},
    ) {
        if (this.finished) return;

        this.finished = true;
        this.controlPanel.disableBetting();
        this.buyFreeSpinButton.enabled = false;
        this.controlPanel.setTitle(this.betGreetings[Math.floor(Math.random() * this.betGreetings.length)]);
        this.roundResult.clearResults();

        const bet = userSettings.getBet();

        if (options.autoplaySpins) {
            this.slot.startAutoplaySpin(bet, options.autoplaySpins);
        } else {
            this.slot.startSpin(bet, options.feature);
        }
    }

    /** Prepare the screen just before showing */
    public prepare() {
        const match3Config = slotGetConfig();
        this.currency = userSettings.getCurrency();

        this.pillar?.setup(match3Config);
        this.slot.setup(match3Config);
    }

    /** Update the screen */
    public update(time: Ticker) {
        this.slot.update(time.deltaMS);
    }

    /** Pause gameplay - automatically fired when a popup is presented */
    public async pause() {
        this.gameContainer.interactiveChildren = false;
        this.slot.pause();
    }

    /** Resume gameplay */
    public async resume() {
        this.gameContainer.interactiveChildren = true;
        this.slot.resume();
    }

    /** Fully reset the game, clearing all pieces and shelf blocks */
    public reset() {
        this.pillar?.reset();
        this.slot.reset();
    }

    /** Resize the screen, fired whenever window size changes */
    public resize(width: number, height: number) {
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        if (width > height) {
            this.gameContainer.x = centerX;
            this.gameContainer.y = this.gameContainer.height * 0.5;

            this.gameLogo.scale.set(1);
            this.gameLogo.x = width - this.gameLogo.width + 60;
            this.gameLogo.y = this.gameLogo.height * 0.5;

            const multiplierX = width + 10;
            const multiplierTierY = 360;
            const multiplierScale = 0.85;

            this.divineJackpotTier.scale.set(multiplierScale);
            this.divineJackpotTier.x = multiplierX - this.divineJackpotTier.width * 0.65;
            this.divineJackpotTier.y = multiplierTierY;

            this.blessedJackpotTier.scale.set(multiplierScale);
            this.blessedJackpotTier.x = multiplierX - this.blessedJackpotTier.width * 0.65;
            this.blessedJackpotTier.y = multiplierTierY + 150;

            this.angelicJackpotTier.scale.set(multiplierScale);
            this.angelicJackpotTier.x = multiplierX - this.angelicJackpotTier.width * 0.65;
            this.angelicJackpotTier.y = multiplierTierY + 290;

            this.grandJackpotTier.scale.set(multiplierScale);
            this.grandJackpotTier.x = multiplierX - this.grandJackpotTier.width * 0.65;
            this.grandJackpotTier.y = multiplierTierY + 430;

            this.buyFreeSpinButton.scale.set(0.85);
            this.buyFreeSpinButton.x = 180;
            this.buyFreeSpinButton.y = 260;

            this.roundResult.scale.set(0.85);
            this.roundResult.x = 180;
            this.roundResult.y = height - this.roundResult.height - 160;

            this.babyZeus.x = 450;
            this.babyZeus.y = height - this.babyZeus.height * 0.5 - 100;

            this.overtime.x = this.gameContainer.x;
            this.overtime.y = this.gameContainer.y;
        } else {
            const divY = 280;

            this.gameContainer.x = centerX;
            this.gameContainer.y = this.gameContainer.height * 0.5 - 100;

            this.buyFreeSpinButton.scale.set(0.65);
            this.buyFreeSpinButton.x = 220;
            this.buyFreeSpinButton.y = height * 0.65 - 20;

            this.gameLogo.scale.set(0.75);
            this.gameLogo.x = 220;
            this.gameLogo.y = height - this.gameLogo.height - divY;

            const multiplierTierY = height * 0.6;
            const multiplierScale = 0.75;

            this.divineJackpotTier.scale.set(multiplierScale);
            this.divineJackpotTier.x = width - this.roundResult.width * 0.5;
            this.divineJackpotTier.y = multiplierTierY;

            this.blessedJackpotTier.scale.set(multiplierScale);
            this.blessedJackpotTier.x = width - this.roundResult.width * 0.5;
            this.blessedJackpotTier.y = multiplierTierY + 110;

            this.angelicJackpotTier.scale.set(multiplierScale);
            this.angelicJackpotTier.x = width - this.roundResult.width * 0.5;
            this.angelicJackpotTier.y = multiplierTierY + 220;

            this.grandJackpotTier.scale.set(multiplierScale);
            this.grandJackpotTier.x = width - this.roundResult.width * 0.5;
            this.grandJackpotTier.y = multiplierTierY + 330;

            this.roundResult.scale.set(0.75);
            this.roundResult.x = width * 0.5;
            this.roundResult.y = height - this.roundResult.height - 320;

            this.babyZeus.x = 160;
            this.babyZeus.y = centerY - 120;
        }

        const isMobile = document.documentElement.id === 'isMobile';
        this.controlPanel.resize(width, height, isMobile);
    }

    /** Show screen with animations */
    public async show() {
        bgm.play('common/bgm-game.mp3', { volume: 0.5 });
    }

    /** Hide screen with animations */
    public async hide() {
        this.overtime.hide();
        await waitFor(0.3);
    }

    /** Fires when there are match */
    private async onMatch(data: SlotOnMatchData) {
        if (data.wins.length > 0) {
            // stop control panel matches animation
            this.controlPanel.stopMatchMessages();

            for (const win of data.wins) {
                this.roundResult.addResult(win.types.length, `symbol-${win.types[0]}`, win.amount, this.currency);
                this.controlPanel.addMatchMessage(win.types.length, win.types[0], win.amount, this.currency);
            }

            this.controlPanel.playMatchMessages();
        }
    }

    /** Fires if player wins */
    private onWin(amount: number) {
        if (amount > 0) {
            this.controlPanel.setWinTitle(`WIN ${formatCurrency(amount, this.currency)}`);
        } else {
            this.controlPanel.setTitle(this.preBetGreetings[Math.floor(Math.random() * this.preBetGreetings.length)]);
        }
    }

    /** Fires if player big win */
    private async onBigWinTrigger(data: SlotOnBigWinTriggerData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<BigWinPopupData>(BigWinPopup, {
                category: data.category,
                amount: data.amount,
                callback: async () => {
                    await navigation.dismissPopup();
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onJackpotMatch(data: SlotOnJackpotMatchData) {
        await this.vfx?.onJackpotMatch(data);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onJackpotTrigger(data: SlotOnJackpotTriggerData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<JackpotWinPopupData>(JackpotWinPopup, {
                name: data.jackpot.id,
                times: data.times,
                amount: data.amount,
                callback: async () => {
                    await navigation.dismissPopup();
                    this.vfx?.playHideJackpotTimes(data.jackpot);
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onFreeSpinTrigger(data: SlotFreeSpinTriggerData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<FreeSpinPopupData>(FreeSpinPopup, {
                totalFreeSpins: data.totalFreeSpins,
                callback: async () => {
                    await navigation.dismissPopup();
                    await waitFor(1);

                    const bet = userSettings.getBet();
                    this.slot.actions.actionFreeSpin(bet);
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 spins tart */
    private async onSpinStart() {
        this.divineJackpotTier.setActiveDots(0);
        this.blessedJackpotTier.setActiveDots(0);
        this.angelicJackpotTier.setActiveDots(0);
        this.grandJackpotTier.setActiveDots(0);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onFreeSpinStart(data: SlotFreeSpinStartData) {
        this.controlPanel.setMessage(`FREE SPINS LEFT ${data.remainingSpins}`);
    }

    private async onNextFreeSpinStart(data: SlotOnNextFreeSpinData) {
        this.roundResult.clearResults();
        this.vfx?.playSetActiveJackpots(data);
        this.controlPanel.setMessage(`FREE SPINS LEFT ${data.remainingSpins}`);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onFreeSpinComplete(data: SlotOnFreeSpinCompleteData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<FreeSpinWinPopupData>(FreeSpinWinPopup, {
                amount: data.amount,
                spins: data.spins,
                callback: async () => {
                    this.controlPanel.setMessage('');
                    await navigation.dismissPopup();
                    await waitFor(1);
                    if (
                        !this.slot.process.isProcessing() &&
                        !this.slot.freeSpinsProcess.isProcessing() &&
                        !this.slot.autoplayProcess.isProcessing()
                    )
                        this.finish();
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onAutoplayStart(data: SlotOnAutoplayStartData) {
        this.roundResult.clearResults();
        this.controlPanel.setMessage(`AUTOPLAY SPINS LEFT ${data.remainingSpins}`);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onAutoplaySpinStart(data: SlotOnAutoplaySpinStartData) {
        this.roundResult.clearResults();
        this.controlPanel.setMessage(`AUTOPLAY SPINS LEFT ${data.remainingSpins}`);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onAutoplayComplete() {
        if (
            !this.slot.process.isProcessing() &&
            !this.slot.freeSpinsProcess.isProcessing() &&
            !this.slot.autoplayProcess.isProcessing()
        ) {
            this.controlPanel.setMessage('');
            this.finish();
        }
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onProcessStart() {
        console.log('PROCESS STARTING');
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onProcessComplete() {
        if (
            !this.slot.process.isProcessing() &&
            !this.slot.freeSpinsProcess.isProcessing() &&
            !this.slot.autoplayProcess.isProcessing()
        )
            this.finish();
    }

    private async finish() {
        if (!this.finished) return;
        this.finished = false;
        this.controlPanel.enableBetting();

        this.buyFreeSpinButton.enabled = true;
    }
    /** Auto pause the game when window go out of focus */
    public blur() {
        if (!navigation.currentPopup) {
            // navigation.presentPopup(PausePopup);
        }
    }
}
