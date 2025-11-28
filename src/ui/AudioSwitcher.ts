import { Container } from 'pixi.js';
import { Label } from './Label';
import { Switcher } from './Switcher';

const defaultAudioSwitcherOptions = {
    title: '',
    description: '',
    width: 400,
    titleDescriptionSpacing: 8,
};

export type AudioSwitcherOptions = typeof defaultAudioSwitcherOptions;

export class AudioSwitcher extends Container {
    private textContainer: Container;
    private title: Label;
    private description: Label;
    private switcher: Switcher;
    private _width: number;

    constructor(options: Partial<AudioSwitcherOptions> = {}) {
        super();

        const opts = { ...defaultAudioSwitcherOptions, ...options };
        this._width = opts.width;

        // Text container on the left
        this.textContainer = new Container();
        this.addChild(this.textContainer);

        this.title = new Label(opts.title, {
            fill: '#FCC100',
            align: 'left',
            fontSize: 24,
        });
        this.title.anchor.set(0);
        this.textContainer.addChild(this.title);

        this.description = new Label(opts.description, {
            fill: '#FFFFFF',
            align: 'left',
            fontWeight: '400',
            fontSize: 18,
        });
        this.description.anchor.set(0);
        this.description.y = this.title.height + opts.titleDescriptionSpacing;
        this.textContainer.addChild(this.description);

        // Switcher on the right
        this.switcher = new Switcher();
        this.switcher.scale.set(0.75);
        this.addChild(this.switcher);

        // Position switcher at the right edge
        this.positionSwitcher();
    }

    private positionSwitcher() {
        // Get the bounds after scale is applied
        const switcherBounds = this.switcher.getBounds();

        // Position switcher at right edge
        this.switcher.x = this._width - switcherBounds.width;
        // Center vertically with the text container
        this.switcher.y = this.textContainer.height / 2 - switcherBounds.height / 2;
    }

    public onPress(callBack: () => void) {
        this.switcher.onPress.connect(callBack);
    }

    public forceSwitch(value: boolean) {
        this.switcher.forceSwitch(value);
    }
}
