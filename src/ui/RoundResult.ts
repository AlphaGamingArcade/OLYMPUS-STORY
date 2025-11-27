import { Container, FillGradient, Sprite, TextStyle, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Label } from './Label';
import { RoundResultItem } from './RoundResultItem';

/**
 * Round Result container with title and result items
 */
export class RoundResult extends Container {
    /** Inner container */
    private container: Container;
    private frame: Sprite;
    private messageLabel1: Label;
    private messageLabel2: Label;
    private messageContainer: Container;
    private resultItemsContainer: Container;
    private resultItems: RoundResultItem[] = [];

    constructor() {
        super();

        this.container = new Container();
        this.addChild(this.container);

        this.frame = Sprite.from('frame_round_result');
        this.frame.anchor.set(0.5);
        this.frame.scale.set(0.5);
        this.frame.y = 100;
        this.container.addChild(this.frame);

        this.messageContainer = new Container();
        this.container.addChild(this.messageContainer);

        const verticalGradient1 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#fff3ce' },
                { offset: 1, color: '#e0a114' },
            ],
            textureSpace: 'local',
        });

        const style1 = new TextStyle({
            fontFamily: 'Spartanmb Extra Bold',
            fontSize: 30,
            stroke: {
                width: 6,
                color: '#9E7617',
            },
        });
        this.messageLabel1 = new Label(`ROUND`, style1);
        this.messageLabel1.style.fill = verticalGradient1;
        this.messageLabel1.y = -this.messageLabel1.height * 0.9;
        this.messageContainer.addChild(this.messageLabel1);

        this.messageLabel2 = new Label(`RESULT`, style1);
        this.messageLabel2.style.fontSize = 60;
        this.messageLabel2.style.fill = verticalGradient1;
        this.messageContainer.addChild(this.messageLabel2);

        this.messageContainer.y = -100;

        // Container for result items
        this.resultItemsContainer = new Container();
        this.resultItemsContainer.y = -30;
        this.container.addChild(this.resultItemsContainer);

        // Create a mask for the result items container
        const maskHeight = 325; // Maximum height for visible items
        const mask = new Sprite(Texture.WHITE);
        mask.width = this.frame.width - 110;
        mask.height = maskHeight;
        mask.anchor.set(0.5, 0);
        mask.y = -65;
        this.container.addChild(mask);
        this.resultItemsContainer.mask = mask;
    }

    /** Add a result item */
    public addResult(total: number, symbolTexture: string, amount: number, currency: string) {
        const resultItem = new RoundResultItem();
        resultItem.scale.set(0.5);
        resultItem.setup(total, symbolTexture, amount, currency);

        const itemSpacing = 60; // Vertical spacing between items

        // Add new item at the beginning of the array
        this.resultItems.unshift(resultItem);

        // Add to container at the bottom (last position)
        this.resultItemsContainer.addChild(resultItem);

        // Reposition all items - new item starts at y=0 (bottom), older items move up
        this.resultItems.forEach((item, index) => {
            const targetY = index * itemSpacing;
            gsap.to(item, { y: targetY, duration: 0.3, ease: 'back.out' });
        });

        // Animate the new item in
        resultItem.show(true);

        return resultItem;
    }

    /** Clear all result items */
    public async clearResults() {
        let animPromise = [];
        for (const resultItem of this.resultItems) {
            animPromise.push(resultItem.hide());
        }

        await Promise.all(animPromise);

        this.resultItems.forEach((item) => {
            item.destroy();
        });
        this.resultItems = [];
        this.resultItemsContainer.removeChildren();
    }

    /** Get all result items */
    public getResults(): RoundResultItem[] {
        return this.resultItems;
    }

    /** Show round result */
    public async show(animated = true) {
        gsap.killTweensOf(this.container.scale);
        gsap.killTweensOf(this.container);
        this.visible = true;
        this.eventMode = 'static';

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

    /** Hide round result */
    public async hide(animated = true) {
        this.eventMode = 'none';
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
