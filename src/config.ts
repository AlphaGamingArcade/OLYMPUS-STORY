import { AuthAPI } from './api/authApi';
import { GameAPI } from './api/gameApi';
import { gameConfig } from './utils/gameConfig';
import { getUrlParam } from './utils/getUrlParams';
import { deleteUrlParams, setUrlParams } from './utils/setUrlParams';
import { userSettings } from './utils/userSettings';

export async function loginUser() {
    const token = getUrlParam('token');
    await AuthAPI.login(token);

    // Delete token in the URL
    if (import.meta.env.PROD) {
        deleteUrlParams('token');
    }
}

export async function loadGameConfig() {
    const gamecode = 'olympusstory';
    const [result, result2] = await Promise.all([GameAPI.getSettings({ gamecode }), GameAPI.collect({ gamecode })]);
    const lang = getUrlParam('lang') ?? result.language ?? 'en';
    const cur = getUrlParam('cur') ?? result.currency ?? 'usd';

    // Game configuration from server
    gameConfig.setTypes(result.settings.blocks);
    gameConfig.setPaytables(result.settings.paytables);
    gameConfig.setScatterType(result.settings.scatterType);
    gameConfig.setScatterTriggers(result.settings.scatterTriggers);
    gameConfig.setBuyFeatureBetMultiplier(result.settings.buyFeatureBetMultiplier);
    gameConfig.setJackpots(result.settings.jackpots);

    // User settings
    userSettings.setBetOptions(result.bettingLimit.MONEY_OPTION);
    userSettings.setBalance(result2.balance ?? 0);
    userSettings.setIndex(result2.index ?? 0);

    // Update URL with both parameters
    setUrlParams('lang', lang);
    setUrlParams('cur', cur);
}
