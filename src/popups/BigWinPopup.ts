import { Container, FillGradient, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { navigation } from '../utils/navigation';
import { ShadowLabel } from '../ui/ShadowLabel';
import { registerCustomEase, resolveAndKillTweens } from '../utils/animation';
import { formatCurrency } from '../utils/formatter';
import { SlotBigWinCategory } from '../slot/SlotUtility';
import { Label } from '../ui/Label';
import { waitFor } from '../utils/asyncUtils';

/** Custom ease curve for y animation of falling pieces - minimal bounce */
const easeSingleBounce = registerCustomEase(
    'M0,0,C0.14,0,0.27,0.191,0.352,0.33,0.43,0.462,0.53,0.963,0.538,1,0.546,0.997,0.672,0.97,0.778,0.97,0.888,0.97,0.993,0.997,1,1',
);

export type BigWinPopupData = {
    category: SlotBigWinCategory;
    amount: number;
    callback: () => void;
};

/** Popup displaying win amount with coin effects */
export class BigWinPopup extends Container {
    /** The dark semi-transparent background covering current screen */
    private bg: Sprite;
    /** Container for the popup UI components */
    private panel: Container;
    /** Container for coin effects */
    private coinContainer: Container;
    /** The first glow effect sprite */
    private glow1: Sprite;
    /** The second glow effect sprite */
    private glow2: Sprite;
    /** The arc panel background */
    private panelArc: Sprite;
    /** The modal text box */
    private textbox: Sprite;
    /** Win amount text */
    private winAmount: ShadowLabel;
    /** Bottom text (IN X FREE SPINS) */
    private topText: Label;
    /** click anywhere state */
    private canClickAnywhere = false;
    /** on click continue */
    private onPressConfirm?: () => void;
    /** Single combined glow and bounce animation timeline */
    private animationTimeline?: gsap.core.Timeline;
    /** Top idle animation */
    private topTextIdleTimeline?: gsap.core.Timeline;
    /** Category of big win */
    private category: SlotBigWinCategory = 'elegant';
    /** Target win amount for counting animation */
    private targetWinAmount = 0;
    /** Current win amount for counting animation */
    private currentWinAmount = 0;
    /** currency */
    private currency = 'USD';
    /** Counting animation tween reference */
    private countTween?: gsap.core.Tween;
    /** Count animation duration */
    private countAnimationDuration: number = 2;
    /** Flag to track if animation is skippable */
    private isSkippable = false;
    /** Screen height for calculating off-screen positions */
    private screenHeight = 0;
    /** Flag to track if this popup instance is currently active */
    private isActive = false;

    constructor() {
        super();

        this.bg = new Sprite(Texture.WHITE);
        this.bg.tint = 0x000000;
        this.bg.interactive = true;
        this.bg.alpha = 0.8;
        this.addChild(this.bg);

        this.panel = new Container();
        this.addChild(this.panel);

        // Coin container - behind panel content but in front of glows
        this.coinContainer = new Container();
        this.panel.addChild(this.coinContainer);

        // First glow effect - behind everything
        this.glow1 = Sprite.from('glow');
        this.glow1.anchor.set(0.5);
        this.glow1.scale.set(2.8);
        this.glow1.y = -100;
        this.glow1.blendMode = 'add';
        this.panel.addChild(this.glow1);

        // Second glow effect - behind everything
        this.glow2 = Sprite.from('glow');
        this.glow2.anchor.set(0.5);
        this.glow2.scale.set(2.5);
        this.glow2.y = -100;
        this.glow2.blendMode = 'add';
        this.glow2.alpha = 0.7;
        this.panel.addChild(this.glow2);

        // Panel arc - in front of glows
        this.panelArc = new Sprite();
        this.panelArc.anchor.set(0.5);
        this.panel.addChild(this.panelArc);

        const verticalGradient2 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#FFF3CE' },
                { offset: 1, color: '#E0A114' },
            ],
            textureSpace: 'local',
        });

        const verticalGradient3 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#FFFFFF' },
                { offset: 1, color: '#FFE9DF' },
            ],
            textureSpace: 'local',
        });

        // TEXTBOX
        this.textbox = Sprite.from('modal-textbox');
        this.textbox.anchor.set(0.5);
        this.textbox.y = 0;
        this.panel.addChild(this.textbox);

        // WIN AMOUNT
        this.winAmount = new ShadowLabel({
            text: formatCurrency(0, this.currency),
            style: {
                fill: verticalGradient2,
                fontFamily: 'Spartanmb Extra Bold',
                align: 'center',
                fontSize: 60,
                stroke: {
                    width: 2,
                    color: '#000000',
                },
            },
            shadowOffsetY: 4,
            shadowColor: '#000000',
            shadowAlpha: 1,
        });
        this.winAmount.y = this.textbox.y - 4;
        this.panel.addChild(this.winAmount);

        this.topText = new Label('', {
            fill: verticalGradient3,
            fontFamily: 'Spartanmb Extra Bold',
            align: 'center',
            fontSize: 100,
            stroke: {
                width: 10,
                color: '#000000',
            },
        });
        this.topText.y = -180;
        this.panel.addChild(this.topText);

        // Add pointer event listeners
        this.bg.eventMode = 'static';
        this.eventMode = 'static';
        this.interactiveChildren = true;

        this.on('pointertap', () => {
            // If counting is active and skippable, skip it
            if (this.isSkippable && this.countTween) {
                this.skipCountingAnimation();
                return;
            }

            // Otherwise handle normal click
            if (!this.canClickAnywhere) return;
            this.onPressConfirm?.();
        });
    }

    /** Animate counting up the win amount */
    private animateWinAmount() {
        this.currentWinAmount = 0;

        const countTween = gsap.to(this, {
            currentWinAmount: this.targetWinAmount,
            duration: this.countAnimationDuration,
            ease: 'power2.out',
            onUpdate: () => {
                // const formatted = `${this.currency}${this.currentWinAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                this.winAmount.text = formatCurrency(this.currentWinAmount, this.currency);
            },
            onComplete: () => {
                gsap.killTweensOf(this.winAmount.scale);

                gsap.fromTo(
                    this.winAmount.scale,
                    {
                        x: 0.85,
                        y: 0.85,
                    },
                    {
                        x: 1,
                        y: 1,
                        duration: 0.6,
                        ease: 'elastic.out(1, 0.6)',
                        onComplete: () => {
                            this.canClickAnywhere = true;
                            this.isSkippable = false;

                            // Close modal automatically
                            this.closePopup();
                        },
                    },
                );
            },
        });

        this.countTween = countTween;
    }

    /** Skip the counting animation and show final amount */
    private skipCountingAnimation() {
        if (!this.countTween) return;

        // Complete the counting tween instantly
        this.countTween.progress(1);
        this.countTween.kill();
        this.countTween = undefined;

        // Set final amount
        this.currentWinAmount = this.targetWinAmount;
        // const formatted = `${this.currency}${this.currentWinAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        this.winAmount.text = formatCurrency(this.currentWinAmount, this.currency);

        // Do the final bounce
        gsap.killTweensOf(this.winAmount.scale);
        gsap.fromTo(
            this.winAmount.scale,
            { x: 0.6, y: 0.6 },
            {
                x: 1.2,
                y: 1.2,
                duration: 0.28,
                ease: 'back.out(4)', // hard punch
                onComplete: () => {
                    gsap.to(this.winAmount.scale, {
                        x: 0.95,
                        y: 0.95,
                        duration: 0.12,
                        ease: 'power2.inOut',
                    });

                    gsap.to(this.winAmount.scale, {
                        x: 1,
                        y: 1,
                        duration: 0.22,
                        ease: 'back.out(2)',
                    });

                    this.canClickAnywhere = true;
                    this.isSkippable = false;

                    this.closePopup();
                },
            },
        );
    }

    private async closePopup() {
        // Only close if this popup is still active
        if (!this.isActive) return;
        // Close modal automatically after some time
        await waitFor(2);
        // Double-check we're still active before calling callback
        if (!this.isActive) return;
        this.onPressConfirm?.();
    }

    /** Start all continuous animations in a single optimized timeline */
    private startContinuousAnimations() {
        if (this.animationTimeline) this.animationTimeline.kill();
        resolveAndKillTweens(this.glow1);
        resolveAndKillTweens(this.glow1.scale);
        resolveAndKillTweens(this.glow2);
        resolveAndKillTweens(this.glow2.scale);

        this.animationTimeline = gsap.timeline({ repeat: -1 });

        this.animationTimeline.to(
            this.glow1,
            {
                rotation: Math.PI * 0.4,
                duration: 12,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
            },
            0,
        );
        this.animationTimeline.to(
            this.glow1.scale,
            {
                x: 3.2,
                y: 3.2,
                duration: 6,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
            },
            0,
        );

        this.animationTimeline.to(
            this.glow2,
            {
                rotation: -Math.PI * 0.3,
                duration: 14,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
            },
            0,
        );
        this.animationTimeline.to(
            this.glow2.scale,
            {
                x: 3.0,
                y: 3.0,
                duration: 7,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
            },
            0,
        );
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;
        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;

        this.screenHeight = height;
    }

    /** Set things up just before showing the popup */
    public prepare(data: BigWinPopupData) {
        if (data) {
            this.targetWinAmount = data.amount;
            this.category = data.category;
            this.onPressConfirm = data.callback;

            this.panelArc.texture = Texture.from(`modal-${data.category}-bigwin`);
            this.topText.text = `${this.category.toUpperCase()}!`;

            if (data.category == 'remarkable') {
                const color = '#368DFF';
                this.glow1.tint = color;
                this.glow2.tint = color;
                this.topText.style.stroke = {
                    width: 6,
                    color: color,
                };
            } else if (data.category == 'elegant') {
                const color = '#00BC38';
                this.glow1.tint = color;
                this.glow2.tint = color;
                this.topText.style.stroke = {
                    width: 6,
                    color: color,
                };
            } else {
                const color = '#FF0000';
                this.glow1.tint = color;
                this.glow2.tint = color;
                this.topText.style.stroke = {
                    width: 6,
                    color: color,
                };
            }
        }

        // Mark this popup as active when prepared
        this.isActive = true;
    }

    /** Start idle animation for top text */
    private startTopTextIdleAnimation() {
        if (this.topTextIdleTimeline) this.topTextIdleTimeline.kill();

        this.topTextIdleTimeline = gsap.timeline({
            repeat: -1,
        });

        // Gentle breathing scale
        this.topTextIdleTimeline.to(
            this.topText.scale,
            {
                x: 1.1,
                y: 1.1,
                duration: 1.5,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: 1,
            },
            0,
        );
    }

    /** Present the popup with improved entrance animation */
    public async show() {
        // Mark as active when showing
        this.isActive = true;

        resolveAndKillTweens(this.bg);
        resolveAndKillTweens(this.panelArc);
        resolveAndKillTweens(this.panelArc.scale);
        resolveAndKillTweens(this.glow1);
        resolveAndKillTweens(this.glow2);
        resolveAndKillTweens(this.textbox);
        resolveAndKillTweens(this.textbox.scale);
        resolveAndKillTweens(this.winAmount);
        resolveAndKillTweens(this.winAmount.scale);
        resolveAndKillTweens(this.topText);
        resolveAndKillTweens(this);
        this.coinContainer.removeChildren();

        this.startContinuousAnimations();

        this.panel.alpha = 1;

        const offScreenY = -(this.screenHeight / 2 + this.panelArc.height);

        this.panelArc.alpha = 0;
        this.panelArc.y = offScreenY;

        this.glow1.alpha = 0;
        this.glow2.alpha = 0;

        this.textbox.alpha = 0;
        this.textbox.scale.set(0.5);
        this.winAmount.alpha = 0;
        this.winAmount.scale.set(0.5);
        this.winAmount.text = formatCurrency(0, this.currency);
        this.currentWinAmount = 0;
        this.topText.alpha = 0;
        this.topText.y = offScreenY;

        const entranceTl = gsap.timeline();

        entranceTl.to(
            this.panelArc,
            {
                alpha: 1,
                y: 0,
                rotation: 0,
                duration: 0.7,
                ease: easeSingleBounce,
            },
            0.1,
        );

        entranceTl.to(
            this.panelArc.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'back.out(1.8)',
            },
            0.1,
        );

        entranceTl.to([this.glow1, this.glow2], { alpha: 1, duration: 0.3, ease: 'power2.out' }, 0.7);

        entranceTl.to(this.topText, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 1.05);
        entranceTl.to(
            this.topText,
            {
                y: -130,
                duration: 0.4,
                ease: easeSingleBounce,
                onComplete: () => this.startTopTextIdleAnimation(),
            },
            1.05,
        );

        entranceTl.to(this.textbox, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 1.2);
        entranceTl.to(
            this.textbox.scale,
            {
                x: 1,
                y: 1,
                duration: 0.4,
                ease: 'back.out(2)',
            },
            1.2,
        );

        entranceTl.to(this.winAmount, { alpha: 1, duration: 0.1, ease: 'power2.out' }, 1.3);
        entranceTl.to(
            this.winAmount.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            },
            1.3,
        );

        entranceTl.call(
            () => {
                this.isSkippable = true;
                this.animateWinAmount();
            },
            undefined,
            1.35,
        );

        await entranceTl;
    }

    /** Dismiss the popup, animated */
    public async hide() {
        // Mark as inactive immediately to prevent closePopup from firing
        this.isActive = false;
        this.isSkippable = false;
        this.canClickAnywhere = false;
        this.countTween = undefined;

        if (navigation.currentScreen) {
            navigation.currentScreen.filters = [];
        }

        const exitTl = gsap.timeline();
        exitTl.to(this.bg, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
        exitTl.to(this.panel, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
        exitTl.to(this.panel.scale, { x: 0.5, y: 0.5, duration: 0.3, ease: 'back.in(1.7)' }, 0);

        await exitTl;

        if (this.animationTimeline) this.animationTimeline.kill();
        if (this.topTextIdleTimeline) this.topTextIdleTimeline.kill();

        this.coinContainer.removeChildren();
    }

    /** Clean up animations */
    public destroy() {
        this.isActive = false;

        if (this.animationTimeline) this.animationTimeline.kill();

        if (this.topTextIdleTimeline) this.topTextIdleTimeline.kill();

        this.coinContainer.removeChildren();
        super.destroy();
    }
}
