import { FancyButton, Switcher } from '@pixi/ui';
/** Unique button to be used to toggle audio.
 *
 * Uses elements from @pixi/ui.
 */
export class Checkbox extends FancyButton {
    /**
     * A reference to an object used to display the mute state
     *
     * Switcher button from @pixi/ui. Acts similar to a html checkbox
     */
    private switcher: Switcher;

    constructor() {
        const switcher = new Switcher(['checkbox-default-btn', 'checkbox-active-btn']);

        super({
            // Add the switcher as a view for the FancyButton
            defaultView: switcher,
        });

        this.switcher = switcher;
    }

    public forceSwitch(value: boolean) {
        this.switcher.forceSwitch(value ? 1 : 0);
    }

    public set active(v: number) {
        this.switcher.active = v;
    }

    public get active() {
        return this.switcher.active;
    }
}
