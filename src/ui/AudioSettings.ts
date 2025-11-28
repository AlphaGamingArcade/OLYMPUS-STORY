import { Container } from 'pixi.js';
import { AudioSwitcher } from './AudioSwitcher';
import { bgm, sfx } from '../utils/audio';

export interface AudioSettingsOptions {
    gap?: number;
    width?: number;
}

/**
 * A component that contains audio settings (Ambient Music and Sound FX switchers)
 */
export class AudioSettings extends Container {
    /** Sound FX Switch */
    private soundFXSwitcher: AudioSwitcher;
    /** Ambient Music Switch */
    private ambientMusicSwitcher: AudioSwitcher;
    /** Gap between switchers */
    private gap: number;
    /** Update callback */
    private onUpdate?: () => void;

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
        this.ambientMusicSwitcher.onPress(() => {
            const bgmVolume = bgm.getVolume();
            const newState = bgmVolume <= 0; // If currently off, turn on

            bgm.setVolume(newState ? 1 : 0);
            this.ambientMusicSwitcher.forceSwitch(!newState);

            if (this.onUpdate) {
                this.onUpdate();
            }
        });
        this.addChild(this.ambientMusicSwitcher);

        /** Sound FX */
        this.soundFXSwitcher = new AudioSwitcher({
            title: 'Sound FX',
            description: 'Sound FX Description',
            width,
        });
        this.soundFXSwitcher.onPress(() => {
            const sfxVolume = sfx.getVolume();
            const newState = sfxVolume <= 0; // If currently off, turn on

            sfx.setVolume(newState ? 1 : 0);
            this.soundFXSwitcher.forceSwitch(!newState);

            if (this.onUpdate) {
                this.onUpdate();
            }
        });
        this.soundFXSwitcher.y = this.ambientMusicSwitcher.height + this.gap;
        this.addChild(this.soundFXSwitcher);

        // Initialize switchers with current audio state immediately
        this.setup();
    }

    /**
     * Initialize the switchers with current audio state
     */
    public setup(): void {
        const bgmVolume = bgm.getVolume();
        this.ambientMusicSwitcher.forceSwitch(bgmVolume > 0);

        const sfxVolume = sfx.getVolume();
        this.soundFXSwitcher.forceSwitch(sfxVolume > 0);
    }

    /**
     * Set update callback
     */
    public setUpdateCallback(callback: () => void): void {
        this.onUpdate = callback;
    }
}
