import { Container, Sprite, Texture, Ticker } from 'pixi.js';

interface Cloud {
    sprite: Sprite;
    speed: number;
    startX: number;
    direction: number; // 1 for right, -1 for left
}

/**
 * Animated cloud background with randomly moving cloud sprites
 */
export class CloudBackground extends Container {
    /** Speed multiplier for cloud movement */
    public speed = 0.5;
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
        this.createClouds(8); // Increased count for better coverage
    }

    /** Create random clouds */
    private createClouds(count: number) {
        for (let i = 0; i < count; i++) {
            const cloudSprite = Sprite.from(this.cloudTextures[Math.floor(Math.random() * this.cloudTextures.length)]);

            // Random position across entire width (some off-screen to start)
            cloudSprite.x = Math.random() * (this.screenWidth + 400) - 200;

            // Random Y position - vary depths for parallax effect
            // Lower clouds (larger Y) will be slightly larger and more opaque
            const yPosition = Math.random();
            cloudSprite.y = yPosition * this.screenHeight * 0.65; // Keep in upper 65%

            // Scale based on Y position (closer = larger)
            const baseScale = 0.3 + yPosition * 0.6; // 0.3 to 0.9
            cloudSprite.scale.set(baseScale);

            // Opacity based on Y position (closer = more opaque)
            cloudSprite.alpha = 0.2 + yPosition * 0.5; // 0.2 to 0.7

            cloudSprite.anchor.set(0.5);

            // Random direction (some move left, some right)
            const direction = -1;

            const cloud: Cloud = {
                sprite: cloudSprite,
                speed: (0.1 + Math.random() * 0.1) * (1 - yPosition * 0.2),
                startX: cloudSprite.x,
                direction: direction,
            };

            this.clouds.push(cloud);
            this.cloudsContainer.addChild(cloudSprite);
        }
    }

    /** Update cloud positions - call this in your game loop */
    public update(ticker: Ticker) {
        const delta = ticker.deltaMS;

        for (const cloud of this.clouds) {
            // Move cloud horizontally
            cloud.sprite.x += cloud.speed * cloud.direction * this.speed * delta;

            // Calculate cloud width based on its scale
            const cloudWidth = cloud.sprite.width;

            // Wrap around when cloud is COMPLETELY off screen
            if (cloud.direction > 0) {
                // Moving right - wrap when left edge exceeds right screen edge
                if (cloud.sprite.x - cloudWidth / 2 > this.screenWidth) {
                    cloud.sprite.x = -cloudWidth / 2;
                    // Randomize Y position when wrapping
                    cloud.sprite.y = Math.random() * this.screenHeight * 0.65;
                }
            } else {
                // Moving left - wrap when right edge is past left screen edge
                if (cloud.sprite.x + cloudWidth / 2 < 0) {
                    cloud.sprite.x = this.screenWidth + cloudWidth / 2;
                    // Randomize Y position when wrapping
                    cloud.sprite.y = Math.random() * this.screenHeight * 0.65;
                }
            }

            // Optional: Add subtle vertical drift
            cloud.sprite.y += Math.sin(Date.now() * 0.0001 + cloud.startX) * 0.02 * delta;

            // Keep clouds within bounds
            if (cloud.sprite.y < 0) cloud.sprite.y = 0;
            if (cloud.sprite.y > this.screenHeight * 0.7) {
                cloud.sprite.y = this.screenHeight * 0.7;
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

    /** Clean up */
    public destroy(options?: any) {
        this.clearClouds();
        super.destroy(options);
    }
}
