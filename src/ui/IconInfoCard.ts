import { List } from '@pixi/ui';
import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';

const defaultSprite = 'slot-placeholder';

const defaultIconInfoCardOptions = {
    image: 'slot-placeholder',
    label: 'label',
    imageScale: 1,
    fontSize: 18,
};

export type IconInfoCardOptions = typeof defaultIconInfoCardOptions;

export class IconInfoCard extends Container {
    private layout: List;

    private image: Sprite;

    private labelMessage: Label;

    constructor(options: Partial<IconInfoCardOptions> = {}) {
        super();
        const opts = { ...defaultIconInfoCardOptions, ...options };

        this.layout = new List({ type: 'horizontal', elementsMargin: 5 });
        this.addChild(this.layout);

        this.image = Sprite.from(opts?.image ?? defaultSprite);
        this.image.scale.set(opts.imageScale);
        this.layout.addChild(this.image);

        this.labelMessage = new Label(opts.label, { fill: 0xffffff, fontSize: opts.fontSize, fontWeight: '200' });
        this.layout.addChild(this.labelMessage);

        this.image.x = -(this.labelMessage.width / 2);
        this.image.y = -(this.image.height / 2);

        this.layout.x = -50;
    }
}
