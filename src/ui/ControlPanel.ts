import { Container, Text, Sprite, Texture } from 'pixi.js';
import { SoundButton } from './SoundButton';
import { IconButton } from './IconButton2';
import { userSettings } from '../utils/userSettings';
/**
 * Control panel for the game, displaying credit, bet info, and action buttons
 */

export class ControlPanel extends Container {
    private background: Sprite;
    private contentContainer: Container;
    private creditLabel: Text;
    private creditValue: Text;
    private betLabel: Text;
    private betValue: Text;
    private messageText: Text;

    private soundButton: SoundButton;
    private infoButton: IconButton;
    private settingsButton: IconButton;
    private minusButton: IconButton;
    private spinButton: IconButton;
    private plusButton: IconButton;
    private autoplayButton: IconButton;

    private spacebarHandler?: (e: KeyboardEvent) => void;

    // Button states
    private isSpinButtonEnabled: boolean = true;

    constructor() {
        super();

        // Create semi-transparent background using Sprite
        this.background = Sprite.from(Texture.WHITE);
        this.background.tint = 0x000000;
        this.background.alpha = 0.7;
        this.addChild(this.background);

        // Create content container with max width
        this.contentContainer = new Container();
        this.addChild(this.contentContainer);

        // Credit display (bottom left)
        this.creditLabel = new Text({
            text: 'CREDIT',
            style: {
                fontSize: 18,
                fill: 0xffffff,
                fontWeight: 'bold',
            },
        });
        this.contentContainer.addChild(this.creditLabel);

        const currency = userSettings.getCurrency();

        this.creditValue = new Text({
            text: `${currency}100,000.00`,
            style: {
                fontSize: 20,
                fill: 0xffd700,
                fontWeight: 'bold',
            },
        });
        this.contentContainer.addChild(this.creditValue);

        // Bet display (bottom left, next to credit)
        this.betLabel = new Text({
            text: 'BET',
            style: {
                fontSize: 18,
                fill: 0xffffff,
                fontWeight: 'bold',
            },
        });
        this.contentContainer.addChild(this.betLabel);

        this.betValue = new Text({
            text: `${currency}.00`,
            style: {
                fontSize: 20,
                fill: 0xffd700,
                fontWeight: 'bold',
            },
        });
        this.contentContainer.addChild(this.betValue);

        // Center message
        this.messageText = new Text({
            text: 'HOLD SPACE FOR TURBO SPIN',
            style: {
                fontSize: 28,
                fill: 0xffd700,
                fontWeight: 'bold',
            },
        });
        this.messageText.anchor.set(0.5);
        this.contentContainer.addChild(this.messageText);

        // Create buttons
        this.soundButton = new SoundButton();
        this.settingsButton = new IconButton({
            imageDefault: 'icon-button-settings-default-view',
            imageHover: 'icon-button-settings-hover-view',
            imagePressed: 'icon-button-settings-active-view',
            imageDisabled: 'icon-button-settings-active-view',
        });
        this.infoButton = new IconButton({
            imageDefault: 'icon-button-info-default-view',
            imageHover: 'icon-button-info-hover-view',
            imagePressed: 'icon-button-info-active-view',
            imageDisabled: 'icon-button-info-active-view',
        });
        this.minusButton = new IconButton({
            imageDefault: 'icon-button-minus-default-view',
            imageHover: 'icon-button-minus-hover-view',
            imagePressed: 'icon-button-minus-active-view',
            imageDisabled: 'icon-button-minus-active-view',
        });

        this.spinButton = new IconButton({
            imageDefault: 'icon-button-spin-default-view',
            imageHover: 'icon-button-spin-hover-view',
            imagePressed: 'icon-button-spin-active-view',
            imageDisabled: 'icon-button-spin-active-view',
        });

        this.plusButton = new IconButton({
            imageDefault: 'icon-button-add-default-view',
            imageHover: 'icon-button-add-hover-view',
            imagePressed: 'icon-button-add-active-view',
            imageDisabled: 'icon-button-add-active-view',
        });
        this.autoplayButton = new IconButton({
            imageDefault: 'icon-button-autoplay-default-view',
            imageHover: 'icon-button-autoplay-hover-view',
            imagePressed: 'icon-button-autoplay-active-view',
            imageDisabled: 'icon-button-autoplay-active-view',
        });

        this.contentContainer.addChild(this.soundButton);
        this.contentContainer.addChild(this.infoButton);
        this.contentContainer.addChild(this.settingsButton);
        this.contentContainer.addChild(this.minusButton);
        this.contentContainer.addChild(this.spinButton);
        this.contentContainer.addChild(this.plusButton);
        this.contentContainer.addChild(this.autoplayButton);
    }

    /**
     * Layout the control panel based on screen width
     */
    public resize(width: number, height: number, isMobile?: boolean) {
        const isPortrait = height > width;

        // === MOBILE PORTRAIT ===
        if (isMobile && isPortrait) {
            const panelHeight = 400;

            // Background
            this.background.width = width;
            this.background.height = panelHeight;
            this.y = height - panelHeight;

            // Content container
            const contentWidth = width;
            this.contentContainer.x = 0;

            // Adjust button sizes for mobile
            const buttonScale = 2;
            const spinButtonScale = 2;

            this.soundButton.scale.set(buttonScale);
            this.infoButton.scale.set(buttonScale);
            this.settingsButton.scale.set(buttonScale);
            this.minusButton.scale.set(buttonScale);
            this.plusButton.scale.set(buttonScale);
            this.spinButton.scale.set(spinButtonScale);
            this.autoplayButton.scale.set(buttonScale);

            // Left side buttons (vertical stack on far left)
            const leftBtnStartX = 120;
            const leftBtnY = 80;

            this.infoButton.x = leftBtnStartX;
            this.infoButton.y = leftBtnY;

            this.soundButton.x = leftBtnStartX;
            this.soundButton.y = leftBtnY + 130;

            // Center - Large spin button
            this.spinButton.x = contentWidth / 2;
            this.spinButton.y = panelHeight * 0.5;

            const betBtnX = 220;

            this.minusButton.x = width / 2 - betBtnX;
            this.minusButton.y = panelHeight * 0.5;

            this.plusButton.x = width / 2 + betBtnX;
            this.plusButton.y = panelHeight * 0.5;

            // Right side buttons (vertical stack on far right)
            const rightBtnEndX = width - 130;
            const rightBtnY = 80;

            this.autoplayButton.x = rightBtnEndX;
            this.autoplayButton.y = rightBtnY;

            this.settingsButton.x = rightBtnEndX;
            this.settingsButton.y = rightBtnY + 130;

            // Bottom left - Credit info (vertical stack)
            const creditStartX = 90;
            const creditEndX = width - 90;
            const bottomY = 340;

            this.creditLabel.x = creditStartX;
            this.creditLabel.y = bottomY - 40;
            this.creditLabel.style.fontSize = 32;
            this.creditLabel.anchor.set(0, 0);

            this.creditValue.x = creditStartX;
            this.creditValue.y = bottomY;
            this.creditValue.style.fontSize = 42;
            this.creditValue.anchor.set(0, 0);

            // Bottom right - Bet info (vertical stack, aligned to right edge)
            this.betLabel.x = creditEndX;
            this.betLabel.y = bottomY - 40;
            this.betLabel.style.fontSize = 32;
            this.betLabel.anchor.set(1, 0);

            this.betValue.x = creditEndX;
            this.betValue.y = bottomY;
            this.betValue.style.fontSize = 42;
            this.betValue.anchor.set(1, 0);

            // Message (bottom center, small)
            this.messageText.x = contentWidth / 2;
            this.messageText.y = height / 2;
            this.messageText.style.fontSize = 42;
        }
        // === MOBILE LANDSCAPE ===
        else if (isMobile && !isPortrait) {
            const panelHeight = 210;

            // Background
            this.background.width = width;
            this.background.height = panelHeight;
            this.y = height - panelHeight;

            // Content container
            const contentWidth = width;
            this.contentContainer.x = 0;

            // Adjust button sizes for mobile
            const buttonScale = 1.5;
            const spinButtonScale = 1.5;

            this.soundButton.scale.set(buttonScale);
            this.infoButton.scale.set(buttonScale);
            this.settingsButton.scale.set(buttonScale);
            this.minusButton.scale.set(buttonScale);
            this.plusButton.scale.set(buttonScale);
            this.spinButton.scale.set(spinButtonScale);
            this.autoplayButton.scale.set(buttonScale);

            // Left side buttons (vertical stack, more compact)
            this.soundButton.x = 120;
            this.soundButton.y = 50;
            this.settingsButton.x = 120;
            this.settingsButton.y = 150;
            this.infoButton.x = 210;
            this.infoButton.y = 100;

            // Bottom left - Credit and Bet (horizontal, compact)
            const creditStartX = 180;
            const bottomY = 160;

            this.creditLabel.x = creditStartX;
            this.creditLabel.y = bottomY;
            this.creditLabel.style.fontSize = 32;
            this.creditLabel.anchor.set(0, 0);

            this.creditValue.x = creditStartX + 160;
            this.creditValue.y = bottomY;
            this.creditValue.style.fontSize = 32;
            this.creditValue.anchor.set(0, 0);

            this.betLabel.x = creditStartX + 380;
            this.betLabel.y = bottomY;
            this.betLabel.style.fontSize = 32;
            this.betLabel.anchor.set(0, 0);

            this.betValue.x = creditStartX + 480;
            this.betValue.y = bottomY;
            this.betValue.style.fontSize = 32;
            this.betValue.anchor.set(0, 0);

            // Center message (smaller font)
            this.messageText.x = contentWidth / 2;
            this.messageText.y = 70;
            this.messageText.style.fontSize = 22;

            // Right side buttons (horizontal, compact)
            const rightCenterX = contentWidth - 310;
            const buttonY = 60;

            this.minusButton.x = rightCenterX - 170;
            this.minusButton.y = buttonY;

            this.spinButton.x = rightCenterX;
            this.spinButton.y = buttonY;

            this.plusButton.x = rightCenterX + 170;
            this.plusButton.y = buttonY;

            // Autoplay button (bottom right, compact)
            this.autoplayButton.x = contentWidth - 180;
            this.autoplayButton.y = 160;

            // Message (bottom center, small)
            this.messageText.x = contentWidth / 2;
            this.messageText.y = 60;
            this.messageText.style.fontSize = 42;
        }
        // === DESKTOP ===
        else {
            const panelHeight = 160;

            // Background
            this.background.width = width;
            this.background.height = panelHeight;
            this.y = height - panelHeight;

            // Content container with max width
            const maxWidth = 1600;
            const contentWidth = Math.min(width, maxWidth);
            this.contentContainer.x = (width - contentWidth) / 2;

            // Desktop button sizes (normal)
            const buttonScale = 1;
            const spinButtonScale = 1;

            this.soundButton.scale.set(buttonScale);
            this.infoButton.scale.set(buttonScale);
            this.settingsButton.scale.set(buttonScale);
            this.minusButton.scale.set(buttonScale);
            this.plusButton.scale.set(buttonScale);
            this.spinButton.scale.set(spinButtonScale);
            this.autoplayButton.scale.set(buttonScale);

            // Left side buttons (stacked vertically)
            this.soundButton.x = 50;
            this.soundButton.y = 40;
            this.settingsButton.x = 50;
            this.settingsButton.y = 100;
            this.infoButton.x = 120;
            this.infoButton.y = 70;

            // Bottom left - Credit and Bet info (horizontal layout)
            const creditStartX = 130;
            const bottomY = 125;

            this.creditLabel.x = creditStartX;
            this.creditLabel.y = bottomY;
            this.creditValue.x = creditStartX + 70;
            this.creditValue.y = bottomY;

            this.betLabel.x = creditStartX + 250;
            this.betLabel.y = bottomY;
            this.betValue.x = creditStartX + 290;
            this.betValue.y = bottomY;

            // Center message (relative to content container)
            this.messageText.x = contentWidth / 2;
            this.messageText.y = 80;
            this.messageText.style.fontSize = 28;

            // Right side buttons (horizontal layout centered around spin button)
            const rightCenterX = contentWidth - 200;
            const buttonY = 40;

            const betBtnX = 125;

            this.minusButton.x = rightCenterX - betBtnX;
            this.minusButton.y = buttonY;

            this.spinButton.x = rightCenterX;
            this.spinButton.y = buttonY;

            this.plusButton.x = rightCenterX + betBtnX;
            this.plusButton.y = buttonY;

            // Autoplay button (bottom right)
            this.autoplayButton.x = contentWidth - 100;
            this.autoplayButton.y = 120;
        }
    }

    /**
     * Update credit display
     */
    public setCredit(value: number) {
        this.creditValue.text = `$${value.toFixed(2)}`;
    }

    /**
     * Update bet display
     */
    public setBet(value: number) {
        this.betValue.text = `$${value.toFixed(2)}`;
    }

    /**
     * Update center message
     */
    public setMessage(message: string) {
        this.messageText.text = message;
        this.messageText.style.fontSize = 28;
        this.messageText.anchor.set(0.5);
    }

    /**
     * Update center message
     */
    public setWinMessage(message: string) {
        this.messageText.text = message;
        this.messageText.style.fontSize = 52;
        this.messageText.anchor.set(0.5, 1);
    }

    /** Disabled betting */
    public disableBetting() {
        this.autoplayButton.enabled = false;
        this.plusButton.enabled = false;
        this.minusButton.enabled = false;
    }

    /** Disabled betting */
    public enableBetting() {
        this.autoplayButton.enabled = true;
        this.plusButton.enabled = true;
        this.minusButton.enabled = true;
    }

    /**
     * Set button event handlers
     */
    public onSpin(callback: () => void) {
        this.spinButton.on('pointerdown', () => {
            if (this.isSpinButtonEnabled) {
                callback();
            }
        });
    }

    public onAutoplay(callback: () => void) {
        this.autoplayButton.on('pointerdown', () => {
            if (this.isSpinButtonEnabled) {
                callback();
            }
        });
    }

    public onIncreaseBet(callback: () => void) {
        this.plusButton.on('pointerdown', callback);
    }

    public onDecreaseBet(callback: () => void) {
        this.minusButton.on('pointerdown', callback);
    }

    public onInfo(callback: () => void) {
        this.infoButton.on('pointerdown', callback);
    }

    public onSettings(callback: () => void) {
        this.settingsButton.on('pointerdown', callback);
    }

    /**
     * Listen for spacebar press
     */
    public onSpacebar(callback: () => void) {
        if (this.spacebarHandler) {
            window.removeEventListener('keydown', this.spacebarHandler);
        }

        // Create new handler
        this.spacebarHandler = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                callback();
            }
        };

        // Add event listener
        window.addEventListener('keydown', this.spacebarHandler);
    }
}
