import { Container, Sprite } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { Jackpot } from '../slot/SlotConfig';
import { gameConfig } from '../utils/gameConfig';
import { i18n } from '../i18n/i18n';

export class FeatureSection extends Container {
    private descriptionLabel: Label;
    private mainLayout: List;
    private descriptionLabel2: Label;
    private symbolsContainer: List;
    private symbols: Sprite[] = [];
    private jackpots: Jackpot[] = [];

    constructor() {
        super();
        // Grab from game config
        this.jackpots = gameConfig.getJackpots();

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 40 });
        this.addChild(this.mainLayout);

        this.descriptionLabel = new Label(i18n.t('cascadeFeatureDesc1'), {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: '200',
            wordWrap: true, // Enable word wrapping
            align: 'center', // Optional: alignment for the wrapped text
            wordWrapWidth: 1000,
            lineHeight: 24,
        });

        this.mainLayout.addChild(this.descriptionLabel);

        this.symbolsContainer = new List({ type: 'horizontal', elementsMargin: 10 });
        this.mainLayout.addChild(this.symbolsContainer);

        for (const jackpot of this.jackpots.reverse()) {
            const jackpotSprite = Sprite.from(`symbol-${jackpot.type}`);
            jackpotSprite.anchor.y = 0.5;
            jackpotSprite.scale.set(0.5);
            this.symbolsContainer.addChild(jackpotSprite);
            this.symbols.push(jackpotSprite);
        }

        // Center the symbols container after adding all symbols
        this.symbolsContainer.pivot.x = this.symbolsContainer.width / 2;

        this.descriptionLabel2 = new Label(i18n.t('cascadeFeatureDesc2'), {
            fill: 0xffffff,
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '200',
            wordWrap: true,
            wordWrapWidth: 1000,
            align: 'center',
        });

        this.mainLayout.addChild(this.descriptionLabel2);
    }

    public resize(width: number, height: number) {
        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            this.descriptionLabel.style.fontSize = 28;
            this.descriptionLabel.style.lineHeight = 34;
            this.descriptionLabel.style.wordWrapWidth = 700;

            for (const symbol of this.symbols) {
                symbol.anchor.y = 1.25;
            }

            this.descriptionLabel2.style.fontSize = 28;
            this.descriptionLabel2.style.lineHeight = 34;
            this.descriptionLabel2.style.wordWrapWidth = 700;

            this.mainLayout.y = 220;
        } else if (isMobile && !isPortrait) {
            this.descriptionLabel.style.fontSize = 28;
            this.descriptionLabel.style.lineHeight = 34;
            this.descriptionLabel.style.wordWrapWidth = 1400;

            for (const symbol of this.symbols) {
                symbol.anchor.y = 0.75;
            }

            this.descriptionLabel2.style.fontSize = 28;
            this.descriptionLabel2.style.lineHeight = 34;
            this.descriptionLabel2.style.wordWrapWidth = 1400;

            this.mainLayout.y = 160;
        } else {
            this.descriptionLabel.style.fontSize = 18;
            this.descriptionLabel.style.lineHeight = 24;
            this.descriptionLabel.style.wordWrapWidth = 1000;

            for (const symbol of this.symbols) {
                symbol.anchor.y = 0.5;
            }

            this.descriptionLabel2.style.fontSize = 18;
            this.descriptionLabel2.style.lineHeight = 24;
            this.descriptionLabel2.style.wordWrapWidth = 1000;

            this.mainLayout.y = 100;
        }

        this.mainLayout.elementsMargin = 50;
        this.mainLayout.x = width * 0.5;
    }
}
