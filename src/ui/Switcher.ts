import { FancyButton, Switcher as PIXISwitcher } from '@pixi/ui';
/** Unique button to be used to toggle audio.
 *
 * Uses elements from @pixi/ui.
 */
export class Switcher extends FancyButton {
    /**
     * A reference to an object used to display the mute state
     *
     * Switcher button from @pixi/ui. Acts similar to a html checkbox
     */
    private switcher: PIXISwitcher;

    constructor() {
        const switcher = new PIXISwitcher(['switch-on', 'switch-off']); // Force the visual switched state to be the muted state
        super({
            // Add the switcher as a view for the FancyButton
            defaultView: switcher,
        });

        this.switcher = switcher;
    }

    /**
     * This method updates the display of the mute state to match the provided muted value.
     * @param value - The audio state
     */
    public forceSwitch(value: boolean) {
        // Force the visual switched state to be the muted state
        this.switcher.forceSwitch(value ? 0 : 1);
    }
}
