import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import { sfx } from '../utils/audio';

/** PixiJS logo UI component */
export class PlayButton extends Container {
    /** The logo image */
    private shield: Sprite;
    private play: Sprite;

    constructor() {
        super();

        // Make button interactive
        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.shield = Sprite.from('shield');
        this.shield.anchor.set(0.5);
        this.addChild(this.shield);

        this.play = Sprite.from('play');
        this.play.anchor.set(0.5);
        this.addChild(this.play);

        // Add hover effects
        this.on('pointerover', this.onHover.bind(this));
        this.on('pointerout', this.onOut.bind(this));
        this.on('pointerdown', this.onPress.bind(this));
        this.on('pointerup', this.onRelease.bind(this));
    }

    private onHover() {
        sfx.play('common/sfx-hover.wav');
        // Scale up and tint slightly
        gsap.to(this.shield.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.3,
            ease: 'power2.out',
        });
        gsap.to(this.play.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.3,
            ease: 'power2.out',
        });

        // Add slight glow effect with tint
        this.shield.tint = 0xdddddd;
        this.play.tint = 0xdddddd;

        // Rotate play icon slightly
        gsap.to(this.play, {
            rotation: -0.1,
            duration: 0.3,
            ease: 'power2.out',
        });
    }

    private onOut() {
        // Scale back to normal
        gsap.to(this.shield.scale, {
            x: 1,
            y: 1,
            duration: 0.3,
            ease: 'power2.out',
        });
        gsap.to(this.play.scale, {
            x: 1,
            y: 1,
            duration: 0.3,
            ease: 'power2.out',
        });

        // Remove tint
        this.shield.tint = 0xffffff;
        this.play.tint = 0xffffff;

        // Reset rotation
        gsap.to(this.play, {
            rotation: 0,
            duration: 0.3,
            ease: 'power2.out',
        });
    }

    private onPress() {
        sfx.play('common/sfx-press.wav');
        // Scale down for pressed effect
        gsap.to(this.shield.scale, {
            x: 0.95,
            y: 0.95,
            duration: 0.15,
            ease: 'power2.out',
        });
        gsap.to(this.play.scale, {
            x: 0.95,
            y: 0.95,
            duration: 0.15,
            ease: 'power2.out',
        });

        // Darken tint
        this.shield.tint = 0xaaaaaa;
        this.play.tint = 0xaaaaaa;

        // Rotate more
        gsap.to(this.play, {
            rotation: -0.2,
            duration: 0.15,
            ease: 'power2.out',
        });
    }

    private onRelease() {
        // Return to hover state (scale 1.1)
        gsap.to(this.shield.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.15,
            ease: 'back.out(1.7)',
        });
        gsap.to(this.play.scale, {
            x: 1.1,
            y: 1.1,
            duration: 0.15,
            ease: 'back.out(1.7)',
        });

        // Back to hover tint
        this.shield.tint = 0xdddddd;
        this.play.tint = 0xdddddd;

        // Back to hover rotation
        gsap.to(this.play, {
            rotation: -0.1,
            duration: 0.15,
            ease: 'power2.out',
        });
    }

    /** Set click callback */
    public onClick(callback: () => void) {
        this.on('pointerup', callback);
    }
}
