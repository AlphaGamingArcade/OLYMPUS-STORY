import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { Label } from '../ui/Label';
import { IconButton } from '../ui/IconButton2';
import { navigation } from '../utils/navigation';
import { PayTableSection } from '../ui/PaytableSection';
import { GameRulesSection } from '../ui/GameRules';
import { HowToPlaySection } from '../ui/HowToPlaySection';
import { SettingsMenuSection } from '../ui/SettingsMenuSection';
import { pool } from '../utils/pool';

interface ModalSection extends Container {
    /** Show the screen */
    show?(): Promise<void>;
    /** Hide the screen */
    hide?(): Promise<void>;
    /** Pause the screen */
    pause?(): Promise<void>;
    /** Resume the screen */
    resume?(): Promise<void>;
    /** Prepare screen, before showing */
    prepare?(): void;
    /** Reset screen, after hidden */
    reset?(): void;
    /** Update the screen, passing delta time/step */
    update?(delta: number): void;
    /** Check the progress */
    progress?(progress: number): void;
    /** Resize the screen */
    resize?(width: number, height: number): void;
    /** Blur the screen */
    blur?(): void;
    /** Focus the screen */
    focus?(): void;
}
/** Interface for app screens constructors */
interface SectionConstructor {
    new (): ModalSection;
}

export type InfoPopupData = {
    finished: boolean;
    onBetChanged: () => void;
};

/** Popup for volume and game mode settings */
export class InfoPopup extends Container {
    private bg: Sprite;
    /** Modal title */
    private title: Label;
    /** Close buttom */
    private closeButton: IconButton;
    /** The board panel  */
    private panel: Graphics;
    /** Container for the popup UI components */
    private container: Container;
    /** Section current index */
    private sectionIndex: number = 0;
    /** Page label */
    private sectionlabel: Label;
    /** Current in viewed section */
    public currentSection?: ModalSection;
    /** Left button */
    public leftButton: IconButton;
    /** Left button */
    public rightButton: IconButton;
    /** Sections */
    private sections: { title: string; section: SectionConstructor }[] = [
        {
            title: 'Paytable',
            section: PayTableSection,
        },
        {
            title: 'Game Rules',
            section: GameRulesSection,
        },
        {
            title: 'How to play',
            section: HowToPlaySection,
        },
        {
            title: 'Settings menu',
            section: SettingsMenuSection,
        },
    ];

    constructor() {
        super();

        this.bg = Sprite.from(Texture.WHITE);
        this.bg.interactive = true;
        this.bg.alpha = 0.7;
        this.bg.tint = 0x000000;
        this.addChild(this.bg);

        const width = 1400;
        const height = 800;
        const radius = 10;
        const border = 0;
        const borderColor = '#000000b3';
        const backgroundColor = '#000000b3';

        this.panel = new Graphics()
            .fill(borderColor)
            .roundRect(0, 0, width, height, radius)
            .fill(backgroundColor)
            .roundRect(border, border, width - border * 2, height - border * 2, radius);
        this.panel.pivot.set(width / 2, height / 2);
        this.addChild(this.panel);

        this.title = new Label('Information', {
            fill: '#FCC100',
        });
        this.title.anchor.set(0.5);
        this.title.x = this.panel.width * 0.5;
        this.title.y = 100;
        this.title.style.fontSize = 32;
        this.panel.addChild(this.title);

        this.closeButton = new IconButton({
            imageDefault: 'icon-button-default-close-view',
            imageHover: 'icon-button-active-close-view',
            imagePressed: 'icon-button-active-close-view',
            imageDisabled: 'icon-button-active-close-view',
        });
        this.closeButton.scale.set(0.5);
        this.closeButton.x = this.panel.width - 60;
        this.closeButton.y = 60;
        this.closeButton.onPress.connect(() => navigation.dismissPopup());
        this.panel.addChild(this.closeButton);

        this.container = new Container();
        this.container.x = this.panel.width * 0.5 - 130;
        this.container.y = this.panel.height * 0.5 - 100;
        this.panel.addChild(this.container);

        this.leftButton = new IconButton({
            imageDefault: 'icon-button-left-arrow-default-view',
            imageHover: 'icon-button-left-arrow-active-view',
            imagePressed: 'icon-button-left-arrow-active-view',
            imageDisabled: 'icon-button-left-arrow-active-view',
        });
        this.leftButton.anchor.set(0.5);
        this.leftButton.scale.set(0.75);
        this.panel.addChild(this.leftButton);
        this.leftButton.onPress.connect(() => this.back());

        this.rightButton = new IconButton({
            imageDefault: 'icon-button-right-arrow-default-view',
            imageHover: 'icon-button-right-arrow-active-view',
            imagePressed: 'icon-button-right-arrow-active-view',
            imageDisabled: 'icon-button-right-arrow-active-view',
        });
        this.rightButton.anchor.set(0.5);
        this.rightButton.scale.set(0.75);
        this.panel.addChild(this.rightButton);
        this.rightButton.onPress.connect(() => this.next());

        this.sectionlabel = new Label('', { fill: '#ffffff', fontSize: 20 });
        this.sectionlabel.anchor.set(0.5); // Add this
        this.panel.addChild(this.sectionlabel);

        this.init();
    }

    /** Resize the popup, fired whenever window size changes */
    public resize(width: number, height: number) {
        this.bg.width = width;
        this.bg.height = height;

        const isMobile = document.documentElement.id === 'isMobile';
        const isPortrait = width < height;

        if (isMobile && isPortrait) {
            const panelWidth = width * 0.9;
            const panelHeight = height * 0.85;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 52;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.75);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            /** Navigations */
            this.rightButton.x = panelWidth - this.leftButton.width * 0.5 - 40;
            this.leftButton.x = 40;

            this.sectionlabel.x = panelWidth * 0.5;
            this.sectionlabel.y = panelHeight - this.sectionlabel.height - 30;

            this.rightButton.y = panelHeight * 0.5 - this.rightButton.height * 0.5;
            this.leftButton.y = panelHeight * 0.5 - this.leftButton.height * 0.5;
        } else if (isMobile && !isPortrait) {
            const panelWidth = width * 0.85;
            const panelHeight = height * 0.9;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 52;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.75);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            /** Navigations */
            this.rightButton.x = panelWidth - this.leftButton.width * 0.5 - 40;
            this.leftButton.x = 40;

            this.sectionlabel.x = panelWidth * 0.5;
            this.sectionlabel.y = panelHeight - this.sectionlabel.height - 30;

            this.rightButton.y = panelHeight * 0.5 - this.rightButton.height * 0.5;
            this.leftButton.y = panelHeight * 0.5 - this.leftButton.height * 0.5;
        } else {
            const panelWidth = 1400;
            const panelHeight = 800;

            this.panel.clear();
            this.panel
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10)
                .fill('#000000b3')
                .roundRect(0, 0, panelWidth, panelHeight, 10);

            this.panel.pivot.set(panelWidth / 2, panelHeight / 2);
            this.panel.scale.set(1);

            this.title.style.fontSize = 32;
            this.title.x = panelWidth * 0.5;

            this.closeButton.scale.set(0.5);
            this.closeButton.x = panelWidth - 60;
            this.closeButton.y = 60;

            /** Navigations */
            this.rightButton.x = panelWidth - this.leftButton.width * 0.5 - 40;
            this.leftButton.x = 40;

            this.sectionlabel.x = panelWidth * 0.5;
            this.sectionlabel.y = panelHeight - this.sectionlabel.height - 30;

            this.rightButton.y = panelHeight * 0.5 - this.rightButton.height * 0.5;
            this.leftButton.y = panelHeight * 0.5 - this.leftButton.height * 0.5;
        }

        this.panel.x = width * 0.5;
        this.panel.y = height * 0.5;
    }

    /** Set things up just before showing the popup */
    public prepare(_data: InfoPopup) {}

    public update() {}

    public updateSectionInfo() {
        const title = this.sections[this.sectionIndex].title;
        const sectionLabel = `${'Section'} ${this.sectionIndex + 1}/${this.sections.length}`;

        this.title.text = title;
        this.sectionlabel.text = sectionLabel;
    }

    public async init() {
        await this.showSection(this.sections[this.sectionIndex].section);
        this.updateSectionInfo();
    }

    public async next() {
        // Increase the betIndex if it's not already at the maximum index
        if (this.sectionIndex < this.sections.length - 1) {
            this.sectionIndex++;
        } else {
            this.sectionIndex = 0;
        }
        await this.showSection(this.sections[this.sectionIndex].section);

        this.updateSectionInfo();
    }

    public async back() {
        // Decrease the betIndex if it's not already at the minimum index
        if (this.sectionIndex > 0) {
            this.sectionIndex--;
        } else {
            this.sectionIndex = this.sections.length - 1;
        }
        await this.showSection(this.sections[this.sectionIndex].section);

        this.updateSectionInfo();
    }

    /** Show section */
    public async showSection(ctor: SectionConstructor) {
        // Block interactivity in current screen
        if (this.currentSection) {
            this.currentSection.interactiveChildren = false;
        }

        // If there is a screen already created, hide and destroy it
        if (this.currentSection) {
            await this.hideAndRemoveSection(this.currentSection);
        }

        // Create the new screen and add that to the stage
        this.currentSection = pool.get(ctor);
        await this.addAndShowSection(this.currentSection);
    }

    /** Remove screen from the stage, unlink update & resize functions */
    private async hideAndRemoveSection(section: ModalSection) {
        // Prevent interaction in the screen
        section.interactiveChildren = false;

        // Hide screen if method is available
        if (section.hide) {
            await section.hide();
        }

        // Remove screen from its parent (usually app.stage, if not changed)
        if (section.parent) {
            section.parent.removeChild(section);
        }

        // Clean up the screen so that instance can be reused again later
        if (section.reset) {
            section.reset();
        }
    }

    /** Add screen to the stage, link update & resize functions */
    private async addAndShowSection(section: ModalSection) {
        // Add navigation container to stage if it does not have a parent yet
        if (!this.container.parent) {
            this.panel.addChild(this.container);
        }

        // Add screen to stage
        this.container.addChild(section);

        // Setup things and pre-organise screen before showing
        if (section.prepare) {
            section.prepare();
        }

        // Add screen's resize handler, if available
        if (section.resize) {
            // Trigger a first resize
            section.resize(this.width, this.height);
        }

        // Show the new screen
        if (section.show) {
            section.interactiveChildren = false;
            await section.show();
            section.interactiveChildren = true;
        }
    }
}
