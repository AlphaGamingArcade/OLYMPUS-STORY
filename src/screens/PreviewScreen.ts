import { Container, FillGradient, Text } from 'pixi.js';
import gsap from 'gsap';
import { SlotPreview } from '../slot/preview/SlotPreview';
import { slotGetConfig } from '../slot/SlotConfig';
import { Pillar } from '../ui/Pillar';
import { PlayButton } from '../ui/PlayButton';
import { navigation } from '../utils/navigation';
import { GameScreen } from './GameScreen';
import { MessagePagination } from '../ui/MessagePagination';
import { i18n } from '../i18n/i18n';
import { OlympusStory } from '../ui/OlympusStory';

/** Screen shown while loading assets */
export class PreviewScreen extends Container {
    /** Assets bundles required by this screen */
    public static assetBundles = ['preload', 'preview', 'game'];
    /** Messages text */
    private messageList: string[];
    /** The loading message display */
    private message: Text;
    /** Message pagination component */
    private messagePagination: MessagePagination;
    /** Auto-rotate interval */
    private messageRotateInterval?: NodeJS.Timeout;

    /** Game Preview */
    private slotPreview: SlotPreview;
    /** Game Frame */
    private pillar: Pillar;
    /** Play button */
    private playButton: PlayButton;
    /** The game logo */
    public readonly olympusStory: OlympusStory;

    constructor() {
        super();

        this.pillar = new Pillar();
        this.pillar.scale.set(0.8);
        this.addChild(this.pillar);

        this.slotPreview = new SlotPreview();
        this.slotPreview.scale.set(0.8);
        this.addChild(this.slotPreview);

        const verticalGradient1 = new FillGradient({
            type: 'linear',
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 },
            colorStops: [
                { offset: 0, color: '#FDD44F' },
                { offset: 1, color: '#FF7700' },
            ],
            textureSpace: 'local',
        });

        this.messageList = [
            i18n.t('winUpToXBet', { bet: 250 }),
            i18n.t('jackpotChanceIncrease'),
            i18n.t('bigWinsComing'),
        ];

        this.message = new Text({
            text: this.messageList[0],
            style: {
                fill: verticalGradient1,
                fontFamily: 'Spartanmb Extra Bold',
                fontSize: 40,
                stroke: {
                    width: 6,
                    color: '#6D3000',
                },
                align: 'center',
            },
        });
        this.message.anchor.set(0.5);
        this.addChild(this.message);

        this.playButton = new PlayButton();
        this.addChild(this.playButton);
        this.playButton.onClick(() => navigation.showScreen(GameScreen));

        this.olympusStory = new OlympusStory();
        this.olympusStory.scale.set(0.75);
        this.addChild(this.olympusStory);

        // Create pagination component
        this.messagePagination = new MessagePagination(this.messageList.length, 80);
        this.messagePagination.setOnPageChange((index) => {
            this.showMessage(index);
            this.resetMessageRotation();
        });
        this.addChild(this.messagePagination);

        // Start auto-rotating messages
        this.startMessageRotation();
    }

    /** Show specific message by index */
    private showMessage(index: number) {
        // Fade out current message
        gsap.to(this.message, {
            alpha: 0,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
                // Change text
                this.message.text = this.messageList[index];

                // Fade in new message
                gsap.to(this.message, {
                    alpha: 1,
                    duration: 0.3,
                    ease: 'power2.in',
                });
            },
        });
    }

    /** Start auto-rotating messages every 3 seconds */
    private startMessageRotation() {
        this.messageRotateInterval = setInterval(() => {
            this.messagePagination.nextPage();
        }, 3000);
    }

    /** Reset the message rotation timer */
    private resetMessageRotation() {
        if (this.messageRotateInterval) {
            clearInterval(this.messageRotateInterval);
        }
        this.startMessageRotation();
    }

    /** Stop message rotation (call when screen is hidden) */
    private stopMessageRotation() {
        if (this.messageRotateInterval) {
            clearInterval(this.messageRotateInterval);
            this.messageRotateInterval = undefined;
        }
    }

    /** Resize the screen, fired whenever window size changes  */
    public resize(width: number, height: number) {
        if (width > height) {
            this.message.x = width * 0.35;
            this.message.y = height * 0.85;

            this.slotPreview.x = width * 0.35;
            this.slotPreview.y = height * 0.45;

            this.pillar.x = width * 0.35;
            this.pillar.y = height * 0.45;

            this.playButton.x = width * 0.8;
            this.playButton.y = height * 0.75;

            this.olympusStory.x = width * 0.8;
            this.olympusStory.y = height * 0.35;

            // Position pagination below message
            this.messagePagination.x = width * 0.35;
            this.messagePagination.y = height * 0.92;
        } else {
            this.message.x = width * 0.5;
            this.message.y = height * 0.7;

            this.slotPreview.x = width * 0.5;
            this.slotPreview.y = height * 0.45;

            this.pillar.x = width * 0.5;
            this.pillar.y = height * 0.45;

            this.playButton.x = width * 0.5;
            this.playButton.y = height * 0.85;

            this.olympusStory.x = width * 0.5;
            this.olympusStory.y = height * 0.12;

            // Position pagination below message
            this.messagePagination.x = width * 0.5;
            this.messagePagination.y = height * 0.75;
        }
    }

    /** Show screen with animations */
    public async show() {
        gsap.killTweensOf(this.message);
        this.message.alpha = 1;
        this.startMessageRotation();
    }

    /** Prepare the screen just before showing */
    public prepare() {
        const match3Config = slotGetConfig();
        this.slotPreview.setup(match3Config);
        this.pillar.setup(match3Config);
    }

    /** Hide screen with animations */
    public async hide() {
        // Stop message rotation
        this.stopMessageRotation();

        // Change then hide the loading message
        gsap.killTweensOf(this.message);
        gsap.to(this.message, {
            alpha: 0,
            duration: 0.3,
            ease: 'linear',
            delay: 0.5,
        });
    }
}
