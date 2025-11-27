import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
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
    /** Container for the popup UI components */
    private panel: Graphics;
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

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.interactive = true;
        this.bg.alpha = 0.7;
        this.bg.tint = 0x000000;
        this.addChild(this.bg);

        const width = 540;
        const height = 570;
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

        this.layout = new List({ type: 'vertical', elementsMargin: 40 });
        this.layout.x = width / 2;
        this.layout.y = 100;
        this.panel.addChild(this.layout);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-default-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = width - this.closeButton.width - 20;
        this.closeButton.y = this.closeButton.width + 20;
        this.closeButton.onPress.connect(() => {
            navigation.dismissPopup();
        });
        this.panel.addChild(this.closeButton);

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
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;

        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;

        const isMobile = document.documentElement.id === 'isMobile';
        if (isMobile) {
            this.panel.scale.set(1.75);
        } else {
            this.panel.scale.set(1);
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
