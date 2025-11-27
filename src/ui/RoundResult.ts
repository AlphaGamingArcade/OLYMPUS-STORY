import { Container, FillGradient, Sprite, TextStyle, Texture } from 'pixi.js';
import gsap from 'gsap';
import { Label } from './Label';
import { RoundResultItem } from './RoundResultItem';
import { IconButton } from './IconButton';

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
    private arrowUpButton: IconButton;
    private arrowDownButton: IconButton;

    // Scrolling properties
    private readonly maskHeight = 325;
    private readonly itemSpacing = 60;
    private currentScrollOffset = 0;

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
        this.messageLabel1.y = -this.messageLabel1.height - 10;
        this.messageContainer.addChild(this.messageLabel1);

        this.messageLabel2 = new Label(`RESULT`, style1);
        this.messageLabel2.style.fontSize = 60;
        this.messageLabel2.y = -10;
        this.messageLabel2.style.fill = verticalGradient1;
        this.messageContainer.addChild(this.messageLabel2);

        this.messageContainer.y = -100;

        // Container for result items
        this.resultItemsContainer = new Container();
        this.resultItemsContainer.y = -30;
        this.container.addChild(this.resultItemsContainer);

        // Create a mask for the result items container
        const mask = new Sprite(Texture.WHITE);
        mask.width = this.frame.width - 110;
        mask.height = this.maskHeight;
        mask.anchor.set(0.5, 0);
        mask.y = -65;
        this.container.addChild(mask);
        this.resultItemsContainer.mask = mask;

        this.arrowUpButton = new IconButton({
            icon: 'round-result-arrow-up',
            width: 80,
            height: 80,
            backgroundColor: 0x4a90e2,
            hoverColor: 0x5aa3f5,
            pressColor: 0x3a7bc8,
        });
        this.arrowUpButton.y = -70;
        this.arrowUpButton.enabled = false;
        this.arrowUpButton.onPress.connect(() => this.scrollUp());
        this.container.addChild(this.arrowUpButton);

        this.arrowDownButton = new IconButton({
            icon: 'round-result-arrow-down',
            width: 80,
            height: 80,
            backgroundColor: 0x4a90e2,
            hoverColor: 0x5aa3f5,
            pressColor: 0x3a7bc8,
        });
        this.arrowDownButton.y = 270;
        this.arrowDownButton.enabled = false;
        this.arrowDownButton.onPress.connect(() => this.scrollDown());
        this.container.addChild(this.arrowDownButton);
    }

    /** Scroll up */
    private scrollUp() {
        this.currentScrollOffset = Math.max(0, this.currentScrollOffset - this.itemSpacing);
        this.updateScrollPosition();
        this.updateArrowStates();
    }

    /** Scroll down */
    private scrollDown() {
        const maxScroll = this.getMaxScrollOffset();
        this.currentScrollOffset = Math.min(maxScroll, this.currentScrollOffset + this.itemSpacing);
        this.updateScrollPosition();
        this.updateArrowStates();
    }

    /** Get maximum scroll offset */
    private getMaxScrollOffset(): number {
        const totalContentHeight = this.resultItems.length * this.itemSpacing;
        return Math.max(0, totalContentHeight - this.maskHeight);
    }

    /** Update scroll position with animation */
    private updateScrollPosition() {
        gsap.to(this.resultItemsContainer, {
            y: -30 - this.currentScrollOffset,
            duration: 0.3,
            ease: 'power2.out',
        });
    }

    /** Update arrow button states based on scroll position */
    private updateArrowStates() {
        const maxScroll = this.getMaxScrollOffset();

        // Enable/disable up arrow
        this.arrowUpButton.enabled = this.currentScrollOffset > 0;

        // Enable/disable down arrow
        this.arrowDownButton.enabled = this.currentScrollOffset < maxScroll && maxScroll > 0;
    }

    /** Add a result item */
    public addResult(total: number, symbolTexture: string, amount: number, currency: string) {
        const resultItem = new RoundResultItem();
        resultItem.scale.set(0.5);
        resultItem.setup(total, symbolTexture, amount, currency);

        // Add new item at the beginning of the array
        this.resultItems.unshift(resultItem);

        // Add to container at the bottom (last position)
        this.resultItemsContainer.addChild(resultItem);

        // Reposition all items - new item starts at y=0 (bottom), older items move up
        this.resultItems.forEach((item, index) => {
            const targetY = index * this.itemSpacing;
            gsap.to(item, { y: targetY, duration: 0.3, ease: 'back.out' });
        });

        // Animate the new item in
        resultItem.show(true);

        // Update arrow states after adding new item
        this.updateArrowStates();

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

        // Reset scroll position and arrow states
        this.currentScrollOffset = 0;
        this.resultItemsContainer.y = -30;
        this.updateArrowStates();
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

        // Update arrow states when showing
        this.updateArrowStates();
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
