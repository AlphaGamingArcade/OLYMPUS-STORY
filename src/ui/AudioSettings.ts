import { Container } from 'pixi.js';
import { AudioSwitcher } from './AudioSwitcher';

export interface AudioSettingsOptions {
    gap?: number;
    width?: number;
}

/**
 * A component that contains audio settings (Ambient Music and Sound FX switchers)
 */
export class AudioSettings extends Container {
    /** Sound FX Switch */
    public soundFXSwitcher: AudioSwitcher;
    /** Ambient Music Switch */
    public ambientMusicSwitcher: AudioSwitcher;
    /** Gap between switchers */
    private gap: number;
    /** Ambient music toggle callback */
    private onAmbientMusicToggleCallback?: () => void;
    /** Sound FX toggle callback */
    private onSoundFXToggleCallback?: () => void;

    constructor(options: AudioSettingsOptions = {}) {
        super();

        this.gap = options.gap ?? 50;
        const width = options.width ?? 300;

        /** Ambient music Switcher */
        this.ambientMusicSwitcher = new AudioSwitcher({
            title: 'Ambient music',
            description: 'Ambient music sub text',
            width,
        });
        this.ambientMusicSwitcher.onPress(() => this.onAmbientMusicToggleCallback?.());
        // this.ambientMusicSwitcher.onPress(() => {
        //     const bgmVolume = bgm.getVolume();
        //     const newState = bgmVolume <= 0; // If currently off, turn on

        //     bgm.setVolume(newState ? 1 : 0);
        //     this.ambientMusicSwitcher.forceSwitch(!newState);

        //     if (this.onAmbientMusicToggleCallback) {
        //         this.onAmbientMusicToggleCallback(newState);
        //     }

        //     if (this.onUpdate) {
        //         this.onUpdate();
        //     }
        // });
        this.addChild(this.ambientMusicSwitcher);

        /** Sound FX */
        this.soundFXSwitcher = new AudioSwitcher({
            title: 'Sound FX',
            description: 'Sound FX Description',
            width,
        });
        this.soundFXSwitcher.onPress(() => this.onSoundFXToggleCallback?.());

        // this.soundFXSwitcher.onPress(() => {
        //     const sfxVolume = sfx.getVolume();
        //     const newState = sfxVolume <= 0; // If currently off, turn on

        //     sfx.setVolume(newState ? 1 : 0);
        //     this.soundFXSwitcher.forceSwitch(!newState);

        //     if (this.onSoundFXToggleCallback) {
        //         this.onSoundFXToggleCallback(newState);
        //     }

        //     if (this.onUpdate) {
        //         this.onUpdate();
        //     }
        // });
        this.soundFXSwitcher.y = this.ambientMusicSwitcher.height + this.gap;
        this.addChild(this.soundFXSwitcher);
    }

    /**
     * Set ambient music toggle callback
     */
    public onAmbientMusicToggle(callback: () => void): void {
        this.onAmbientMusicToggleCallback = callback;
    }

    /**
     * Set sound FX toggle callback
     */
    public onSoundFXToggle(callback: () => void): void {
        this.onSoundFXToggleCallback = callback;
    }

    /**
     * Initialize the switchers with current audio state
     */
    public setup(isAmbientMusicOn: boolean, isSoundFXOn: boolean): void {
        this.ambientMusicSwitcher.forceSwitch(isAmbientMusicOn);
        this.soundFXSwitcher.forceSwitch(isSoundFXOn);
    }
}
