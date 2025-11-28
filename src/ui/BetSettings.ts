import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';
import { IconButton } from './IconButton2';

export class BetSettings extends Container {
    private layout: List;
    private title: Label;
    // private buttons: ControllerBetButtons;
    private betContainer: Sprite;
    private betAmountLabel: Label;

    private betButtonLayout: List;
    private minusButton: IconButton;
    private plusButton: IconButton;

    constructor() {
        super();

        this.layout = new List({ type: 'vertical', elementsMargin: 10 });
        this.addChild(this.layout);

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

        this.betButtonLayout = new List({ type: 'horizontal', elementsMargin: 60 });
        this.layout.addChild(this.betButtonLayout);

        this.minusButton = new IconButton({
            imageDefault: 'icon-button-default-minus-bet-view',
            imageHover: 'icon-button-active-minus-bet-view',
            imagePressed: 'icon-button-active-minus-bet-view',
            imageDisabled: 'icon-button-disabled-minus-bet-view',
        });
        this.minusButton.anchor.set(0.5);
        this.betButtonLayout.addChild(this.minusButton);

        this.plusButton = new IconButton({
            imageDefault: 'icon-button-default-plus-bet-view',
            imageHover: 'icon-button-active-plus-bet-view',
            imagePressed: 'icon-button-active-plus-bet-view',
            imageDisabled: 'icon-button-disabled-plus-bet-view',
        });
        this.plusButton.anchor.set(0.5);
        this.betButtonLayout.addChild(this.plusButton);

        this.betButtonLayout.x = -58;
    }

    public get text(): string {
        return this.betAmountLabel.text;
    }

    public set text(v: string) {
        this.betAmountLabel.text = v;
    }
}
