import { Container, Sprite, TextStyle, Text } from 'pixi.js';
import gsap from 'gsap';

/**
 * Round Result Item - displays total count, symbol, and amount
 */
export class RoundResultItem extends Container {
    /** Inner container */
    private container: Container;
    private background: Sprite;
    private total: number;
    private currency: string;
    private symbol: Sprite;
    private amount: number;
    private totalLabel: Text;
    private amountLabel: Text;

    constructor() {
        super();

        this.container = new Container();
        this.addChild(this.container);

        // Background frame
        this.background = Sprite.from('round-result-item-frame');
        this.background.anchor.set(0.5);
        this.container.addChild(this.background);

        // Total label (left side - "8")
        const totalStyle = new TextStyle({
            fontFamily: 'Spartanmb Extra Bold',
            fontSize: 48,
            fill: '#FFFFFF',
            stroke: {
                width: 4,
                color: '#000000',
            },
        });

        this.totalLabel = new Text({
            text: 'Do you want to play with sound?',
            style: totalStyle,
        });
        this.totalLabel.x = -this.background.width * 0.4;
        this.totalLabel.anchor.set(0.5);
        this.container.addChild(this.totalLabel);

        // Symbol (middle - crown icon)
        this.symbol = Sprite.from('symbol-ring');
        this.symbol.anchor.set(0.5);
        this.symbol.scale.set(0.35);
        this.symbol.x = -100;
        this.container.addChild(this.symbol);

        // Amount label (right side - "$1.00")
        const amountStyle = new TextStyle({
            fontFamily: 'Spartanmb Extra Bold',
            fontSize: 36,
            fill: '#FFFFFF',
            stroke: {
                width: 3,
                color: '#000000',
            },
        });
        this.amountLabel = new Text({
            text: '$0.00',
            style: amountStyle,
        });
        this.amountLabel.x = this.background.width * 0.25;
        this.amountLabel.anchor.set(0.5, 0.5);
        this.container.addChild(this.amountLabel);

        this.currency = '$';
        this.total = 0;
        this.amount = 0;
    }

    /** Setup the result item with all values */
    public setup(total: number, symbolTexture: string, amount: number, currency: string) {
        this.total = total;
        this.amount = amount;
        this.currency = currency;

        // Set total label
        this.totalLabel.text = total.toString();

        // Set symbol
        this.symbol.texture = Sprite.from(symbolTexture).texture;

        // Set amount label
        this.amountLabel.text = `${this.currency}${this.amount.toLocaleString()}`;

        // Fit text to container if needed
        this.fitAmountText();
    }

    /** Fit amount text to container by scaling down if needed */
    private fitAmountText() {
        // Reset scale to 1 first to get true width
        this.amountLabel.scale.set(1);

        // Maximum width (right section of background)
        const maxWidth = this.background.width * 0.5;

        if (this.amountLabel.width > maxWidth) {
            const scale = maxWidth / this.amountLabel.width;
            this.amountLabel.scale.set(scale);
        }
    }

    /** Get current total */
    public getTotal(): number {
        return this.total;
    }

    /** Get current amount */
    public getAmount(): number {
        return this.amount;
    }

    /** Show item */
    public async show(animated = true) {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        this.visible = true;

        if (animated) {
            this.container.alpha = 0;
            this.container.scale.set(1.5);
            gsap.to(this.container, { alpha: 1, duration: 0.3, ease: 'linear' });
            await gsap.to(this.container.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out' });
        } else {
            this.container.alpha = 1;
            this.container.scale.set(1);
        }
    }

    /** Hide item */
    public async hide(animated = true) {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);

        if (animated) {
            gsap.to(this.container, { alpha: 0, duration: 0.3, ease: 'linear' });
            await gsap.to(this.container.scale, { x: 1.5, y: 1.5, duration: 0.3, ease: 'back.in' });
        } else {
            this.container.alpha = 0;
            this.container.scale.set(0);
        }
        this.visible = false;
    }
}
