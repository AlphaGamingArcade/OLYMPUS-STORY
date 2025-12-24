import { Container } from 'pixi.js';
import { Label } from './Label';
import { List } from '@pixi/ui';
export class MaxWinSection extends Container {
    private title1: Label;
    private description1: Label;

    private title2: Label;
    private description2: Label;

    private mainLayout: List;

    constructor() {
        super();

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 25 });
        this.addChild(this.mainLayout);

        this.title1 = new Label('MAX WIN', {
            fill: '#ffffff',
            fontSize: 32,
            fontWeight: '200',
            wordWrap: true,
            wordWrapWidth: 800,
            align: 'center',
        });
        this.title1.anchor.set(0.5);
        this.mainLayout.addChild(this.title1);

        this.description1 = new Label(
            'The maximum win amount is limited to 5,000x. If the total win of a round reaches 5,000x bet the round immediately ends, win is awarded and all remaining free spins are forfeited.',
            {
                fill: '#ffffff',
                fontSize: 18,
                fontWeight: '200',
                wordWrap: true,
                wordWrapWidth: 800,
                align: 'center',
            },
        );
        this.description1.anchor.set(0.5);
        this.mainLayout.addChild(this.description1);

        this.title2 = new Label('BUY FREE SPINS', {
            fill: '#ffffff',
            fontSize: 32,
            fontWeight: '200',
            wordWrap: true,
            wordWrapWidth: 800,
            align: 'center',
        });
        this.title2.anchor.set(0.5);
        this.mainLayout.addChild(this.title2);

        this.description2 = new Label(
            'The FREE SPINS round can be instantly triggered from the base game by buying it. Pay 100x current total bet to trigger the FREE SPINS feature. When buying the FREE SPINS feature 4, 5, or 6 SCATTER symbols are guaranteed to trigger FREE SPINS feature.',
            {
                fill: '#ffffff',
                fontSize: 18,
                fontWeight: '200',
                wordWrap: true,
                wordWrapWidth: 800,
                align: 'center',
            },
        );
        this.description2.anchor.set(0.5);
        this.mainLayout.addChild(this.description2);
    }
    public resize(width: number, height: number) {
        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            this.title1.y = 100;

            this.title1.style.fontSize = 42;
            this.title1.style.wordWrapWidth = 600;

            this.description1.style.fontSize = 28;

            this.title2.style.fontSize = 42;

            this.description2.style.fontSize = 28;

            this.mainLayout.y = 140;
            this.mainLayout.elementsMargin = 100;
        } else if (isMobile && !isPortrait) {
            this.title1.y = 100;
            this.title1.style.fontSize = 42;
            this.title1.style.wordWrapWidth = 1000;

            this.description1.style.fontSize = 28;

            this.title2.style.fontSize = 42;

            this.description2.style.fontSize = 28;

            this.mainLayout.y = 140;
            this.mainLayout.elementsMargin = 100;

            this.mainLayout.y = 80;
            this.mainLayout.elementsMargin = 75;
        } else {
            this.title1.y = 60;
            this.title1.style.fontSize = 32;
            this.title1.style.wordWrapWidth = 800;

            this.title2.style.fontSize = 32;

            this.description1.style.fontSize = 18;
            this.description2.style.fontSize = 18;

            this.mainLayout.y = 60;
            this.mainLayout.elementsMargin = 25;
        }

        this.mainLayout.x = width * 0.5;
    }
}
