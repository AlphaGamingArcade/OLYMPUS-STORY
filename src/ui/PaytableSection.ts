import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { PaytableCard } from './PaytableCard';
import { PaytableSpecialCard } from './PaytableSpecialCard';

const defaultPayTableSectionOptions = {
    paylines: [
        {
            image: 'slot-letter-a',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 5,
                },
                {
                    match: 4,
                    multiplier: 10,
                },
                {
                    match: 5,
                    multiplier: 20,
                },
            ],
        },
        {
            image: 'slot-letter-k',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 0.5,
                },
                {
                    match: 4,
                    multiplier: 1,
                },
                {
                    match: 5,
                    multiplier: 1.5,
                },
            ],
        },
        {
            image: 'slot-letter-j',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 1,
                },
                {
                    match: 4,
                    multiplier: 2,
                },
                {
                    match: 5,
                    multiplier: 2.5,
                },
            ],
        },
        {
            image: 'slot-shark',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 1,
                },
                {
                    match: 4,
                    multiplier: 1.5,
                },
                {
                    match: 5,
                    multiplier: 3,
                },
            ],
        },
        {
            image: 'slot-turtle',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 1,
                },
                {
                    match: 4,
                    multiplier: 1.75,
                },
                {
                    match: 5,
                    multiplier: 2,
                },
            ],
        },
        {
            image: 'slot-seal',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 1,
                },
                {
                    match: 4,
                    multiplier: 1.25,
                },
                {
                    match: 5,
                    multiplier: 1.5,
                },
            ],
        },
        {
            image: 'slot-octopus',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 0.5,
                },
                {
                    match: 4,
                    multiplier: 1,
                },
                {
                    match: 5,
                    multiplier: 1.5,
                },
            ],
        },
        {
            image: 'slot-penguin',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 0.5,
                },
                {
                    match: 4,
                    multiplier: 0.75,
                },
                {
                    match: 5,
                    multiplier: 1,
                },
            ],
        },
        {
            image: 'slot-mega',
            description: '',
            paylines: [
                {
                    match: 3,
                    multiplier: 1,
                },
                {
                    match: 4,
                    multiplier: 1.5,
                },
                {
                    match: 5,
                    multiplier: 2,
                },
            ],
        },
        {
            image: 'slot-bonus',
            description: 'Modal info slot bonus text',
            paylines: [
                {
                    match: 3,
                    multiplier: 0.25,
                },
                {
                    match: 4,
                    multiplier: 0.75,
                },
                {
                    match: 5,
                    multiplier: 1,
                },
            ],
        },
        {
            image: 'slot-wild',
            description: 'Modal info slot wild text',
            paylines: [
                {
                    match: 3,
                    multiplier: 15,
                },
                {
                    match: 4,
                    multiplier: 10,
                },
                {
                    match: 5,
                    multiplier: 20,
                },
            ],
        },
    ],
};

export type PayTableSectionOptions = typeof defaultPayTableSectionOptions;

export class PayTableSection extends Container {
    private symbolsDescriptionLabel: Label;

    private layout: List;

    private symbolLayout1: List;

    private symbolLayout2: List;

    private betAmount: number;

    constructor(opts: Partial<PayTableSectionOptions> = {}) {
        super();

        const options = { ...defaultPayTableSectionOptions, ...opts };

        this.betAmount = 0;

        this.layout = new List({ type: 'vertical', elementsMargin: 25 });
        this.addChild(this.layout);

        this.symbolsDescriptionLabel = new Label('Modal info paytable text', {
            fill: '#ffffff',
            fontSize: 18,
            fontWeight: '200',
        });
        this.symbolsDescriptionLabel.anchor.set(0.5);
        this.layout.addChild(this.symbolsDescriptionLabel);

        this.symbolLayout1 = new List({ type: 'horizontal', elementsMargin: 5 });
        this.layout.addChild(this.symbolLayout1);

        const paylines = (options?.paylines ?? []).slice(0, 9) ?? [];
        for (let index = 0; index < paylines.length; index++) {
            const newElement = {
                image: paylines[index].image,
                special: false,
                description: paylines[index].description,
                paylines: paylines[index].paylines.map((payline) => ({
                    match: payline.match,
                    amount: payline.multiplier * this.betAmount,
                })),
            };
            const paylineCard = new PaytableCard(newElement);
            this.symbolLayout1.addChild(paylineCard);
        }

        this.symbolLayout2 = new List({ type: 'horizontal' });
        this.layout.addChild(this.symbolLayout2);

        const bonusPaylines = (options?.paylines ?? []).slice(9, 12) ?? [];
        for (let index = 0; index < bonusPaylines.length; index++) {
            const newElement = {
                image: bonusPaylines[index].image,
                special: true,
                description: bonusPaylines[index].description,
                paylines: bonusPaylines[index].paylines.map((payline) => ({
                    match: payline.match,
                    amount: payline.multiplier * this.betAmount,
                })),
            };
            const paylineCard = new PaytableSpecialCard(newElement);
            this.symbolLayout2.addChild(paylineCard);
        }
    }

    public resize(_width: number, _height: number) {
        this.layout.y = -150;
        this.layout.x = 125;

        this.symbolLayout1.x = -(this.symbolLayout1.width / 2) + 75;
        this.symbolLayout2.x = -(this.symbolLayout1.width / 2) + 165;
    }

    public setup(bet: number) {
        this.betAmount = bet;
    }
}
