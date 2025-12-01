import { Container, Sprite } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';

const defaultGameFeatureCardOptions = {
    image: 'modal-money-wilds',
    label: '',
    fontSize: 18,
};

export type GameFeatureCardOptions = typeof defaultGameFeatureCardOptions;

export class GameFeatureCard extends Container {
    private image: Sprite;
    private descriptionLabel: Label;
    private mainLayout: List;

    constructor(options: Partial<GameFeatureCardOptions> = {}) {
        super();

        const opts = { ...defaultGameFeatureCardOptions, ...options };

        this.mainLayout = new List({ type: 'vertical' });
        this.addChild(this.mainLayout);

        this.image = Sprite.from(opts.image);
        this.image.anchor.set(0.5);
        this.image.anchor.y = 0.4;
        this.image.scale.set(1);
        this.mainLayout.addChild(this.image);

        this.descriptionLabel = new Label(options.label, {
            fill: 0xffffff,
            fontSize: opts.fontSize,
            fontWeight: '200',
        });
        this.descriptionLabel.anchor.set(0.5);
        this.mainLayout.addChild(this.descriptionLabel);
    }
}
