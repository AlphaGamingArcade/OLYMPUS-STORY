import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { IconInfoCard } from './IconInfoCard';

const defaultHowToPlaySectionOptions = {
    icons1: [
        {
            image: 'icon-button-minus-default-view',
            label: 'Button to decrease the bet value',
        },
        {
            image: 'icon-button-add-default-view',
            label: 'Button to increase the bet value',
        },
    ],
    icons2: [
        {
            image: 'icon-button-sound-on-default-view',
            label: 'Sound FX and Ambient Music ON Button',
        },
        {
            image: 'icon-button-sound-off-hover-view',
            label: 'Sound FX and Ambient Music OFF Button',
        },
        {
            image: 'icon-button-settings-default-view',
            label: 'Settings Button to display the game settings popup.',
        },
        {
            image: 'icon-button-info-default-view',
            label: 'Information Button to display the game informations popup.',
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

    private infoCards: IconInfoCard[] = [];

    constructor(opts: Partial<HowToPlaySectionOptions> = {}) {
        super();

        const options = { ...defaultHowToPlaySectionOptions, ...opts };

        // Add background graphics

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 50 });
        this.addChild(this.mainLayout);

        this.topLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.topLayout);

        options.icons1.forEach((icon) => {
            const card = new IconInfoCard({ image: icon.image, label: icon.label, imageScale: 0.75 });
            this.topLayout.addChild(card);
            this.infoCards.push(card);
        });

        this.bottomLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.bottomLayout);

        this.secondTitleLabel = new Label('Main game interface', {
            fill: '#FCC100',
        });
        this.secondTitleLabel.anchor.set(0.5);
        this.bottomLayout.addChild(this.secondTitleLabel);

        this.creditAndBetLabel = new Label('CREDITS and BET labels show the current balance and current total bet.', {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: '200',
            wordWrap: true,
            align: 'center',
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
            this.infoCards.push(card);
        });
    }

    public resize(width: number, height: number) {
        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            this.creditAndBetLabel.style.wordWrapWidth = 800;
            this.creditAndBetLabel.style.fontSize = 28;
            this.secondTitleLabel.style.fontSize = 36;

            for (const card of this.infoCards) {
                card.text.style.fontSize = 28;
                card.text.style.wordWrapWidth = 600;
                card.updateLayout();
            }
        } else if (isMobile && !isPortrait) {
            this.creditAndBetLabel.style.wordWrapWidth = 1200;
            this.creditAndBetLabel.style.fontSize = 28;
            this.secondTitleLabel.style.fontSize = 36;

            for (const card of this.infoCards) {
                card.text.style.fontSize = 28;
                card.text.style.wordWrapWidth = 1200;
                card.updateLayout();
            }
        } else {
            this.creditAndBetLabel.style.wordWrapWidth = 1000;
            this.creditAndBetLabel.style.fontSize = 18;
            this.secondTitleLabel.style.fontSize = 28;

            for (const card of this.infoCards) {
                card.text.style.fontSize = 18;
                card.text.style.wordWrapWidth = 1000;
                card.updateLayout();
            }
        }

        this.mainLayout.elementsMargin = 50;
        this.topLayout.elementsMargin = 20;
        this.bottomLayout.elementsMargin = 20;
        this.mainLayout.x = width * 0.5;
        this.mainLayout.y = 80;
    }

    public hide() {
        // Clean up info cards
        for (const card of this.infoCards) {
            card.destroy({ children: true });
        }
        this.infoCards = [];
    }
}
