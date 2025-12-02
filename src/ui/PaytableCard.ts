import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';
import { formatCurrency } from '../utils/formatter';

const defaultPaytableCardOptions = {
    image: 'symbol-0',
    betAmount: 0,
    currency: 'USD',
    patterns: [
        { min: 0, max: 0, multiplier: 0 },
        { min: 0, max: 0, multiplier: 0 },
        { min: 0, max: 0, multiplier: 0 },
    ],
};

export type PaytableCardOptions = typeof defaultPaytableCardOptions;

export class PaytableCard extends Container {
    private image: Sprite;
    private layoutList: List;
    private betAmount: number;
    private currency: string;

    constructor(options: Partial<PaytableCardOptions> = {}) {
        super();
        const opts = { ...defaultPaytableCardOptions, ...options };

        this.layoutList = new List({ type: 'vertical' });
        this.addChild(this.layoutList);

        this.image = Sprite.from(opts.image);
        this.image.anchor.y = 0.1;
        this.image.anchor.x = 0.5;
        this.image.scale.set(0.5);
        this.layoutList.addChild(this.image);

        this.betAmount = opts.betAmount;
        this.currency = opts.currency;

        opts.patterns?.forEach((pattern) => {
            const label = new Label(
                `${pattern.min} - ${pattern.max} - ${formatCurrency(this.betAmount * pattern.multiplier, this.currency)}`,
                {
                    fill: '#ffffff',
                    fontSize: 18,
                    fontWeight: '200',
                },
            );
            this.layoutList.addChild(label);
        });
    }
}
