import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Label } from '../ui/Label';
import { IconButton } from '../ui/IconButton2';
import { navigation } from '../utils/navigation';
import { AudioSettings } from '../ui/AudioSettings';
import { BetSettings } from '../ui/BetSettings';
import { BetAction, userSettings } from '../utils/userSettings';

export type SettingsPopupData = {
    finished: boolean;
    onBetChanged: () => void;
};

/** Popup for volume and game mode settings */
export class SettingsPopup extends Container {
    private bg: Sprite;
    private title: Label;
    private closeButton: IconButton;
    private panel: Graphics;
    /** Height of the panel */
    private panelHeight: number = 0;
    /** Width of the panel */
    private panelWidth: number = 0;

    private betSettings: BetSettings;
    private audioSettings: AudioSettings;
    private onBetChanged?: () => void;

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.interactive = true;
        this.bg.alpha = 0.7;
        this.bg.tint = 0x000000;
        this.addChild(this.bg);

        this.panelWidth = 1400;
        this.panelHeight = 800;

        const radius = 10;
        const border = 0;
        const borderColor = '#3B3B3B';
        const backgroundColor = '#3B3B3B';

        this.panel = new Graphics()
            .fill(borderColor)
            .roundRect(0, 0, this.panelWidth, this.panelHeight, radius)
            .fill(backgroundColor)
            .roundRect(border, border, this.panelWidth - border * 2, this.panelHeight - border * 2, radius);
        this.panel.pivot.set(this.panelWidth / 2, this.panelHeight / 2);
        this.addChild(this.panel);

        this.title = new Label('System Settings', {
            fill: '#FCC100',
        });
        this.title.anchor.set(0.5);
        this.title.x = this.panel.width * 0.5;
        this.title.y = 100;
        this.title.style.fontSize = 32;
        this.panel.addChild(this.title);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-default-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = this.panel.width - 60;
        this.closeButton.y = 60;
        this.closeButton.onPress.connect(() => navigation.dismissPopup());
        this.panel.addChild(this.closeButton);

        /** Bet Selector */
        this.betSettings = new BetSettings();
        this.betSettings.onIncreaseBet(() => {
            userSettings.setBet(BetAction.INCREASE);
            this.betSettings.text = userSettings.getBet();
            this.onBetChanged?.();
        });
        this.betSettings.onDecreaseBet(() => {
            userSettings.setBet(BetAction.DECREASE);
            this.betSettings.text = userSettings.getBet();
            this.onBetChanged?.();
        });

        this.panel.addChild(this.betSettings);

        /** Audio Settings */
        this.audioSettings = new AudioSettings({
            gap: 50,
            width: 400,
        });
        this.panel.addChild(this.audioSettings);
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

        // Update panel
        this.panel.clear();
        this.panel
            .fill('#3B3B3B')
            .roundRect(0, 0, this.panelWidth, this.panelHeight, 10)
            .fill('#3B3B3B')
            .roundRect(0, 0, this.panelWidth, this.panelHeight, 10);
        this.panel.pivot.set(this.panelWidth / 2, this.panelHeight / 2);
        this.panel.scale.set(1);
        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;

        // Update title
        this.title.style.fontSize = titleFontSize;
        this.title.x = this.panelWidth * 0.5;

        // Update close button
        this.closeButton.scale.set(closeButtonScale);
        this.closeButton.x = this.panelWidth - 60;
        this.closeButton.y = 60;

        // Update bet settings
        this.betSettings.scale.set(settingsScale);
        this.betSettings.x = betX;
        this.betSettings.y = betY;

        // Update audio settings
        this.audioSettings.scale.set(settingsScale);
        this.audioSettings.x = audioX;
        this.audioSettings.y = audioY;
    }

    /** Set things up just before showing the popup */
    public prepare(data: SettingsPopupData) {
        this.betSettings.text = `${userSettings.getBet()}`;

        this.audioSettings.setup();

        if (data) {
            this.betSettings.setup(!data.finished);
            if (data.onBetChanged) {
                this.onBetChanged = data.onBetChanged;
            }
        }
    }

    public update() {}
}
