import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';
import { formatCurrency } from '../utils/formatter';
const defaultSprite = 'slot-bird';

const defaultPaytableSpecialCardOptions = {
    image: defaultSprite,
    description: '',
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

export type PaytableSpecialCardOptions = typeof defaultPaytableSpecialCardOptions;

export class PaytableSpecialCard extends Container {
    private image: Sprite;

    private labelMessage: Label;

    private mainLayout: List;

    private layout: List;

    constructor(options: Partial<PaytableSpecialCardOptions> = {}) {
        super();
        const opts = { ...defaultPaytableSpecialCardOptions, ...options };
        this.mainLayout = new List({ type: 'horizontal', elementsMargin: 100 });
        this.addChild(this.mainLayout);

        this.layout = new List({ type: 'vertical' });
        this.mainLayout.addChild(this.layout);

        this.image = Sprite.from(opts?.image ?? defaultSprite);
        this.image.anchor.y = 0.1;
        this.image.anchor.x = 0.5;
        this.image.scale.set(0.45);
        this.layout.addChild(this.image);

        opts.paylines?.forEach((payline) => {
            const label = new Label(`${payline.match} - ${formatCurrency(payline.amount || 0)}`, {
                fill: '#ffffff',
                fontSize: 18,
                fontWeight: '200',
            });
            this.layout.addChild(label);
        });

        this.labelMessage = new Label(opts.description, {
            fill: '#ffffff',
            fontSize: 18,
            align: 'left',
            fontWeight: '200',
        });
        this.labelMessage.anchor.y = -0.8;
        this.mainLayout.addChild(this.labelMessage);
    }
}
