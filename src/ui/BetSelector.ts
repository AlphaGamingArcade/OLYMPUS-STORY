import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';

export class BetSelector extends Container {
    private container: Container;
    private layout: List;
    private title: Label;
    // private buttons: ControllerBetButtons;
    private betContainer: Sprite;
    private betAmountLabel: Label;

    constructor() {
        super();

        this.container = new Container();
        this.container.y = 50;
        this.container.x = 110;
        this.addChild(this.container);

        this.layout = new List({ type: 'vertical', elementsMargin: 10 });
        this.container.addChild(this.layout);

        this.title = new Label('Total bet', {
            fill: '#FCC100',
            align: 'center',
        });
        this.title.anchor.set(0.5);
        this.title.anchor.y = 1.5;
        this.layout.addChild(this.title);

        this.betContainer = Sprite.from('bet-container');
        this.betContainer.anchor.set(0.5);
        this.layout.addChild(this.betContainer);

        this.betAmountLabel = new Label(0, {
            fill: 0xffffff,
            fontSize: 25,
        });
        this.betAmountLabel.anchor.set(0.5);
        this.betContainer.addChild(this.betAmountLabel);

        // this.buttons = new ControllerBetButtons();
        // this.buttons.pivot.set(0.5);
        // this.layout.addChild(this.buttons);
    }

    public get text(): string {
        return this.betAmountLabel.text;
    }

    public set text(v: string) {
        this.betAmountLabel.text = v;
    }
}
