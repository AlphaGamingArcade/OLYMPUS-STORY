import { Container } from 'pixi.js';
import {
    Slot,
    SlotFreeSpinStartData,
    SlotOnAutoplaySpinCompleteData,
    SlotOnAutoplaySpinStartData,
    SlotOnAutoplayStartData,
    SlotOnBigWinTriggerData,
    SlotOnColumnMoveCompleteData,
    SlotOnColumnMoveStartData,
    SlotOnFreeSpinCompleteData,
    SlotOnJackpotMatchData,
    SlotOnJackpotTriggerData,
    SlotOnMatchData,
    SlotOnNextFreeSpinData,
    SlotOnResumeStartData,
    SlotOnScatterMatch,
    SlotOnWinFreeSpinTriggerData,
} from '../slot/Slot';
import { Pillar } from '../ui/Pillar';
import { navigation } from '../utils/navigation';
import { GameEffects } from '../ui/GameEffects';
import { bgm, sfx } from '../utils/audio';
import { waitFor } from '../utils/asyncUtils';
import { slotGetConfig, slotGetJackpotNames } from '../slot/SlotConfig';
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
import { ErrorPopup, ErrorPopupData } from '../popups/ErrorPopup';
import { SlotOnWinExtraFreeSpinData } from '../slot/SlotFreeSpinsStats';
import { i18n } from '../i18n/i18n';
import { Transition } from '../ui/Transition';
import { getUrlParam } from '../utils/getUrlParams';
import { GameAPI } from '../api/gameApi';

/** The screen tha holds the Slot game */
export class GameScreen extends Container {
    /** Assets bundles required by this screen */
    public static assetBundles = ['game', 'common'];
    /** The Math3 game */
    public readonly slot: Slot;
    /** Inner container for the match3 */
    public readonly gameContainer: Container;
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
    /** List of all tiers */
    public readonly jackpotTiers: JackpotTier[] = [];
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
    /** resuming */
    public resuming: boolean;
    /** Currency */
    public currency: string;
    /** Greetings */
    public preBetGreetings = [i18n.t('holdSpaceForTurboSpin'), i18n.t('placeYourBets')];
    /** Index */
    public betGreetings = [i18n.t('holdSpaceForTurboSpin'), i18n.t('goodluck')];

    constructor() {
        super();
        this.currency = getUrlParam('cur') ?? 'usd';
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
            const amount = userSettings.getBet() * gameConfig.getBuyFeatureBetMultiplier();
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
        this.jackpotTiers.push(this.divineJackpotTier);

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
        this.jackpotTiers.push(this.blessedJackpotTier);

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
        this.jackpotTiers.push(this.angelicJackpotTier);

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
        this.jackpotTiers.push(this.grandJackpotTier);

        this.slot = new Slot();
        this.slot.spinIndex = userSettings.getIndex() + 1;

        this.slot.onResumeStart = this.onResumeStart.bind(this);
        this.slot.onResumeEnd = this.onResumeEnd.bind(this);

        this.slot.onMatch = this.onMatch.bind(this);
        this.slot.onWin = this.onWin.bind(this);
        this.slot.onBigWinTrigger = this.onBigWinTrigger.bind(this);
        this.slot.onSpinStart = this.onSpinStart.bind(this);
        this.slot.onScatterMatch = this.onScatterMatch.bind(this);
        this.slot.onJackpotMatch = this.onJackpotMatch.bind(this);
        this.slot.onJackpotTrigger = this.onJackpotTrigger.bind(this);

        this.slot.onColumnMoveStart = this.onColumnMoveStart.bind(this);
        this.slot.onColumnMoveComplete = this.onColumnMoveComplete.bind(this);

        this.slot.onWinFreeSpinTrigger = this.onWinFreeSpinTrigger.bind(this);
        this.slot.onWinExtraFreeSpinTrigger = this.onWinExtraFreeSpinTrigger.bind(this);
        this.slot.onFreeSpinStart = this.onFreeSpinStart.bind(this);
        this.slot.onNextFreeSpinStart = this.onNextFreeSpinStart.bind(this);
        this.slot.onFreeSpinComplete = this.onFreeSpinComplete.bind(this);

        this.slot.onProcessStart = this.onProcessStart.bind(this);
        this.slot.onProcessComplete = this.onProcessComplete.bind(this);

        this.slot.onAutoplayStart = this.onAutoplayStart.bind(this);
        this.slot.onAutoplayComplete = this.onAutoplayComplete.bind(this);
        this.slot.onAutoplaySpinStart = this.onAutoplaySpinStart.bind(this);
        this.slot.onAutoplaySpinComplete = this.onAutoplaySpinComplete.bind(this);

        this.gameContainer.addChild(this.slot);

        this.vfx = new GameEffects(this);
        this.addChild(this.vfx);

        /** Make sure this is always on bottom */
        this.controlPanel = new ControlPanel();
        this.addChild(this.controlPanel);

        const balance = userSettings.getBalance();
        const bet = userSettings.getBet();

        this.controlPanel.setCredit(balance);
        this.controlPanel.setBet(bet);
        this.controlPanel.setTitle(this.preBetGreetings[Math.floor(Math.random() * this.preBetGreetings.length)]);

        this.controlPanel.onSpin(() => this.startSpinning());
        this.controlPanel.onSpacebar(() => this.startSpinning());
        this.controlPanel.onAutoplay(() => {
            if (this.slot.isAutoplayPlaying()) {
                this.slot.stopAutoplaySpin();
            } else {
                if (this.finished) return;
                const spinMode = userSettings.getSpinMode();
                navigation.presentPopup<AutoplayPopupData>(AutoplayPopup, {
                    spinMode,
                    callback: async (spins: number) => {
                        if (this.finished) return;
                        await navigation.dismissPopup();
                        this.startSpinning({ autoplaySpins: spins });
                    },
                });
            }
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
        this.resuming = false;
    }

    private updateBuyFreeSpinAmount() {
        const amount = userSettings.getBet() * gameConfig.getBuyFeatureBetMultiplier();
        this.buyFreeSpinButton.setAmount(formatCurrency(amount, this.currency));
    }

    private updateMultiplierAmounts() {
        const multipliers = gameConfig.getJackpots();
        const jackpotNames = slotGetJackpotNames();

        for (let index = 0; index < multipliers.length; index++) {
            const multiplier = multipliers[index];
            const amount = userSettings.getBet() * multiplier.multiplier;
            const name = jackpotNames[index].toLowerCase();

            if (name == 'grand') {
                this.grandJackpotTier.amount = amount;
            } else if (name == 'angelic') {
                this.angelicJackpotTier.amount = amount;
            } else if (name == 'blessed') {
                this.blessedJackpotTier.amount = amount;
            } else if (name == 'divine') {
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
        if (this.finished || this.resuming) {
            // Interrupt spin
            this.slot.interruptSpin();
            return;
        }
        this.finished = true;

        const bet = userSettings.getBet();
        const balance = userSettings.getBalance();

        let toPayAmount = bet;

        // For buy feature
        if (options.feature == 1) {
            toPayAmount = bet * 100;
        }

        if (balance < toPayAmount) {
            return navigation.presentPopup<ErrorPopupData>(ErrorPopup, {
                title: i18n.t('error'),
                message: i18n.t('balanceNotEnough'),
            });
        }

        userSettings.setBalance(balance - toPayAmount);

        this.controlPanel.setCredit(userSettings.getBalance());
        this.controlPanel.disableBetting();
        this.buyFreeSpinButton.enabled = false;
        this.controlPanel.setTitle(this.betGreetings[Math.floor(Math.random() * this.betGreetings.length)]);
        this.roundResult.clearResults();

        const spinMode = userSettings.getSpinMode();

        if (options.autoplaySpins) {
            this.slot.startAutoplaySpin(bet, spinMode, options.autoplaySpins);
        } else {
            this.slot.startSpin(bet, spinMode, options.feature);
        }
    }

    /** Prepare the screen just before showing */
    public prepare() {
        const match3Config = slotGetConfig();
        this.pillar?.setup(match3Config);
        this.slot.setup(match3Config);
    }

    /** Update the screen */
    public update() {
        this.slot.update();
        console.log(this.slot.isPlaying());
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
            this.gameContainer.scale.set(1);
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
        } else {
            const divY = 220;
            this.gameContainer.scale.set(0.9);
            this.gameContainer.x = centerX;
            this.gameContainer.y = this.gameContainer.height * 0.5;

            this.buyFreeSpinButton.scale.set(0.65);
            this.buyFreeSpinButton.x = 220;
            this.buyFreeSpinButton.y = height * 0.6;

            this.gameLogo.scale.set(0.75);
            this.gameLogo.x = divY;
            this.gameLogo.y = height - this.gameLogo.height - divY - 120;

            const multiplierTierY = height * 0.6 - 40;
            const multiplierScale = 0.75;

            this.divineJackpotTier.scale.set(multiplierScale);
            this.divineJackpotTier.x = width - this.roundResult.width * 0.6;
            this.divineJackpotTier.y = multiplierTierY;

            this.blessedJackpotTier.scale.set(multiplierScale);
            this.blessedJackpotTier.x = width - this.roundResult.width * 0.6;
            this.blessedJackpotTier.y = multiplierTierY + 110;

            this.angelicJackpotTier.scale.set(multiplierScale);
            this.angelicJackpotTier.x = width - this.roundResult.width * 0.6;
            this.angelicJackpotTier.y = multiplierTierY + 220;

            this.grandJackpotTier.scale.set(multiplierScale);
            this.grandJackpotTier.x = width - this.roundResult.width * 0.6;
            this.grandJackpotTier.y = multiplierTierY + 330;

            this.roundResult.scale.set(0.75);
            this.roundResult.x = width * 0.5;
            this.roundResult.y = height - this.roundResult.height - 360;

            this.babyZeus.x = 160;
            this.babyZeus.y = centerY - 200;
        }

        const isMobile = document.documentElement.id === 'isMobile';
        this.controlPanel.resize(width, height, isMobile);
    }

    /** Show screen with animations */
    public async show() {
        // bgm.play('common/bgm-game.mp3', { volume: 0.75 });
    }

    /** Hide screen with animations */
    public async hide() {
        await waitFor(0.3);
    }

    private async onResumeStart(data: SlotOnResumeStartData) {
        if (this.resuming) return;
        this.resuming = true;

        await navigation.presentPopup<ErrorPopupData>(ErrorPopup, {
            title: 'Information',
            message: 'Resuming game...',
        });

        this.controlPanel.setCredit(userSettings.getBalance());
        this.controlPanel.disableBetting();
        this.buyFreeSpinButton.enabled = false;
        this.controlPanel.setTitle(this.betGreetings[Math.floor(Math.random() * this.betGreetings.length)]);
        this.roundResult.clearResults();

        await waitFor(1);

        await navigation.dismissPopup();

        if (data.bonusMeter.length >= 4) {
            Object.values(this.slot.jackpot.jackpots).forEach((_, index) => {
                this.jackpotTiers[index].setActiveDots(data.bonusMeter[index]);
            });

            if (data.resumeType == 3) {
                // cascade
                this.slot.startResumeSpin(data.bet, data.bonusMeter);
            }

            if (data.resumeType == 2 && data.freeSpins != null) {
                // Free spins
                this.slot.startResumeFreeSpin(data.bet, data.freeSpins, data.bonusMeter);
            }
        }
    }

    private async onResumeEnd() {
        if (!this.resuming) return;
        this.resuming = false;
        this.controlPanel.setCredit(userSettings.getBalance());
        this.controlPanel.enableBetting();
        this.buyFreeSpinButton.enabled = true;
        this.controlPanel.setTitle(this.betGreetings[Math.floor(Math.random() * this.betGreetings.length)]);
    }

    /** Fires when there are match */
    private async onMatch(data: SlotOnMatchData) {
        if (data.wins.length > 0) {
            sfx.play('common/sfx-combo.wav');
            await waitFor(1);
            sfx.play('common/sfx-explode.wav');
            sfx.play('common/sfx-win.wav');
            // stop control panel matches animation
            this.controlPanel.stopMatchMessages();

            for (const win of data.wins) {
                this.roundResult.addResult(win.types.length, `symbol-${win.types[0]}`, win.amount, this.currency);
                this.controlPanel.addMatchMessage(win.types.length, win.types[0], win.amount, this.currency);
            }

            this.controlPanel.playMatchMessages();

            if (!data.isFreeSpins) {
                const result = await GameAPI.collect({ gamecode: this.slot.gamecode });
                userSettings.setBalance(result.balance);
                this.slot.spinIndex = result.index + 1;
                this.controlPanel.setCredit(userSettings.getBalance());
            }
        }
    }

    /** Fires if player wins */
    private onWin(amount: number) {
        if (this.slot.isFreeSpinPlaying()) {
            this.controlPanel.setWinTitle(i18n.t('win', { amount: formatCurrency(amount, this.currency) }));
            return;
        }

        if (this.slot.isPlaying()) {
            if (amount > 0) {
                this.controlPanel.setWinTitle(i18n.t('win', { amount: formatCurrency(amount, this.currency) }));
            } else {
                this.controlPanel.setTitle(
                    this.preBetGreetings[Math.floor(Math.random() * this.preBetGreetings.length)],
                );
            }
            return;
        }

        if (this.slot.isResuming()) {
            this.controlPanel.setWinTitle(i18n.t('win', { amount: formatCurrency(amount, this.currency) }));
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
    private async onScatterMatch(data: SlotOnScatterMatch) {
        if (data) {
            sfx.play('common/sfx-ring.wav');
        }
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onJackpotMatch(data: SlotOnJackpotMatchData) {
        await this.vfx?.onJackpotMatch(data);
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onJackpotTrigger(data: SlotOnJackpotTriggerData): Promise<void> {
        return new Promise((resolve) => {
            const jackpotNames = slotGetJackpotNames();
            navigation.presentPopup<JackpotWinPopupData>(JackpotWinPopup, {
                name: jackpotNames[data.jackpot.type - 11], // we need to add minus 10 to get index 0, 1, 2, 3
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

    private async onColumnMoveStart(data: SlotOnColumnMoveStartData) {
        if (data) {
            sfx.play('common/sfx-fall-swoosh.wav');
        }
    }

    private async onColumnMoveComplete(data: SlotOnColumnMoveCompleteData) {
        if (data) {
            sfx.play('common/sfx-impact.wav', { volume: 0.75 });
            if (data.hasScatter) {
                sfx.play('common/sfx-scatter.wav');
            }
        }
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onWinFreeSpinTrigger(data: SlotOnWinFreeSpinTriggerData): Promise<void> {
        await navigation.showTransition(Transition);

        return new Promise((resolve) => {
            navigation.presentPopup<FreeSpinPopupData>(FreeSpinPopup, {
                title: i18n.t('youHaveWon'),
                message: i18n.t('freeSpins'),
                totalFreeSpins: data.totalFreeSpins,
                callback: async () => {
                    await navigation.dismissPopup();

                    bgm.play('common/bgm-free-spins.mp3', { volume: 0.5 });
                    await waitFor(1);
                    const bet = userSettings.getBet();
                    const spinMode = userSettings.getSpinMode();
                    this.slot.startFreeSpin(bet, spinMode);
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 spins tart */
    private async onSpinStart() {
        Object.values(this.slot.jackpot.jackpots).forEach((jackpot, index) => {
            this.jackpotTiers[index].setActiveDots(jackpot.active);
        });
    }

    public async onWinExtraFreeSpinTrigger(data: SlotOnWinExtraFreeSpinData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<FreeSpinPopupData>(FreeSpinPopup, {
                title: i18n.t('youHaveWon'),
                message: i18n.t('extraFreeSpins'),
                totalFreeSpins: data.extraFreeSpins,
                callback: async () => {
                    await navigation.dismissPopup();
                    await waitFor(1);
                    resolve();
                },
            });
        });
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onFreeSpinStart(data: SlotFreeSpinStartData) {
        this.controlPanel.disableAutoplay();
        this.controlPanel.setMessage(i18n.t('freeSpinsLeft', { spins: data.remainingSpins }));
    }

    private async onNextFreeSpinStart(data: SlotOnNextFreeSpinData) {
        this.roundResult.clearResults();
        this.vfx?.playSetActiveJackpots(data);
        this.controlPanel.setMessage(i18n.t('freeSpinsLeft', { spins: data.remainingSpins }));
    }

    /** Fires when the match3 grid finishes auto-processing */
    private async onFreeSpinComplete(data: SlotOnFreeSpinCompleteData): Promise<void> {
        return new Promise((resolve) => {
            navigation.presentPopup<FreeSpinWinPopupData>(FreeSpinWinPopup, {
                amount: data.amount,
                spins: data.spins,
                callback: async () => {
                    this.controlPanel.setMessage('');

                    const result = await GameAPI.collect({ gamecode: this.slot.gamecode });
                    userSettings.setBalance(result.balance);
                    this.slot.spinIndex = result.index + 1;
                    this.controlPanel.setCredit(userSettings.getBalance());

                    await navigation.dismissPopup();

                    bgm.play('common/bgm-game.mp3', { volume: 0.5 });

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
        this.controlPanel.setMessage(i18n.t('autoplaySpinsLeft', { spins: data.remainingSpins }));
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onAutoplaySpinStart(data: SlotOnAutoplaySpinStartData) {
        this.roundResult.clearResults();
        this.controlPanel.enableAutoplay();
        this.controlPanel.setMessage(i18n.t('autoplaySpinsLeft', { spins: data.remainingSpins }));
    }

    /** Fires when the match3 grid finishes auto-processing */
    private onAutoplaySpinComplete(data: SlotOnAutoplaySpinCompleteData) {
        this.controlPanel.enableAutoplay();
        this.controlPanel.setMessage(i18n.t('autoplaySpinsLeft', { spins: data.remainingSpins }));
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
    private onProcessStart() {}

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
