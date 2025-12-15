import { AnimatedSprite, Container, Texture } from 'pixi.js';
import { sfx } from '../utils/audio';

export class Transition extends Container {
    private animatedSprite: AnimatedSprite | null = null;
    private currentWidth: number = 0;
    private currentHeight: number = 0;

    constructor() {
        super();
        this.visible = false;
    }

    public async show(): Promise<void> {
        return new Promise(async (resolve) => {
            try {
                this.visible = true;

                const isPortrait = this.currentHeight > this.currentWidth;

                // Get the animation frames based on orientation
                const frames: Texture[] = [];
                const prefix = isPortrait ? 'thunder-portrait-' : 'thunder-';

                for (let i = 0; i <= 15; i++) {
                    frames.push(Texture.from(`${prefix}${i}`));
                }

                // Create animated sprite
                this.animatedSprite = new AnimatedSprite(frames);
                this.animatedSprite.anchor.set(0.5);
                this.animatedSprite.loop = false;
                this.animatedSprite.animationSpeed = 0.3;

                // Position the sprite
                this.animatedSprite.x = this.currentWidth * 0.5;
                this.animatedSprite.y = this.currentHeight * 0.5;

                this.addChild(this.animatedSprite);

                // Listen for animation complete
                this.animatedSprite.onComplete = () => {
                    this.visible = false;

                    if (this.animatedSprite) {
                        this.removeChild(this.animatedSprite);
                        this.animatedSprite.destroy();
                        this.animatedSprite = null;
                    }

                    resolve();
                };

                // Start playing
                sfx.play('common/sfx-thunder.wav');
                this.animatedSprite.play();
            } catch (error) {
                console.error('Transition animation error:', error);
                this.visible = false;
                resolve();
            }
        });
    }

    public resize(width: number, height: number) {
        this.currentWidth = width;
        this.currentHeight = height;

        if (this.animatedSprite) {
            this.animatedSprite.x = width * 0.5;
            this.animatedSprite.y = height * 0.5;
        }
    }
}
