import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';
import { formatCurrency } from '../utils/formatter';

const defaultSprite = 'slot-bird';

const defaultPaytableCardOptions = {
    image: defaultSprite,
    paylines: [
        {
            match: 3,
            amount: 0,
        },
        {
            match: 4,
            amount: 0,
        },
        {
            match: 5,
            amount: 0,
        },
    ],
};

export type PaytableCardOptions = typeof defaultPaytableCardOptions;

export class PaytableCard extends Container {
    private image: Sprite;
    private layout: List;

    constructor(options: Partial<PaytableCardOptions> = {}) {
        super();
        const opts = { ...defaultPaytableCardOptions, ...options };

        this.layout = new List({ type: 'vertical' });
        this.addChild(this.layout);

        this.image = Sprite.from(opts?.image ?? defaultSprite);
        this.image.anchor.y = 0.1;
        this.image.anchor.x = 0.5;
        this.image.scale.set(0.35);
        this.layout.addChild(this.image);

        opts.paylines?.forEach((payline) => {
            const label = new Label(`${payline.match} - ${formatCurrency(payline.amount || 0, 'usd')}`, {
                fill: '#ffffff',
                fontSize: 18,
                fontWeight: '200',
            });
            this.layout.addChild(label);
        });
    }
}
