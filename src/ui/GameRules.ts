import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { GameFeatureCard } from './GameFeatureCard';

export class GameRulesSection extends Container {
    private descriptionLabel: Label;
    private mainLayout: List;

    /** Horizontal layout */
    private cardsLayout: List;

    private moneyWildsFeatureCard: GameFeatureCard;
    private multiplierWildsFeatureCard: GameFeatureCard;

    constructor() {
        super();
        this.mainLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.addChild(this.mainLayout);

        this.descriptionLabel = new Label('Modal informaiton game rules description', {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: '200',
        });
        this.descriptionLabel.anchor.set(0.5);
        this.mainLayout.addChild(this.descriptionLabel);

        this.cardsLayout = new List({ type: 'horizontal', elementsMargin: 10 });
        this.mainLayout.addChild(this.cardsLayout);

        this.moneyWildsFeatureCard = new GameFeatureCard({
            label: 'Money wild description',
        });
        this.cardsLayout.addChild(this.moneyWildsFeatureCard);

        this.multiplierWildsFeatureCard = new GameFeatureCard({
            label: 'Money wilds description',
            image: 'modal-multiplier-wilds',
        });
        this.cardsLayout.addChild(this.multiplierWildsFeatureCard);
    }

    public resize(_width: number, _height: number) {
        this.mainLayout.x = 150;
        this.mainLayout.y = -175;

        this.cardsLayout.x = -275;
        this.cardsLayout.y = 230;
    }
}
