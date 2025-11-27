import { Container } from 'pixi.js';
import { Checkbox } from './Checkbox';
import { Label } from './Label';

const defaultCheckboxWithLabelOptions = {
    isChecked: false,
    label: '',
};

export type CheckboxWithLabelOptions = typeof defaultCheckboxWithLabelOptions;

export class CheckboxWithLabel extends Container {
    private container: Container;
    private checkbox: Checkbox;
    private messageLabel: Label;
    private _onPress?: () => void;

    constructor(options: Partial<CheckboxWithLabelOptions> = {}) {
        super();

        const opts = { ...defaultCheckboxWithLabelOptions, ...options };

        this.container = new Container();
        this.addChild(this.container);

        this.checkbox = new Checkbox();
        this.checkbox.y = -(this.checkbox.height / 2);
        this.container.addChild(this.checkbox);
        this.checkbox.onPress.connect(() => {
            if (this._onPress) {
                this._onPress();
            }
        });

        this.messageLabel = new Label(opts.label, { fontSize: 25, fill: '#ffffff' });
        this.messageLabel.x = this.checkbox.width + 100;
        this.container.addChild(this.messageLabel);

        this.container.x = -200;
    }

    public get check(): boolean {
        return this.checkbox.active == 0;
    }

    public set check(v: boolean) {
        this.checkbox.forceSwitch(v);
    }

    public onPress(callBack: () => void) {
        this._onPress = callBack;
    }
}
