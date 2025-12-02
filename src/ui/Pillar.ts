import { Container, Sprite, Texture } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';

/**
 * The pillar during gameplay, as background for match3 pieces. This can be dynamically
 * rescaled to any number of rows and columns, to match the game grid size.
 */
export class Pillar extends Container {
    /** Inner container for shelf building blocks */
    private base: Container;
    /** The panel background sprite */
    private panelBg: Sprite;
    /** Base container for all panel content */
    private panelBase: Container;
    private spine: Spine;

    constructor() {
        super();

        this.base = new Container();
        this.addChild(this.base);

        // Create panel base container
        this.panelBase = new Container();
        this.addChild(this.panelBase);

        // Create panel background sprite
        this.panelBg = Sprite.from(Texture.WHITE);
        this.panelBg.tint = 0xffffff;
        this.panelBase.addChild(this.panelBg);

        // Create new spine animation
        this.spine = Spine.from({
            skeleton: `game/frame.json`,
            atlas: `game/frame.atlas`,
        });
        this.spine.state.setAnimation(0, 'animation', true);
        this.spine.state.timeScale = 0.3;
        this.spine.scale.set(1.1);
        this.addChild(this.spine);
    }

    /** Rebuild the pillar based on given rows, columns and tile size */
    public setup(options: { rows: number; columns: number; tileSize: number }) {
        this.reset();

        const rows = options.rows;
        const columns = options.columns;
        const tileSize = options.tileSize;

        // Calculate panel dimensions
        const panelWidth = columns * tileSize;
        const panelHeight = rows * tileSize;

        // Draw white panel behind the grid with extra width on sides
        const extraWidth = 50; // Adjust this value for more/less extra space

        // Update panel background sprite dimensions
        this.panelBg.width = panelWidth + extraWidth * 2;
        this.panelBg.height = panelHeight;
        this.panelBg.anchor.set(0.5, 0.5);

        // Position panel base
        this.panelBase.x = 0;
        this.panelBase.y = 0;

        // Center the spine animation
        this.spine.x = 0;
        this.spine.y = 0;
    }

    /** Remove all building blocks and clear the pillar */
    public reset() {
        this.base.removeChildren();
    }
}
