import { Container, Graphics } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { GameFeatureCard } from './GameFeatureCard';

export class FeatureSection extends Container {
    private panel: Graphics;

    private descriptionLabel: Label;
    private mainLayout: List;

    /** Horizontal layout */
    private cardsLayout: List;

    private moneyWildsFeatureCard: GameFeatureCard;
    private multiplierWildsFeatureCard: GameFeatureCard;

    constructor() {
        super();

        // Add background graphics
        this.panel = new Graphics();
        this.addChild(this.panel);

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.panel.addChild(this.mainLayout);

        this.descriptionLabel = this.descriptionLabel = new Label(
            "The CASCADE FEATURE activates after every spin. Winning combinations are paid out and all winning symbols are removed from the reels. The remaining symbols fall downward to fill the empty spaces, while new symbols descend from above.\n\nThis effect continues as long as new winning combinations are created. There is no limit to how many consecutive drops can occur. All winnings are added to the player's balance once all resulting drops from the base spin are complete.\n\nSpecial award symbols and SCATTER symbols are not removed and will remain on the reels until all drops from the same spin have finished.",
            {
                fill: 0xffffff,
                fontSize: 18,
                fontWeight: '200',
                wordWrap: true, // Enable word wrapping
                align: 'center', // Optional: alignment for the wrapped text
            },
        );

        this.mainLayout.addChild(this.descriptionLabel);

        // this.cardsLayout = new List({ type: 'horizontal', elementsMargin: 10 });
        // this.mainLayout.addChild(this.cardsLayout);

        // this.moneyWildsFeatureCard = new GameFeatureCard({
        //     label: 'Money wild description',
        // });
        // this.cardsLayout.addChild(this.moneyWildsFeatureCard);

        // this.multiplierWildsFeatureCard = new GameFeatureCard({
        //     label: 'Money wilds description',
        //     image: 'modal-multiplier-wilds',
        // });
        // this.cardsLayout.addChild(this.multiplierWildsFeatureCard);
    }

    public resize(width: number, height: number) {
        // Redraw background with current dimensions
        this.panel.clear();
        // this.panel.rect(0, 0, width, height).fill('#585858ff');
        this.panel.rect(0, 0, width, height).fill('transparent');

        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            this.descriptionLabel.y = 340;
            this.descriptionLabel.style.fontSize = 28;
            this.descriptionLabel.style.wordWrapWidth = 800;
        } else if (isMobile && !isPortrait) {
            this.descriptionLabel.y = 210;
            this.descriptionLabel.style.fontSize = 28;
            this.descriptionLabel.style.wordWrapWidth = 1400;
        } else {
            this.descriptionLabel.y = 140;
            this.descriptionLabel.style.fontSize = 18;
            this.descriptionLabel.style.wordWrapWidth = 1000;
        }

        this.descriptionLabel.x = width * 0.5;
    }
}
