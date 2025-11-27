import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from '../ui/Label';
import { IconButton } from '../ui/IconButton2';
import { navigation } from '../utils/navigation';
import { AudioSwitcher } from '../ui/AudioSwitcher';
import { bgm, sfx } from '../utils/audio';

/** Popup for volume and game mode settings - game mode cannot be changed during gameplay */
export class SettingsPopup extends Container {
    /** The dark semi-transparent background covering current screen */
    private bg: Sprite;
    /** Container for the popup UI components */
    private panel: Container;
    /** The popup title label */
    private title: Label;
    /** Butotn that closes the popup */
    private closeButton: IconButton;
    /** The panel background */
    private panelBase: Graphics;
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

        this.bg = new Sprite(Texture.WHITE);
        this.bg.tint = '#000000b3';
        this.bg.alpha = 0;
        this.bg.interactive = true;
        this.addChild(this.bg);

        this.panel = new Container();
        this.addChild(this.panel);

        const width = 1400;
        const height = 800;
        const radius = 10;
        const border = 0;
        const borderColor = '#000000b3';
        const backgroundColor = '#000000b3';

        this.panelBase = new Graphics()
            .fill(borderColor)
            .roundRect(0, 0, width, height, radius)
            .fill(backgroundColor)
            .roundRect(border, border, width - border * 2, height - border * 2, radius);
        this.panel.addChild(this.panelBase);

        this.title = new Label('System Settings', {
            fill: '#FCC100',
        });
        this.title.anchor.set(0.5);
        this.title.x = this.panelBase.width * 0.5;
        this.title.y = 45;
        this.panelBase.addChild(this.title);

        this.closeButton = new IconButton({
            imageDefault: 'controller-close-default-btn',
            imageDisabled: 'controller-close-default-btn',
            imageHover: 'controller-close-default-btn',
            imagePressed: 'controller-close-default-btn',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = this.panelBase.width - 60;
        this.closeButton.y = 45;
        this.closeButton.onPress.connect(() => navigation.dismissPopup());
        this.panelBase.addChild(this.closeButton);

        this.mainLayout = new List({ type: 'horizontal', elementsMargin: 150 });
        this.panelBase.addChild(this.mainLayout);

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

        /** Sounds Adjsuter */
        this.audioLayout = new List({ type: 'vertical', elementsMargin: 50 });
        this.mainLayout.addChild(this.audioLayout);

        /** Ambient music Switcher */
        this.ambientMusicSwitcher = new AudioSwitcher({
            title: 'Ambient music',
            description: 'Ambient music sub text',
            elementsMargin: 30,
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
            elementsMargin: 70,
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

        this.mainLayout.x = this.panelBase.width * 0.5 - this.mainLayout.width / 2;
        this.mainLayout.y = this.panelBase.height * 0.5 - this.mainLayout.height / 2;
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        if (height > width) {
            this.panelBase.scale.set(0.75);
        } else {
            this.panelBase.scale.set(1);
        }
        this.bg.width = width;
        this.bg.height = height;

        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;

        this.panelBase.x = -this.panelBase.width / 2;
        this.panelBase.y = -this.panelBase.height / 2;
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

        this.onUpdate = data.updateFn;
        // this.betInfo.enabled = !Boolean(data.isSpinning);
    }

    public update() {
        // if (formatCurrency(controllerSettings.bet) != this.betInfo.text) {
        //     this.betInfo.text = formatCurrency(controllerSettings.bet);
        // }
    }
}
