import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { IconInfoCard } from './IconInfoCard';

const defaultHowToPlaySectionOptions = {
    icons1: [
        {
            image: 'controller-minus-default-btn',
            label: 'How to play minus button',
        },
        {
            image: 'controller-plus-default-btn',
            label: 'How to play add button',
        },
    ],
    icons2: [
        {
            image: 'controller-settings-default-btn',
            label: 'Menu button',
        },
        {
            image: 'controller-info-default-btn',
            label: 'Default button',
        },
    ],
};

export type HowToPlaySectionOptions = typeof defaultHowToPlaySectionOptions;
export class HowToPlaySection extends Container {
    private mainLayout: List;

    private topLayout: List;
    private bottomLayout: List;

    private secondTitleLabel: Label;
    private creditAndBetLabel: Label;

    constructor(opts: Partial<HowToPlaySectionOptions> = {}) {
        super();

        const options = { ...defaultHowToPlaySectionOptions, ...opts };

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 50 });
        this.addChild(this.mainLayout);

        this.topLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.topLayout);

        options.icons1.forEach((icon) => {
            const card = new IconInfoCard({ image: icon.image, label: icon.label, imageScale: 0.75 });
            this.topLayout.addChild(card);
        });

        this.bottomLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.bottomLayout);

        this.secondTitleLabel = new Label('Main game interface', {
            fill: '#FCC100',
        });
        this.secondTitleLabel.anchor.set(0.5);
        this.bottomLayout.addChild(this.secondTitleLabel);

        this.creditAndBetLabel = new Label('Credit and bet labels', {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: '200',
        });
        this.bottomLayout.addChild(this.creditAndBetLabel);

        options.icons2.forEach((icon, index) => {
            let scale = 1;
            switch (index) {
                case 1:
                    scale = 1;
                    break;
                case 2:
                    scale = 1;
                    break;
                default:
                    scale = 1;
                    break;
            }
            const card = new IconInfoCard({ image: icon.image, label: icon.label, imageScale: scale });
            this.bottomLayout.addChild(card);
        });
    }

    public resize(_width: number, _height: number) {
        this.mainLayout.x = 150;
        this.mainLayout.y = -170;
    }
}
