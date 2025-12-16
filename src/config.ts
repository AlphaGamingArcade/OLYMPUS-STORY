import { AuthAPI } from './api/authApi';
import { GameAPI } from './api/gameApi';
import { gameConfig } from './utils/gameConfig';
import { getUrlParam } from './utils/getUrlParams';
import { setUrlParams } from './utils/setUrlParams';
import { userSettings } from './utils/userSettings';

export async function loginUser() {
    const token = getUrlParam('token');
    await AuthAPI.login(token);
}

export async function loadGameConfig() {
    const [result, result2] = await Promise.all([GameAPI.getSettings(), GameAPI.collect()]);
    const lang = getUrlParam('lang') ?? result.language ?? 'en';
    const cur = getUrlParam('cur') ?? result.currency ?? 'usd';

    // Game configuration from server
    gameConfig.setTypes(result.config.blocks);
    gameConfig.setPaytables(result.config.paytables);
    gameConfig.setScatterType(result.config.scatterType);
    gameConfig.setScatterTriggers(result.config.scatterTriggers);
    gameConfig.setBuyFeatureBetMultiplier(result.config.buyFeatureBetMultiplier);
    gameConfig.setJackpots(result.config.jackpots);

    // User settings
    userSettings.setBalance(result2.balance);

    // Update URL with both parameters
    setUrlParams('lang', lang);
    setUrlParams('cur', cur);
}
