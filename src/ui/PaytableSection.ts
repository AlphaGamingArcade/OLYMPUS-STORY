import { Container } from 'pixi.js';
import { Label } from './Label';
import { userSettings } from '../utils/userSettings';
import { Paytable } from '../slot/Match3Config';
import { List } from '@pixi/ui';
import { gameConfig } from '../utils/gameConfig';

const defaultPayTableSectionOptions = {
    paytables: [
        {
            type: 0,
            patterns: [
                { min: 0, max: 0, multiplier: 0 },
                { min: 0, max: 0, multiplier: 0 },
                { min: 0, max: 0, multiplier: 0 },
            ],
        },
    ],
};

export type PayTableSectionOptions = typeof defaultPayTableSectionOptions;

export class PayTableSection extends Container {
    private symbolsDescriptionLabel: Label;
    private mainLayout: List;
    private betAmount: number;
    private currency: string;
    private paytables: Paytable[];

    constructor(opts: Partial<PayTableSectionOptions> = {}) {
        super();

        this.betAmount = 0;
        this.currency = 'USD';
        this.paytables = opts.paytables ?? [];

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 25 });
        this.addChild(this.mainLayout);

        this.symbolsDescriptionLabel = new Label(
            'Symbols pay regardless of their position. Your payout is based on how many identical symbols appear when the spin ends.',
            {
                fill: '#ffffff',
                fontSize: 18,
                fontWeight: '200',
                wordWrap: true,
                wordWrapWidth: 800,
                align: 'center',
            },
        );
        this.symbolsDescriptionLabel.anchor.set(0.5);
        this.mainLayout.addChild(this.symbolsDescriptionLabel);
    }

    public resize(width: number, height: number) {
        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            this.symbolsDescriptionLabel.y = 100;
            this.symbolsDescriptionLabel.style.fontSize = 28;
            this.symbolsDescriptionLabel.style.wordWrapWidth = 600;
        } else if (isMobile && !isPortrait) {
            this.symbolsDescriptionLabel.y = 100;
            this.symbolsDescriptionLabel.style.fontSize = 28;
            this.symbolsDescriptionLabel.style.wordWrapWidth = 1000;
        } else {
            this.symbolsDescriptionLabel.y = 60;
            this.symbolsDescriptionLabel.style.fontSize = 18;
            this.symbolsDescriptionLabel.style.wordWrapWidth = 800;
        }

        this.symbolsDescriptionLabel.x = width * 0.5;
    }

    public prepare() {
        this.setup();
    }

    public setup() {
        this.betAmount = userSettings.getBet();
        this.currency = userSettings.getCurrency();
        this.paytables = gameConfig.getPaytables();

        console.log('SETUP', this.paytables);
    }
}
