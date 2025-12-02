import { Container, Sprite, Text, Texture } from 'pixi.js';
import { List } from '@pixi/ui';
import { navigation } from '../utils/navigation';
import { CheckboxWithLabel } from '../ui/CheckboxWithLabel';
import { IconButton } from '../ui/IconButton2';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';

export type OnPressAutoplayData = {
    spins: number;
};

/** Popup for autoplay settings */
export class AutoplayPopup extends Container {
    /** The dark semi-transparent background covering current screen */
    private bg: Sprite;
    /** Panel background sprite */
    private panelBg: Sprite;
    /** Base container for all panel content */
    private panelBase: Container;
    /** layout */
    private layout: List;
    /** Close button */
    private closeButton: IconButton;
    /** modal title */
    private title: Text;
    /** Quick spin */
    private quickSpinCheckbox: CheckboxWithLabel;
    /** Turbo Spin */
    private turboSpinCheckbox: CheckboxWithLabel;
    /** Autoplay button */
    private autoplayButton: Button;
    /** autoplay slider */
    private autoplaySlider: Slider;
    /** on autoplay press */
    private _onPressAutoplay?: (data: OnPressAutoplayData) => void;
    /** Panel dimensions */
    private panelWidth = 540;
    private panelHeight = 570;

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.interactive = true;
        this.bg.alpha = 0.7;
        this.bg.tint = 0x000000;
        this.addChild(this.bg);

        // Create panel base container
        this.panelBase = new Container();
        this.addChild(this.panelBase);

        // Create panel background sprite
        this.panelBg = Sprite.from(Texture.WHITE);
        this.panelBg.tint = 0x3b3b3b;
        this.panelBg.width = this.panelWidth;
        this.panelBg.height = this.panelHeight;
        this.panelBase.addChild(this.panelBg);

        this.layout = new List({ type: 'vertical', elementsMargin: 40 });
        this.layout.x = this.panelWidth / 2;
        this.layout.y = 100;
        this.panelBase.addChild(this.layout);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-default-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = this.panelWidth - this.closeButton.width - 20;
        this.closeButton.y = this.closeButton.width + 20;
        this.closeButton.onPress.connect(() => {
            navigation.dismissPopup();
        });
        this.panelBase.addChild(this.closeButton);

        this.title = new Text({
            text: 'Autoplay Settings',
            style: {
                fill: '#FCC100',
                fontSize: 32,
                fontWeight: 'bold',
            },
        });
        this.title.anchor.set(0.5);
        this.layout.addChild(this.title);

        // Quick Spin
        this.quickSpinCheckbox = new CheckboxWithLabel({
            label: 'Quick spin',
            isChecked: false,
        });
        this.layout.addChild(this.quickSpinCheckbox);

        this.turboSpinCheckbox = new CheckboxWithLabel({
            label: 'Turbo Spin',
            isChecked: false,
        });
        this.layout.addChild(this.turboSpinCheckbox);

        // Autoplay slider
        this.autoplaySlider = new Slider({
            text: 'Number of Auto spins',
            min: 10,
            max: 1000,
            value: 10,
        });
        this.autoplaySlider.onUpdate.connect((value: number) => {
            const rounded = Math.round(value / 10) * 10; // Round to nearest 10
            this.autoplaySlider.text = `Number of Auto Spins (${rounded})`;
        });
        this.layout.addChild(this.autoplaySlider);

        // Autoplay start button
        this.autoplayButton = new Button({
            text: 'Autoplay',
        });
        this.autoplayButton.onPress.connect(async () => {
            if (this._onPressAutoplay) {
                // const spins = Math.round(this.autoplaySlider.value / 10) * 10;
                await navigation.dismissPopup();
                // this._onPressAutoplay({ spins });
            }
        });
        this.autoplayButton.anchor.set(0.5);
        this.layout.addChild(this.autoplayButton);

        // Center panel base
        this.panelBase.pivot.set(this.panelWidth / 2, this.panelHeight / 2);
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;

        this.panelBase.x = width * 0.5;
        this.panelBase.y = height * 0.5;

        const isMobile = document.documentElement.id === 'isMobile';
        if (isMobile) {
            this.panelBase.scale.set(1.5);
        } else {
            this.panelBase.scale.set(1);
        }
    }

    /** Set things up just before showing the popup */
    public prepare(callBack: (data: OnPressAutoplayData) => void) {
        this._onPressAutoplay = callBack;

        // Reset to defaults
        // this.autoplaySlider.value = 10;
        // this.autoplaySlider.text = 'Number of Auto Spins (10)';
    }

    /** Show the popup */
    public async show() {
        this.visible = true;
    }

    /** Hide the popup */
    public async hide() {
        this.visible = false;
    }
}
