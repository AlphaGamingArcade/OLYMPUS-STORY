import { Container } from 'pixi.js';
import { List } from '@pixi/ui';
import { Label } from './Label';
import { IconInfoCard } from './IconInfoCard';

const defaultSettingsMenuSectionOptions = {
    icons1: [
        {
            label: 'Quick Spin',
        },
        {
            label: 'Into Screen',
        },
        {
            label: 'Modal info settings Ambient',
        },
        {
            label: 'Modal info sound fx',
        },
    ],
    icons2: [
        {
            image: 'controller-modal-left-arrow-btn',
            label: 'Left arrow button',
        },
        {
            image: 'controller-modal-right-arrow-btn',
            label: 'Right arrow button',
        },
        {
            image: 'controller-close-default-btn',
            label: 'Close Icon button',
        },
    ],
};

export type SettingsMenuSectionOptions = typeof defaultSettingsMenuSectionOptions;
export class SettingsMenuSection extends Container {
    private mainLayout: List;

    private topLayout: List;
    private bottomLayout: List;

    private secondTitleLabel: Label;

    constructor(opts: Partial<SettingsMenuSectionOptions> = {}) {
        super();

        const options = { ...defaultSettingsMenuSectionOptions, ...opts };

        this.mainLayout = new List({ type: 'vertical', elementsMargin: 50 });
        this.addChild(this.mainLayout);

        this.topLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.topLayout);

        options.icons1?.forEach((icon) => {
            const label = new Label(icon.label, { fill: 0xffffff, fontSize: 18, fontWeight: '200' });
            this.topLayout.addChild(label);
        });

        this.bottomLayout = new List({ type: 'vertical', elementsMargin: 20 });
        this.mainLayout.addChild(this.bottomLayout);

        this.secondTitleLabel = new Label('Second title text', {
            fill: '#FCC100',
        });
        this.secondTitleLabel.anchor.set(0.5);
        this.bottomLayout.addChild(this.secondTitleLabel);

        options.icons2.forEach((icon) => {
            const card = new IconInfoCard({ image: icon.image, label: icon.label, imageScale: 0.75 });
            this.bottomLayout.addChild(card);
        });
    }

    public resize(_width: number, _height: number) {
        this.mainLayout.x = 150;
        this.mainLayout.y = -170;
    }
}
