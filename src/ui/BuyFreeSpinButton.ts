import { FancyButton } from '@pixi/ui';
import { Container, FillGradient, Sprite, TextStyle, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Label } from './Label';
import { sfx } from '../utils/audio';

/**
 * Buy Free Spin button with hover and press effects
 */
export class BuyFreeSpinButton extends FancyButton {
    /** Inner container for the button content */
    private container: Container;
    private scroll: Sprite;
    private pen: Sprite;
    private frame: Sprite;
    private amountLabel: Label;
    private messageLabel1: Label;
    private messageLabel2: Label;

    constructor() {
        // Create a transparent hit area sprite for the button
        const defaultView = new Sprite(Texture.WHITE);
        defaultView.width = 300;
        defaultView.height = 300;
        defaultView.anchor.set(0.5);
        defaultView.alpha = 0.01; // Nearly invisible but still interactive

        super({
            defaultView,
            anchor: 0.5,
        });

        this.container = new Container();
        this.addChild(this.container);

        this.scroll = Sprite.from('scroll');
        this.scroll.anchor.set(0.5);
        this.scroll.scale.set(0.4);
        this.scroll.y = -20;
        this.container.addChild(this.scroll);

        this.pen = Sprite.from('pen');
        this.pen.anchor.set(0.5);
        this.pen.scale.set(0.3);
        this.pen.y = -60;
        this.pen.x = 60;
        this.container.addChild(this.pen);

        const verticalGradient1 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#FDD44F' },
                { offset: 1, color: '#FF7700' },
            ],
            textureSpace: 'local',
        });

        const style1 = new TextStyle({
            fontFamily: 'Spartanmb Extra Bold',
            fontSize: 40,
            stroke: {
                width: 6,
                color: '#6D3000',
            },
        });
        this.messageLabel1 = new Label(`BUY FREE`, style1);
        this.messageLabel1.style.fill = verticalGradient1;
        this.messageLabel1.y = -this.messageLabel1.height * 0.9;
        this.container.addChild(this.messageLabel1);

        this.messageLabel2 = new Label(`SPIN`, style1);
        this.messageLabel2.style.fontSize = 50;
        this.messageLabel2.style.fill = verticalGradient1;
        this.container.addChild(this.messageLabel2);

        this.frame = Sprite.from('frame_buy_free_spin');
        this.frame.anchor.set(0.5);
        this.frame.scale.set(0.5);
        this.frame.y = 100;
        this.container.addChild(this.frame);

        const verticalGradient2 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#fff3ce' },
                { offset: 1, color: '#e0a114' },
            ],
            textureSpace: 'local',
        });

        const style2 = new TextStyle({
            fontFamily: 'Spartanmb Extra Bold',
            fontSize: 60,
            stroke: {
                width: 3,
                color: '#000000',
            },
            dropShadow: {
                alpha: 1,
                angle: Math.PI / 2,
                blur: 0,
                color: '#000000',
                distance: 4,
            },
        });

        this.amountLabel = new Label(`$7,500`, style2);
        this.amountLabel.style.fill = verticalGradient2;
        this.amountLabel.y = 100;
        this.container.addChild(this.amountLabel);

        // Connect FancyButton events
        this.onDown.connect(this.handleDown.bind(this));
        this.onUp.connect(this.handleUp.bind(this));
        this.onHover.connect(this.handleHover.bind(this));
        this.on('pointerupoutside', this.handleUp.bind(this));
        this.on('pointerout', this.handleOut.bind(this));
    }

    private handleHover() {
        sfx.play('common/sfx-hover.wav');
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        gsap.killTweensOf(this.pen);

        gsap.to(this.container.scale, { x: 1.05, y: 1.05, duration: 0.2, ease: 'back.out' });
        gsap.to(this.container, { y: -5, duration: 0.2, ease: 'power2.out' });

        // Wiggle the pen
        gsap.to(this.pen, {
            rotation: 0.1,
            duration: 0.15,
            ease: 'power2.inOut',
            yoyo: true,
            repeat: 1,
        });
    }

    private handleOut() {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        gsap.killTweensOf(this.pen);

        gsap.to(this.container.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out' });
        gsap.to(this.container, { y: 0, duration: 0.2, ease: 'power2.out' });
        gsap.to(this.pen, { rotation: 0, duration: 0.15, ease: 'power2.out' });
    }

    private handleDown() {
        sfx.play('common/sfx-press.wav');
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);

        // Quick press down - scale and move down
        gsap.to(this.container.scale, { x: 0.95, y: 0.95, duration: 0.1, ease: 'power2.out' });
        gsap.to(this.container, { y: 0, duration: 0.1, ease: 'power2.out' });
    }

    private handleUp() {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);

        // Bounce back up with overshoot
        gsap.to(this.container.scale, { x: 1.05, y: 1.05, duration: 0.2, ease: 'back.out' });
        gsap.to(this.container, { y: -5, duration: 0.2, ease: 'back.out' });
    }

    /** Show button */
    public async show(animated = true) {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        this.visible = true;
        this.interactiveChildren = true;

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

    /** Hide button */
    public async hide(animated = true) {
        this.interactiveChildren = false;
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        gsap.killTweensOf(this.pen);

        if (animated) {
            gsap.to(this.container, { alpha: 0, duration: 0.3, ease: 'linear' });
            await gsap.to(this.container.scale, { x: 1.5, y: 1.5, duration: 0.3, ease: 'back.in' });
        } else {
            this.container.alpha = 0;
            this.container.scale.set(0);
        }
        this.visible = false;
    }

    /** Fit text to container by scaling down if needed */
    private fitTextToContainer() {
        // Get the frame width as the maximum allowed width
        this.amountLabel.scale.set(1);
        const maxWidth = this.frame.width * 0.8; // 80% of frame width for padding
        const textWidth = this.amountLabel.width;

        if (textWidth > maxWidth) {
            // Scale down proportionally to fit
            const scale = maxWidth / textWidth;
            this.amountLabel.scale.set(scale);
        } else {
            // Reset to original scale if text fits
            this.amountLabel.scale.set(1);
        }
    }

    /** Update the amount displayed */
    public setAmount(amount: string) {
        if (this.amountLabel.text == amount) return;
        this.amountLabel.text = amount;
        this.fitTextToContainer();
    }
}
