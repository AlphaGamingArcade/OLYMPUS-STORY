import { Container, Sprite, Texture } from 'pixi.js';

interface Cloud {
    sprite: Sprite;
    speed: number;
    startX: number;
}

/**
 * Animated cloud background with randomly moving cloud sprites
 */
export class CloudBackground extends Container {
    /** Speed multiplier for cloud movement */
    public speed = 1;
    /** Background */
    public bg: Sprite;
    /** Image  */
    private image: Sprite;
    /** Container for moving clouds (behind main image) */
    private cloudsContainer: Container;
    /** Array of cloud objects */
    private clouds: Cloud[] = [];
    /** Screen dimensions */
    private screenWidth = 0;
    private screenHeight = 0;
    /** Available cloud textures */
    private cloudTextures = ['cloud-bg-1', 'cloud-bg-2', 'cloud-bg-3', 'cloud-bg-4', 'cloud-bg-5'];

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.tint = 0x87ceeb; // Sky blue color (must be hex number)
        this.addChild(this.bg);

        // Container for clouds - behind the main image
        this.cloudsContainer = new Container();
        this.addChild(this.cloudsContainer);

        this.image = Sprite.from('cloud-bg-landscape');
        this.addChild(this.image);

        // Create initial clouds
        this.createClouds(5);
    }

    /** Create random clouds */
    private createClouds(count: number) {
        for (let i = 0; i < count; i++) {
            const cloudSprite = Sprite.from(this.cloudTextures[Math.floor(Math.random() * this.cloudTextures.length)]);

            // Random position
            cloudSprite.x = Math.random() * this.screenWidth;
            cloudSprite.y = Math.random() * this.screenHeight * 0.7; // Keep in upper 70%

            // Random scale (0.3 to 0.8)
            const scale = 0.3 + Math.random() * 0.5;
            cloudSprite.scale.set(scale);

            // Random opacity (0.3 to 0.7)
            cloudSprite.alpha = 0.3 + Math.random() * 0.4;

            cloudSprite.anchor.set(0.5);

            const cloud: Cloud = {
                sprite: cloudSprite,
                speed: 0.2 + Math.random() * 0.5, // Random speed
                startX: cloudSprite.x,
            };

            this.clouds.push(cloud);
            this.cloudsContainer.addChild(cloudSprite);
        }
    }

    /** Update cloud positions (call this in your game loop) */
    public update(delta: number = 1) {
        for (const cloud of this.clouds) {
            // Move cloud to the right
            cloud.sprite.x += cloud.speed * this.speed * delta;

            // Wrap around when cloud goes off screen
            if (cloud.sprite.x > this.screenWidth + cloud.sprite.width) {
                cloud.sprite.x = -cloud.sprite.width;
                // Randomize Y position when wrapping
                cloud.sprite.y = Math.random() * this.screenHeight * 0.7;
            }
        }
    }

    /** Resize the background, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;

        this.bg.height = height;
        this.bg.width = width;

        this.image.height = height;
        this.image.width = width;

        if (width > height) {
            this.image.texture = Texture.from('cloud-bg-landscape');
        } else {
            this.image.texture = Texture.from('cloud-bg-portrait');
        }

        // Reposition existing clouds if screen size changes
        for (const cloud of this.clouds) {
            if (cloud.sprite.y > height * 0.7) {
                cloud.sprite.y = Math.random() * height * 0.7;
            }
        }
    }

    /** Clear all clouds */
    public clearClouds() {
        for (const cloud of this.clouds) {
            cloud.sprite.destroy();
        }
        this.clouds = [];
    }
}
