import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from '../ui/Label';
import { IconButton } from '../ui/IconButton2';
import { navigation } from '../utils/navigation';
import { AudioSwitcher } from '../ui/AudioSwitcher';
import { bgm, sfx } from '../utils/audio';

/** Popup for volume and game mode settings - game mode cannot be changed during gameplay */
export class InfoPopup extends Container {
    /** The dark semi-transparent background covering current screen */
    private bg: Sprite;
    /** The popup title label */
    private title: Label;
    /** Butotn that closes the popup */
    private closeButton: IconButton;
    /** The panel background */
    private panel: Graphics;
    /** Layout that organises the UI components */
    private mainLayout: List;
    // /** Bet info */
    // private betInfo: ControllerBetInfo;

    /** Sounds Wrapper Layout that organises the UI components */
    private audioLayout: List;

    /** Sound FX Switch */
    private soundFXSwitcher: AudioSwitcher;
    /** Ambient Switch */
    private ambientMusicSwitcher: AudioSwitcher;
    /** Action handler */
    private onUpdate?: () => void;

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

        this.title = new Label('Game Information', {
            fill: '#FCC100',
        });
        this.title.anchor.set(0.5);
        this.title.x = this.panel.width * 0.5;
        this.title.y = 45;
        this.panel.addChild(this.title);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-default-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = this.panel.width - 60;
        this.closeButton.y = 45;
        this.closeButton.onPress.connect(() => navigation.dismissPopup());
        this.panel.addChild(this.closeButton);

        this.mainLayout = new List({ type: 'horizontal', elementsMargin: 150 });
        this.panel.addChild(this.mainLayout);

        /** Bets Adjsuter */
        // this.betInfo = new ControllerBetInfo();
        // this.mainLayout.addChild(this.betInfo);
        // this.betInfo.onPress((action) => {
        //     if (action == 'increase') {
        //         controllerSettings.increaseBet();
        //     }
        //     if (action == 'decrease') {
        //         controllerSettings.decreaseBet();
        //     }
        //     /** Update ui */
        //     if (this.onUpdate) {
        //         this.onUpdate();
        //     }
        // });

        /** AMbient and SFX */
        this.audioLayout = new List({ type: 'vertical', elementsMargin: 50 });
        this.mainLayout.addChild(this.audioLayout);

        /** Ambient music Switcher */
        this.ambientMusicSwitcher = new AudioSwitcher({
            title: 'Ambient music',
            description: 'Ambient music sub text',
        });
        this.ambientMusicSwitcher.onPress(() => {
            const bgmVolume = bgm.getVolume();
            if (bgmVolume <= 0) {
                bgm.setVolume(1);
                this.ambientMusicSwitcher.forceSwitch(true);
            } else {
                bgm.setVolume(0);
                this.ambientMusicSwitcher.forceSwitch(false);
            }

            /** Update ui */
            if (this.onUpdate) {
                this.onUpdate();
            }
        });
        this.audioLayout.addChild(this.ambientMusicSwitcher);

        /** Sound FX */
        this.soundFXSwitcher = new AudioSwitcher({
            title: 'Sound FX',
            description: 'Sound FX Description',
        });
        this.soundFXSwitcher.onPress(() => {
            const sfxVolumn = sfx.getVolume();
            if (sfxVolumn <= 0) {
                sfx.setVolume(1);
                this.soundFXSwitcher.forceSwitch(true);
            } else {
                sfx.setVolume(0);
                this.soundFXSwitcher.forceSwitch(false);
            }

            /** Update ui */
            if (this.onUpdate) {
                this.onUpdate();
            }
        });
        this.audioLayout.addChild(this.soundFXSwitcher);

        this.mainLayout.x = this.panel.width * 0.5 - this.mainLayout.width * 0.5;
        this.mainLayout.y = this.panel.height * 0.5 - this.mainLayout.height * 0.5;
    }

    /** Resize the popup, fired whenever window size changes */
    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;

        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            // Portrait - make panel fill most of the screen
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

            // Reposition elements
            this.title.x = panelWidth * 0.5;
            this.closeButton.x = panelWidth - 60;
            this.mainLayout.x = panelWidth * 0.5 - this.mainLayout.width * 0.5;
            this.mainLayout.y = panelHeight * 0.5 - this.mainLayout.height * 0.5;
        } else if (isMobile && !isPortrait) {
            // Landscape - wider panel
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

            // Reposition elements
            this.title.x = panelWidth * 0.5;
            this.closeButton.x = panelWidth - 60;
            this.mainLayout.x = panelWidth * 0.5 - this.mainLayout.width * 0.5;
            this.mainLayout.y = panelHeight * 0.5 - this.mainLayout.height * 0.5;
        } else {
            // Desktop - keep original size
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

            // Reposition elements
            this.title.x = panelWidth * 0.5;
            this.closeButton.x = panelWidth - 60;
            this.mainLayout.x = panelWidth * 0.5 - this.mainLayout.width * 0.5;
            this.mainLayout.y = panelHeight * 0.5 - this.mainLayout.height * 0.5;
        }

        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;
    }

    /** Set things up just before showing the popup */
    public prepare(data: any) {
        // Game mode switcher should be disabled during gameplay
        const bgmVolume = bgm.getVolume();
        bgm.setVolume(bgmVolume <= 0 ? 0 : 1);
        this.ambientMusicSwitcher.forceSwitch(bgmVolume <= 0);

        // Adjusting sound effects volume and switcher
        const sfxVolume = sfx.getVolume();
        sfx.setVolume(sfxVolume <= 0 ? 0 : 1);
        this.soundFXSwitcher.forceSwitch(sfxVolume <= 0);

        // this.onUpdate = data.updateFn;
        // this.betInfo.enabled = !Boolean(data.isSpinning);
    }

    public update() {}
}
