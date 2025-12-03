import { Container, FillGradient, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { navigation } from '../utils/navigation';
import { ShadowLabel } from '../ui/ShadowLabel';
import { registerCustomEase, resolveAndKillTweens } from '../utils/animation';
import { IconButton } from '../ui/IconButton';
import { formatCurrency } from '../utils/formatter';

/** Custom ease curve for y animation of falling pieces - minimal bounce */
const easeSingleBounce = registerCustomEase(
    'M0,0,C0.14,0,0.27,0.191,0.352,0.33,0.43,0.462,0.53,0.963,0.538,1,0.546,0.997,0.672,0.97,0.778,0.97,0.888,0.97,0.993,0.997,1,1',
);

export type BuyFreeSpinPopupData = {
    currency: string;
    amount: number;
    callback: () => void;
};

/** Popup displaying win amount with coin effects */
export class BuyFreeSpinPopup extends Container {
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
    /** Top text (IN X FREE SPINS) */
    private topText: ShadowLabel;
    /** The modal text box */
    private textbox: Sprite;
    /** You have won text */
    private moreJackpotLabel: ShadowLabel;
    /** amount */
    private amount: number;
    /** Currency */
    private currency: string;
    /** Win amount text */
    private amountLabel: ShadowLabel;
    /** Confirm button */
    private confirmButton: IconButton;
    /** Close button */
    private closeButton: IconButton;
    /** click anywhere text */
    private clickAnywhere: ShadowLabel;
    /** click anywhere state */
    private canClickAnywhere = false;
    /** on click continue */
    private onPressConfirm?: () => void;
    /** Single combined glow and bounce animation timeline */
    private animationTimeline?: gsap.core.Timeline;
    /** Screen height for calculating off-screen positions */
    private screenHeight = 0;

    constructor() {
        super();

        this.amount = 0;
        this.currency = 'usd';

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
        this.panelArc = Sprite.from('modal-buy-free-spin-frame');
        this.panelArc.anchor.set(0.5);
        this.panel.addChild(this.panelArc);

        // TEXT GRADIENTS
        const verticalGradient1 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#F2EDE8' },
                { offset: 1, color: '#D5CCC6' },
            ],
            textureSpace: 'local',
        });

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
        this.moreJackpotLabel = new ShadowLabel({
            text: 'MORE JACKPOTS',
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
        this.moreJackpotLabel.y = -75;
        this.panel.addChild(this.moreJackpotLabel);

        // TEXTBOX
        this.textbox = Sprite.from('modal-textbox');
        this.textbox.anchor.set(0.5);
        this.textbox.y = 20;
        this.panel.addChild(this.textbox);

        // AMOUNT
        this.amountLabel = new ShadowLabel({
            text: formatCurrency(this.amount, this.currency),
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
        this.amountLabel.y = this.textbox.y - 4;
        this.panel.addChild(this.amountLabel);

        // BOTTOM TEXT (IN X FREE SPINS)
        this.topText = new ShadowLabel({
            text: 'BUY FREE SPINS',
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
        this.topText.y = -190;
        this.panel.addChild(this.topText);

        const buttonY = 110;

        this.confirmButton = new IconButton({
            icon: 'modal-buy-free-spin-check',
            width: 80,
            height: 80,
            backgroundColor: 0x4a90e2, // Blue
            hoverColor: 0x5aa3f5, // Lighter blue
            pressColor: 0x3a7bc8, // Darker blue
        });
        this.confirmButton.y = buttonY;
        this.confirmButton.x = -100;
        this.panel.addChild(this.confirmButton);
        this.confirmButton.onPress.connect(() => {
            navigation.dismissPopup();
        });

        this.closeButton = new IconButton({
            icon: 'modal-buy-free-spin-x',
            width: 80,
            height: 80,
            backgroundColor: 0x4a90e2, // Blue
            hoverColor: 0x5aa3f5, // Lighter blue
            pressColor: 0x3a7bc8, // Darker blue
        });
        this.closeButton.y = buttonY;
        this.closeButton.x = 100;
        this.panel.addChild(this.closeButton);
        this.closeButton.onPress.connect(() => {
            navigation.dismissPopup();
        });

        // CLICK ANYWHERE
        this.clickAnywhere = new ShadowLabel({
            text: 'Click anywhere to continue.',
            style: {
                fill: verticalGradient1,
                fontFamily: 'Spartanmb Extra Bold',
                align: 'center',
                fontSize: 24,
                stroke: {
                    width: 2,
                    color: '#000000',
                },
            },
            shadowOffsetY: 4,
            shadowColor: '#000000',
            shadowAlpha: 1,
        });
        this.addChild(this.clickAnywhere);

        // Add pointer event listeners
        this.bg.eventMode = 'static';
        this.eventMode = 'static';
        this.interactiveChildren = true;

        this.on('pointertap', () => {
            // Otherwise handle normal click
            if (!this.canClickAnywhere) return;
            this.onPressConfirm?.();
        });
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

        this.clickAnywhere.x = width * 0.5;
        this.clickAnywhere.y = height - 64;

        this.screenHeight = height;
    }

    /** Set things up just before showing the popup */
    public prepare(data: BuyFreeSpinPopupData) {
        if (data) {
            this.amount = data.amount;
            this.currency = data.currency;

            this.amountLabel.text = formatCurrency(this.amount, this.currency);
            this.onPressConfirm = data.callback;
            this.topText.text = `BUY FREE SPINS`;
        }
    }

    /** Present the popup with improved entrance animation */
    public async show() {
        resolveAndKillTweens(this.bg);
        resolveAndKillTweens(this.panelArc);
        resolveAndKillTweens(this.panelArc.scale);
        resolveAndKillTweens(this.glow1);
        resolveAndKillTweens(this.glow2);
        resolveAndKillTweens(this.moreJackpotLabel);
        resolveAndKillTweens(this.moreJackpotLabel.scale);
        resolveAndKillTweens(this.textbox);
        resolveAndKillTweens(this.textbox.scale);
        resolveAndKillTweens(this.topText);
        resolveAndKillTweens(this.clickAnywhere);
        resolveAndKillTweens(this.closeButton);
        resolveAndKillTweens(this.confirmButton);
        resolveAndKillTweens(this);
        this.coinContainer.removeChildren();

        this.panel.alpha = 1;
        this.clickAnywhere.alpha = 0;

        const offScreenY = -(this.screenHeight / 2 + this.panelArc.height);

        this.panelArc.alpha = 0;
        this.panelArc.y = offScreenY;

        this.glow1.alpha = 0;
        this.glow2.alpha = 0;

        this.moreJackpotLabel.alpha = 0;
        this.moreJackpotLabel.scale.set(0.8);

        this.textbox.alpha = 0;
        this.textbox.scale.set(0.5);

        this.amountLabel.alpha = 0;
        this.amountLabel.scale.set(0.8);

        this.topText.alpha = 0;
        this.topText.y = -130;

        this.confirmButton.alpha = 0;
        this.confirmButton.scale.set(0.8);

        this.closeButton.alpha = 0;
        this.closeButton.scale.set(0.8);

        const entranceTl = gsap.timeline();

        this.startContinuousAnimations();

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

        entranceTl.to(this.topText, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.topText,
            {
                y: -130,
                duration: 0.4,
                ease: 'back.out(1.5)',
            },
            0.85,
        );

        entranceTl.to(this.moreJackpotLabel, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.moreJackpotLabel.scale,
            {
                x: 1,
                y: 1,
                duration: 0.35,
                ease: 'elastic.out(1, 0.6)',
            },
            0.85,
        );

        entranceTl.to(this.textbox, { alpha: 1, duration: 0.15, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.textbox.scale,
            {
                x: 1,
                y: 1,
                duration: 0.4,
                ease: 'back.out(2)',
            },
            0.85,
        );

        entranceTl.to(this.amountLabel, { alpha: 1, duration: 0.1, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.amountLabel.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            },
            0.85,
        );
        entranceTl.to(this.confirmButton, { alpha: 1, duration: 0.1, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.confirmButton.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            },
            0.85,
        );
        entranceTl.to(this.closeButton, { alpha: 1, duration: 0.1, ease: 'power2.out' }, 0.85);
        entranceTl.to(
            this.closeButton.scale,
            {
                x: 1,
                y: 1,
                duration: 0.5,
                ease: 'elastic.out(1, 0.5)',
            },
            0.85,
        );

        await entranceTl;
    }

    /** Dismiss the popup, animated */
    public async hide() {
        this.canClickAnywhere = false;

        if (navigation.currentScreen) {
            navigation.currentScreen.filters = [];
        }

        const exitTl = gsap.timeline();
        exitTl.to(this.bg, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
        exitTl.to(this.panel, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0);
        exitTl.to(this.panel.scale, { x: 0.5, y: 0.5, duration: 0.3, ease: 'back.in(1.7)' }, 0);
        exitTl.to(this.clickAnywhere, { alpha: 0, duration: 0.2, ease: 'power2.in' }, 0);

        await exitTl;

        this.coinContainer.removeChildren();
    }

    /** Clean up animations */
    public destroy() {
        if (this.animationTimeline) {
            this.animationTimeline.kill();
        }
        this.coinContainer.removeChildren();
        super.destroy();
    }
}
