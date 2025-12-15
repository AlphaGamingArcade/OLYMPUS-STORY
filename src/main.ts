import '@esotericsoftware/spine-pixi-v8';

import { Application } from 'pixi.js';
import { initAssets } from './utils/assets';
import { navigation } from './utils/navigation';
import { LoadScreen } from './screens/LoadScreen';
import { sound } from '@pixi/sound';
import { CloudBackground } from './ui/CloudBackground';
import { getUrlParam } from './utils/getUrlParams';
import { GameScreen } from './screens/GameScreen';
import { initDevtools } from '@pixi/devtools';
import { BigWinPopup, BigWinPopupData } from './popups/BigWinPopup';
import { FreeSpinWinPopup, FreeSpinWinPopupData } from './popups/FreeSpinWinPopup';
import { JackpotWinPopup, JackpotWinPopupData } from './popups/JackpotWinPopup';
import { loadGameConfig } from './config';

/** The PixiJS app Application instance, shared across the project */
export const app = new Application();

initDevtools({ app });

/** Set up a resize function for the app */
function resize() {
    const isMobile = document.documentElement.id === 'isMobile';

    // Get actual window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let baseWidth, baseHeight;

    if (isMobile) {
        // Check if landscape or portrait on mobile
        const isLandscape = windowWidth > windowHeight;

        if (isLandscape) {
            baseWidth = 1920;
            baseHeight = 1080;
        } else {
            baseWidth = 1080;
            baseHeight = 1920;
        }
    } else {
        // Desktop - always landscape
        baseWidth = 1920;
        baseHeight = 1080;
    }

    // Calculate scale to fit the window while maintaining aspect ratio
    const scaleX = windowWidth / baseWidth;
    const scaleY = windowHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate centered position
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    const centerX = (windowWidth - scaledWidth) / 2;
    const centerY = (windowHeight - scaledHeight) / 2;

    // Update canvas style dimensions and position to center
    app.renderer.canvas.style.width = `${scaledWidth}px`;
    app.renderer.canvas.style.height = `${scaledHeight}px`;
    app.renderer.canvas.style.position = 'absolute';
    app.renderer.canvas.style.left = `${centerX}px`;
    app.renderer.canvas.style.top = `${centerY}px`;

    // Update renderer dimensions (actual rendering size)
    app.renderer.resize(baseWidth, baseHeight);

    // Pass the base dimensions to navigation
    navigation.resize(baseWidth, baseHeight);

    window.scrollTo(0, 0);
}

/** Fire when document visibility changes - lose or regain focus */
function visibilityChange() {
    if (document.hidden) {
        sound.pauseAll();
        navigation.blur();
    } else {
        sound.resumeAll();
        navigation.focus();
    }
}

/** Setup app and initialise assets */
async function init() {
    // Load game config
    await loadGameConfig();

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        document.documentElement.id = 'isMobile';
    } else {
        document.documentElement.id = 'isDesktop';
    }

    // Initialize app
    await app.init({
        resolution: isMobile ? Math.min(window.devicePixelRatio, 0.75) : Math.max(window.devicePixelRatio, 2),
        backgroundColor: 0x000000,
    });

    // Add pixi canvas element (app.canvas) to the document's body
    document.body.appendChild(app.canvas);

    // Whenever the window resizes, call the 'resize' function
    window.addEventListener('resize', resize);

    // Trigger the first resize
    resize();

    // Add a visibility listener, so the app can pause sounds and screens
    document.addEventListener('visibilitychange', visibilityChange);

    // Setup assets bundles (see assets.ts) and start up loading everything in background
    await initAssets();

    // Add a persisting background shared by all screens
    navigation.setBackground(CloudBackground);

    // Show initial loading screen
    await navigation.showScreen(LoadScreen);

    // Go to one of the screens if a shortcut is present in url params, otherwise go to home screen
    if (getUrlParam('game') !== null) {
        await navigation.showScreen(GameScreen);
    } else if (getUrlParam('load') !== null) {
        await navigation.showScreen(LoadScreen);
    } else if (getUrlParam('modal') !== null) {
        navigation.presentPopup<JackpotWinPopupData>(JackpotWinPopup, {
            name: 'angelic',
            times: 2,
            amount: 1000,
            callback: async () => {
                await navigation.dismissPopup();
            },
        });
    } else if (getUrlParam('modal2') !== null) {
        navigation.presentPopup<BigWinPopupData>(BigWinPopup, {
            category: 'astounding',
            amount: 1000,
            callback: () => {},
        });
    } else if (getUrlParam('modal3') != null) {
        navigation.presentPopup<FreeSpinWinPopupData>(FreeSpinWinPopup, {
            amount: 1000,
            spins: 10,
            callback: async () => {},
        });
    } else {
        await navigation.showScreen(LoadScreen);
    }
}

// Init everything
init();
