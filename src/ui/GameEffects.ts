import { Container, MeshRope, Point, Texture } from 'pixi.js';
import { randomRange } from '../utils/random';
import gsap from 'gsap';
import { GameScreen } from '../screens/GameScreen';
import { getDistance } from '../utils/maths';
import { pool } from '../utils/pool';
import { sfx } from '../utils/audio';
import { SlotSymbol } from '../slot/SlotSymbol';
import { SlotOnJackpotMatchData, SlotOnNextFreeSpinData } from '../slot/Slot';
import { Jackpot } from '../slot/SlotConfig';
import { cubicInterpolation } from '../utils/animation';

/**
 * All gameplay special effects, isolated on its own class in a way that can be changed freely, without affecting gameplay.
 * List of special effects in this class:
 * - Piece Move - Play a short sfx accordingly if the movement is allowed or not
 * - Piece Explosion - When a piece is popped out, play a little explosion animation in place
 * - Piece Pop - When a non-special piece is popped out, it flies to the cauldron
 * - Match Done - When a match happens, play sfx and "shake" the game according to the combo level
 * - Gird Explosion - Explode all pieces out of the grid, played when gameplay finishes
 */
export class GameEffects extends Container {
    /** The game screen instance */
    private game: GameScreen;
    private trailUpdateFunctions: Set<() => void> = new Set();

    constructor(game: GameScreen) {
        super();
        this.game = game;
        this.sortableChildren = true;
        this.onRender = () => this.renderUpdate();
    }

    /** Auto-update every frame */
    public renderUpdate() {
        // Update children z indexes to auto organise their order according
        // to their scales, to create a sort of a "3d depth" simulation
        for (const child of this.children) {
            child.zIndex = child.scale.x;
        }

        // Update all active trail functions
        for (const updateFn of this.trailUpdateFunctions) {
            updateFn();
        }
    }

    /** Fired when a match is detected */
    public async onJackpotMatch(data: SlotOnJackpotMatchData) {
        sfx.play('common/sfx-match.wav');
        let pieces = []; // Store pieces to clean up later
        const animPromise: Promise<void>[] = [];

        // Process each group sequentially
        for (let i = 0; i < data.symbols.length; i++) {
            const position = this.toLocal(data.symbols[i].getGlobalPosition());
            const piece = pool.get(SlotSymbol);
            piece.setup({
                name: data.symbols[i].name,
                type: data.symbols[i].type,
                size: this.game.slot.board.tileSize,
                interactive: false,
            });
            piece.position.copyFrom(position);
            this.addChild(piece);

            pieces.push(piece); // Store for cleanup

            let x = 0;
            let y = 0;

            // IDENTIFY PIECE WHERE THEY FLY TO
            if (piece.type == 11 && this.game.grandJackpotTier) {
                x = this.game.grandJackpotTier.x + randomRange(-20, 20);
                y = this.game.grandJackpotTier.y;
            } else if (piece.type == 12 && this.game.angelicJackpotTier) {
                x = this.game.angelicJackpotTier.x + randomRange(-20, 20);
                y = this.game.angelicJackpotTier.y;
            } else if (piece.type == 13 && this.game.blessedJackpotTier) {
                x = this.game.blessedJackpotTier.x + randomRange(-20, 20);
                y = this.game.blessedJackpotTier.y;
            } else if (piece.type == 14 && this.game.divineJackpotTier) {
                x = this.game.divineJackpotTier.x + randomRange(-20, 20);
                y = this.game.divineJackpotTier.y;
            }

            animPromise.push(this.playFlyToJackpotTier(piece, { x, y }));
        }

        await Promise.all(animPromise);

        // Now clean up after animations are done
        for (const piece of pieces) {
            this.removeChild(piece);
            pool.giveBack(piece);
        }
    }

    /** Make the piece fly to cauldron with a copy of the original piece created in its place */
    public async playFlyToJackpotTierOld(piece: SlotSymbol, to: { x: number; y: number }) {
        const distance = getDistance(piece.x, piece.y, to.x, to.y);
        const duration = distance * 0.0008 + randomRange(0.3, 0.6);

        gsap.killTweensOf(piece);
        gsap.killTweensOf(piece.scale);
        gsap.killTweensOf(piece, 'rotation');

        const tl = gsap.timeline();

        tl.to(
            piece,
            {
                x: to.x,
                y: to.y,
                duration: duration,
                ease: 'power1.inOut',
            },
            0,
        );

        tl.to(
            piece.scale,
            {
                x: 0.5,
                y: 0.5,
                duration: duration,
                ease: 'power1.in',
            },
            0,
        );

        tl.to(
            piece,
            {
                alpha: 0,
                duration: duration * 0.5,
                ease: 'power1.in',
            },
            duration * 0.5,
        );

        await tl;

        if (piece.type == 11) {
            this.game.grandJackpotTier.addActiveDot();
        } else if (piece.type == 12) {
            this.game.angelicJackpotTier.addActiveDot();
        } else if (piece.type == 13) {
            this.game.blessedJackpotTier.addActiveDot();
        } else if (piece.type == 14) {
            this.game.divineJackpotTier.addActiveDot();
        }

        sfx.play('common/sfx-bubble.wav');
    }

    public async playFlyToJackpotTier(piece: SlotSymbol, to: { x: number; y: number }) {
        const distance = getDistance(piece.x, piece.y, to.x, to.y);
        const duration = distance * 0.0008 + randomRange(0.3, 0.6);

        const historyX: number[] = [];
        const historyY: number[] = [];
        const historySize = 20;
        const ropeSize = 100;
        const points: Point[] = [];

        // Store starting position
        const startX = piece.x;
        const startY = piece.y + 20;

        // Initialize history with starting position
        for (let i = 0; i < historySize; i++) {
            historyX.push(startX);
            historyY.push(startY);
        }

        // Define the sequence of animated textures and animation variables
        const textureNames = ['particle-2', 'particle-3', 'particle-4', 'particle-5'];
        const textures = textureNames.map((name) => Texture.from(name));
        const textureSequenceLength = textures.length;
        let currentFrameIndex = 0;
        let frameCounter = 0;
        const framesPerTextureSwap = 2; // Swap texture every 2 frames (at 60fps, this is 30fps animation)

        // Create rope points
        for (let i = 0; i < ropeSize; i++) {
            points.push(new Point(startX, startY));
        }

        // Create the rope trail with the first texture
        const rope = new MeshRope({ texture: textures[0], points });
        rope.blendMode = 'add';

        // Add rope to stage
        this.addChild(rope);

        // Track current animated position
        const animatedPos = { x: startX, y: startY };

        // Update trail function with animation logic
        const updateTrail = () => {
            // Update history
            historyX.pop();
            historyX.unshift(animatedPos.x);
            historyY.pop();
            historyY.unshift(animatedPos.y);

            // Update rope points with smooth interpolation
            for (let i = 0; i < ropeSize; i++) {
                const p = points[i];
                const ix = cubicInterpolation(historyX, (i / ropeSize) * historySize);
                const iy = cubicInterpolation(historyY, (i / ropeSize) * historySize);
                p.x = ix;
                p.y = iy;
            }

            // Update animation frame based on frame counter
            frameCounter++;
            if (frameCounter >= framesPerTextureSwap) {
                frameCounter = 0;
                currentFrameIndex = (currentFrameIndex + 1) % textureSequenceLength;
                rope.texture = textures[currentFrameIndex];
            }
        };

        // Add trail update function to the set
        this.trailUpdateFunctions.add(updateTrail);

        // Start both animations
        await gsap.to(animatedPos, {
            x: to.x,
            y: to.y + 40,
            duration: duration,
            ease: 'power1.inOut',
            onComplete: () => {
                // Update jackpot tier
                if (piece.type == 11) {
                    this.game.grandJackpotTier.addActiveDot();
                } else if (piece.type == 12) {
                    this.game.angelicJackpotTier.addActiveDot();
                } else if (piece.type == 13) {
                    this.game.blessedJackpotTier.addActiveDot();
                } else if (piece.type == 14) {
                    this.game.divineJackpotTier.addActiveDot();
                }

                sfx.play('common/sfx-bubble.wav');
            },
        });

        // Remove trail update function
        this.trailUpdateFunctions.delete(updateTrail);

        await gsap.to(rope, {
            alpha: 0,
            duration: 0.3,
        });

        // Clean up rope
        rope.destroy();
    }

    public async playHideJackpotTimes(jackpot: Jackpot) {
        if (jackpot.type == 11) {
            this.game.grandJackpotTier.hideTimesText();
        } else if (jackpot.type == 12) {
            this.game.angelicJackpotTier.hideTimesText();
        } else if (jackpot.type == 13) {
            this.game.blessedJackpotTier.hideTimesText();
        } else if (jackpot.type == 14) {
            this.game.divineJackpotTier.hideTimesText();
        }
    }

    public async playSetActiveJackpots(data: SlotOnNextFreeSpinData) {
        for (const jackpot of Object.values(data.jackpots)) {
            const { type, active } = jackpot;
            if (type == 11) {
                this.game.grandJackpotTier.setActiveDots(active);
            } else if (type == 12) {
                this.game.angelicJackpotTier.setActiveDots(active);
            } else if (type == 13) {
                this.game.blessedJackpotTier.setActiveDots(active);
            } else if (type == 14) {
                this.game.divineJackpotTier.setActiveDots(active);
            }
        }
    }
}
