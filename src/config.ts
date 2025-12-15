import { BetAPI } from './api/betApi';
import { ConfigAPI } from './api/configApi';
import { gameConfig } from './utils/gameConfig';
import { getUrlParam } from './utils/getUrlParams';
import { userSettings } from './utils/userSettings';

export async function loadGameConfig() {
    const [result, result2] = await Promise.all([ConfigAPI.config(), BetAPI.collect()]);
    const lang = getUrlParam('lang') ?? 'en';
    const cur = getUrlParam('cur') ?? 'usd';

    // Game configuration from server
    gameConfig.setBlocks(result.blocks);
    gameConfig.setPaytables(result.paytables);
    gameConfig.setScatterType(result.scatterType);
    gameConfig.setScatterTriggers(result.scatterTriggers);
    gameConfig.setBuyFeatureBetMultiplier(result.buyFeatureBetMultiplier);
    gameConfig.setJackpots(result.jackpots);

    // User settings
    userSettings.setBalance(result2.balance);
    userSettings.setLanguage(lang);
    userSettings.setCurrency(cur);
}
