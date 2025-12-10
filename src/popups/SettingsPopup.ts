import { Container, Sprite, Texture } from 'pixi.js';
import { Label } from '../ui/Label';
import { IconButton } from '../ui/IconButton2';
import { navigation } from '../utils/navigation';
import { AudioSettings } from '../ui/AudioSettings';
import { BetSettings } from '../ui/BetSettings';
import { BetAction, userSettings } from '../utils/userSettings';
import { bgm, sfx } from '../utils/audio';
import { i18n } from '../i18n/i18n';

export type SettingsPopupData = {
    finished: boolean;
    onBetSettingChanged: () => void;
    onAudioSettingChanged: (isOn: boolean) => void;
};

/** Popup for volume and game mode settings */
export class SettingsPopup extends Container {
    private bg: Sprite;
    private title: Label;
    private closeButton: IconButton;
    /** The panel background sprite */
    private panelBg: Sprite;
    /** Base container for all panel content */
    private panelBase: Container;
    /** Height of the panel */
    private panelHeight: number = 0;
    /** Width of the panel */
    private panelWidth: number = 0;

    private betSettings: BetSettings;
    private audioSettings: AudioSettings;

    private onBetSettingChanged?: () => void;
    private onAudioSettingChanged?: (isOn: boolean) => void;

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.interactive = true;
        this.bg.alpha = 0.7;
        this.bg.tint = 0x000000;
        this.addChild(this.bg);

        this.panelWidth = 1400;
        this.panelHeight = 800;

        // Create panel base container
        this.panelBase = new Container();
        this.addChild(this.panelBase);

        // Create panel background sprite
        this.panelBg = Sprite.from(Texture.WHITE);
        this.panelBg.tint = 0x3b3b3b;
        this.panelBg.width = this.panelWidth;
        this.panelBg.height = this.panelHeight;
        this.panelBase.addChild(this.panelBg);

        this.title = new Label(i18n.t('systemSettings'), {
            fill: '#FCC100',
        });
        this.title.anchor.set(0.5);
        this.title.style.fontSize = 32;
        this.panelBase.addChild(this.title);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-default-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.onPress.connect(() => navigation.dismissPopup());
        this.panelBase.addChild(this.closeButton);

        /** Bet Selector */
        this.betSettings = new BetSettings();
        this.betSettings.onIncreaseBet(() => {
            userSettings.setBet(BetAction.INCREASE);
            this.betSettings.text = userSettings.getBet();
            this.onBetSettingChanged?.();
        });
        this.betSettings.onDecreaseBet(() => {
            userSettings.setBet(BetAction.DECREASE);
            this.betSettings.text = userSettings.getBet();
            this.onBetSettingChanged?.();
        });

        this.panelBase.addChild(this.betSettings);

        /** Audio Settings */
        this.audioSettings = new AudioSettings({
            gap: 50,
            width: 400,
        });
        this.audioSettings.onAmbientMusicToggle(() => {
            const bgmVolume = bgm.getVolume();
            const newState = bgmVolume <= 0;
            bgm.setVolume(newState ? 1 : 0);
            this.audioSettings.ambientMusicSwitcher.forceSwitch(!newState);

            const sfxVolume = sfx.getVolume();
            const isAudioOn = newState || sfxVolume > 0;
            this.onAudioSettingChanged?.(isAudioOn);
        });
        this.audioSettings.onSoundFXToggle(() => {
            const sfxVolume = sfx.getVolume();
            const newState = sfxVolume <= 0;
            sfx.setVolume(newState ? 1 : 0);
            this.audioSettings.soundFXSwitcher.forceSwitch(!newState);

            const bgmVolume = bgm.getVolume();
            const isAudioOn = newState || bgmVolume > 0;
            this.onAudioSettingChanged?.(isAudioOn);
        });
        this.panelBase.addChild(this.audioSettings);

        // Center panel base
        this.panelBase.pivot.set(this.panelWidth / 2, this.panelHeight / 2);
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;

        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        let titleFontSize: number;
        let closeButtonScale: number;
        let settingsScale: number;
        let betX: number;
        let betY: number;
        let audioX: number;
        let audioY: number;

        if (isMobile && isPortrait) {
            this.panelWidth = width * (isPortrait ? 0.9 : 0.85);
            this.panelHeight = height * (isPortrait ? 0.85 : 0.9);
            titleFontSize = 52;
            closeButtonScale = 0.75;
            settingsScale = 1.5;
            betX = this.panelWidth * 0.5;
            betY = this.panelHeight * 0.3;
            audioX = this.panelWidth * 0.5 - this.audioSettings.width * 0.5;
            audioY = this.panelHeight * 0.6;
        } else if (isMobile && !isPortrait) {
            this.panelWidth = width * (isPortrait ? 0.9 : 0.85);
            this.panelHeight = height * (isPortrait ? 0.85 : 0.9);
            titleFontSize = 52;
            closeButtonScale = 0.75;
            settingsScale = 1.5;
            betX = this.panelWidth * 0.25;
            betY = this.panelHeight * 0.5 - this.betSettings.height * 0.25;
            audioX = this.panelWidth * 0.5;
            audioY = this.panelHeight * 0.5 - this.audioSettings.height * 0.5;
        } else {
            this.panelWidth = 1400;
            this.panelHeight = 800;
            titleFontSize = 32;
            closeButtonScale = 0.5;
            settingsScale = 1;
            betX = this.panelWidth * 0.25;
            betY = this.panelHeight * 0.5 - this.betSettings.height * 0.25;
            audioX = this.panelWidth * 0.5;
            audioY = this.panelHeight * 0.5 - this.audioSettings.height * 0.5;
        }

        /** Panel background sprite */
        this.panelBg.width = this.panelWidth;
        this.panelBg.height = this.panelHeight;

        /** Center panel base */
        this.panelBase.pivot.set(this.panelWidth / 2, this.panelHeight / 2);
        this.panelBase.x = width * 0.5;
        this.panelBase.y = height * 0.5;

        /** Title */
        this.title.style.fontSize = titleFontSize;
        this.title.x = this.panelWidth * 0.5;
        this.title.y = 100;

        /** Close button */
        this.closeButton.scale.set(closeButtonScale);
        this.closeButton.x = this.panelWidth - 60;
        this.closeButton.y = 60;

        /** Bet settings */
        this.betSettings.scale.set(settingsScale);
        this.betSettings.x = betX;
        this.betSettings.y = betY;

        /** Audio settings */
        this.audioSettings.scale.set(settingsScale);
        this.audioSettings.x = audioX;
        this.audioSettings.y = audioY;
    }

    /** Set things up just before showing the popup */
    public prepare(data: SettingsPopupData) {
        this.betSettings.text = `${userSettings.getBet()}`;
        const bgmVolume = bgm.getVolume();
        const sfxVolume = sfx.getVolume();
        this.audioSettings.setup(bgmVolume > 0, sfxVolume > 0);

        if (data) {
            this.betSettings.setup(!data.finished);
            if (data.onBetSettingChanged) {
                this.onBetSettingChanged = data.onBetSettingChanged;
            }
            if (data.onAudioSettingChanged) {
                this.onAudioSettingChanged = data.onAudioSettingChanged;
            }
        }
    }

    public update() {}
}
