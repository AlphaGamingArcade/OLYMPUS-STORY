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

        const width = 1400;
        const height = 800;
        const radius = 10;
        const border = 0;
        const borderColor = '#000000b3';
        const backgroundColor = '#000000b3';

        this.panel = new Graphics()
            .fill(borderColor)
            .roundRect(0, 0, width, height, radius)
            .fill(backgroundColor)
            .roundRect(border, border, width - border * 2, height - border * 2, radius);
        this.panel.pivot.set(width / 2, height / 2);
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

        if (isMobile && isPortrait) {
            const panelWidth = width * 0.9;
            const panelHeight = height * 0.85;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 52;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.75);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            // Vertical layout for mobile portrait
            this.betSettings.scale.set(1.5);
            this.betSettings.x = panelWidth * 0.5;
            this.betSettings.y = panelHeight * 0.3;

            this.audioSettings.scale.set(1.5);
            this.audioSettings.x = panelWidth * 0.5 - this.audioSettings.width * 0.5;
            this.audioSettings.y = panelHeight * 0.6;
        } else if (isMobile && !isPortrait) {
            const panelWidth = width * 0.85;
            const panelHeight = height * 0.9;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 52;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.75);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            // Center bet selector on left side
            this.betSettings.scale.set(1.5);
            this.betSettings.x = panelWidth * 0.25;
            this.betSettings.y = panelHeight * 0.5 - this.betSettings.height * 0.25;

            // Center audio settings on right side
            this.audioSettings.scale.set(1.5);
            this.audioSettings.x = panelWidth * 0.5;
            this.audioSettings.y = panelHeight * 0.5 - this.audioSettings.height * 0.5;
        } else {
            const panelWidth = 1400;
            const panelHeight = 800;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 32;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.5);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            // Center bet selector on left side
            this.betSettings.scale.set(1);
            this.betSettings.x = panelWidth * 0.25;
            this.betSettings.y = panelHeight * 0.5 - this.betSettings.height * 0.25;

            // Center audio settings on right side
            this.audioSettings.scale.set(1);
            this.audioSettings.x = panelWidth * 0.5;
            this.audioSettings.y = panelHeight * 0.5 - this.audioSettings.height * 0.5;
        }

        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;
    }

    /** Set things up just before showing the popup */
    public prepare(data: SettingsPopupData) {
        this.betSettings.text = `${userSettings.getBet()}`;
        this.onBetChanged = data.onBetChanged;

        this.audioSettings.setup();
    }

    public update() {}
}
