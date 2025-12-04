import { Container, Sprite } from 'pixi.js';
import { Label } from './Label';

const defaultMatchPatternOptions = {
    image: 'slot-placeholder',
    times: 0,
    amount: 0,
};

export type MatchPatternOptions = typeof defaultMatchPatternOptions;

export class MatchPattern extends Container {
    private image: Sprite;
    public text: Label;

    constructor(options: Partial<MatchPatternOptions> = {}) {
        super();

        const opts = { ...defaultMatchPatternOptions, ...options };
        this.image = Sprite.from(opts.image);
        this.image.anchor.set(0.5);
        this.addChild(this.image);

        this.text = new Label(` x ${opts.times} = ${opts.amount}`, {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: '200',
            wordWrap: true,
        });
        this.text.anchor.set(0, 0.5);
        this.addChild(this.text);
    }
}
