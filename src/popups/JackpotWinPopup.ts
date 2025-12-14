import { Container, FillGradient, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { navigation } from '../utils/navigation';
import { ShadowLabel } from '../ui/ShadowLabel';
import { registerCustomEase, resolveAndKillTweens } from '../utils/animation';
import { waitFor } from '../utils/asyncUtils';
import { formatCurrency } from '../utils/formatter';
import { throttle } from '../utils/throttle';
import { sfx } from '../utils/audio';

/** Custom ease curve for y animation of falling pieces - minimal bounce */
const easeSingleBounce = registerCustomEase(
    'M0,0,C0.14,0,0.27,0.191,0.352,0.33,0.43,0.462,0.53,0.963,0.538,1,0.546,0.997,0.672,0.97,0.778,0.97,0.888,0.97,0.993,0.997,1,1',
);

export type JackpotWinPopupData = {
    name: string;
    times: number;
    amount: number;
    callback: () => void;
};

/** Popup displaying win amount with coin effects */
export class JackpotWinPopup extends Container {
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
    /** You have won text */
    private jackpotWon: ShadowLabel;
    /** Win amount text */
    private winAmount: ShadowLabel;
    /** Bottom text (IN X FREE SPINS) */
    private topText: ShadowLabel;
    /** click anywhere state */
    private canClickAnywhere = false;
    /** on click continue */
    private onPressConfirm?: () => void;
    /** Single combined glow and bounce animation timeline */
    private animationTimeline?: gsap.core.Timeline;
    /** Target win amount for counting animation */
    private targetWinAmount = 0;
    /** Current win amount for counting animation */
    private currentWinAmount = 0;
    /** Current win amount for counting animation */
    private times = 0;
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
    private intensity = 0;

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
                { offset: 0, color: '#FDD44F' },
                { offset: 1, color: '#FF7700' },
            ],
            textureSpace: 'local',
        });

        // YOU HAVE WON
        this.jackpotWon = new ShadowLabel({
            text: 'JACKPOT WON',
            style: {
                fill: verticalGradient3,
                fontFamily: 'Spartanmb Extra Bold',
                align: 'center',
                fontSize: 52,
                stroke: {
                    width: 4,
                    color: '#000000',
                },
            },
            shadowOffsetY: 0,
            shadowColor: '#000000',
            shadowAlpha: 1,
        });
        this.jackpotWon.y = -60;
        this.panel.addChild(this.jackpotWon);

        // TEXTBOX
        this.textbox = Sprite.from('modal-textbox');
        this.textbox.anchor.set(0.5);
        this.textbox.y = 50;
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

        // BOTTOM TEXT (IN X FREE SPINS)
        this.topText = new ShadowLabel({
            text: '',
            style: {
                fill: verticalGradient3,
                fontFamily: 'Spartanmb Extra Bold',
                align: 'center',
                fontSize: 40,
                stroke: {
                    width: 4,
                    color: '#000000',
                },
            },
            shadowOffsetY: 0,
            shadowColor: '#000000',
            shadowAlpha: 1,
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
                this.winAmount.text = formatCurrency(this.currentWinAmount, this.currency);
                if (this.currentWinAmount >= 1) {
                    const speed = Math.min(0.8 + this.intensity * 0.001, 1);
                    // Throttle sfx to a minimum interval, otherwise too many sounds instances
                    // will be played at the same time, making it very noisy
                    throttle('score', 100, () => {
                        sfx.play('common/sfx-coin.wav', { speed, volume: 0.2 });
                    });
                }
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
    public prepare(data: JackpotWinPopupData) {
        if (data) {
            this.times = data.times;
            this.targetWinAmount = data.amount;
            this.onPressConfirm = data.callback;

            this.panelArc.texture = Texture.from(`modal-${data.name.toLocaleLowerCase()}-jackpot`);
            this.topText.text = `${this.times > 1 ? `${this.times}X ` : ''} ${data.name.toUpperCase()}`;
        }

        // Mark this popup as active when prepared
        this.isActive = true;
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
        resolveAndKillTweens(this.jackpotWon);
        resolveAndKillTweens(this.jackpotWon.scale);
        resolveAndKillTweens(this.textbox);
        resolveAndKillTweens(this.textbox.scale);
        resolveAndKillTweens(this.winAmount);
        resolveAndKillTweens(this.winAmount.scale);
        resolveAndKillTweens(this.topText);
        resolveAndKillTweens(this);
        this.coinContainer.removeChildren();

        this.panel.alpha = 1;

        const offScreenY = -(this.screenHeight / 2 + this.panelArc.height);

        this.panelArc.alpha = 0;
        this.panelArc.scale.set(0.5);
        this.panelArc.y = offScreenY;

        this.glow1.alpha = 0;
        this.glow2.alpha = 0;

        this.jackpotWon.alpha = 0;
        this.jackpotWon.scale.set(0.8);

        this.textbox.alpha = 0;
        this.textbox.scale.set(0.5);
        this.winAmount.alpha = 0;
        this.winAmount.scale.set(0.5);
        this.winAmount.text = formatCurrency(0, this.currency);
        this.currentWinAmount = 0;
        this.topText.alpha = 0;
        this.topText.y = -130;

        this.startContinuousAnimations();

        const entranceTl = gsap.timeline();

        sfx.play('common/sfx-slide.wav');
        sfx.play('common/sfx-ring-short.wav');

        entranceTl.to(
            this.panelArc,
            {
                alpha: 1,
                y: 0,
                rotation: 0,
                duration: 0.7,
                ease: easeSingleBounce,
                onComplete: () => {
                    // sfx.play('common/sfx-impact.wav');
                },
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

        entranceTl.to(this.jackpotWon, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.jackpotWon.scale,
            {
                x: 1,
                y: 1,
                duration: 0.35,
                ease: 'elastic.out(1, 0.6)',
            },
            0.85,
        );

        entranceTl.to(this.textbox, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 1.05);
        entranceTl.to(
            this.textbox.scale,
            {
                x: 1,
                y: 1,
                duration: 0.4,
                ease: 'back.out(2)',
            },
            1.05,
        );

        entranceTl.to(this.winAmount, { alpha: 1, duration: 0.1, ease: 'power2.out' }, 1.2);
        entranceTl.to(
            this.winAmount.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            },
            1.2,
        );

        entranceTl.call(
            () => {
                this.isSkippable = true;
                this.animateWinAmount();
            },
            undefined,
            1.3,
        );

        entranceTl.to(this.topText, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 1.35);
        entranceTl.to(
            this.topText,
            {
                y: -130,
                duration: 0.4,
                ease: 'back.out(1.5)',
            },
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

        this.coinContainer.removeChildren();
    }

    /** Clean up animations */
    public destroy() {
        this.isActive = false;

        if (this.animationTimeline) {
            this.animationTimeline.kill();
        }
        this.coinContainer.removeChildren();
        super.destroy();
    }
}
