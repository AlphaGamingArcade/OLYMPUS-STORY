import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { Switcher } from './Switcher';

const defaultAudioSwitcherOptions = {
    title: '',
    description: '',
    elementsMargin: 0,
};

export type AudioSwitcherOptions = typeof defaultAudioSwitcherOptions;

export class AudioSwitcher extends Container {
    private container: Container;
    private title: Label;
    private description: Label;
    private switcher: Switcher;
    private layout: List;

    constructor(options: Partial<AudioSwitcherOptions> = {}) {
        super();

        const opts = { ...defaultAudioSwitcherOptions, ...options };

        this.layout = new List({ type: 'horizontal', elementsMargin: opts.elementsMargin });
        this.addChild(this.layout);

        this.container = new Container();
        this.layout.addChild(this.container);

        this.title = new Label(opts.title, {
            fill: '#FCC100',
            align: 'left',
        });
        this.title.anchor.set(0);
        this.container.addChild(this.title);

        this.description = new Label(opts.description, {
            fill: '#FFFFFF',
            align: 'left',
            fontWeight: '400',
            fontSize: 20,
        });

        this.description.anchor.set(0);
        this.description.y = this.title.height + 5;
        this.container.addChild(this.description);

        this.switcher = new Switcher();
        this.switcher.scale.set(0.75);
        this.layout.addChild(this.switcher);
    }

    public onPress(callBack: () => void) {
        this.switcher.onPress.connect(callBack);
    }

    /**
     * This method updates the display of the mute state to match the provided muted value.
     * @param value - The audio state
     */
    public forceSwitch(value: boolean) {
        // Force the visual switched state to be the muted state
        this.switcher.forceSwitch(value);
    }
}
