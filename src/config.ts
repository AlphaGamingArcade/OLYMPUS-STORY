import { AuthAPI } from './api/authApi';
import { GameAPI } from './api/gameApi';
import { GAMECODE } from './main';
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
    const gamecode = GAMECODE;
    const [result, result2, result3] = await Promise.all([
        GameAPI.getSettings({ gamecode }),
        GameAPI.collect({ gamecode }),
        GameAPI.checkResume({ gamecode }),
    ]);
    const lang = getUrlParam('lang') ?? result.language ?? 'en';
    const cur = getUrlParam('cur') ?? result.currency ?? 'usd';

    // Game configuration from server
    gameConfig.setTypes(result.settings.blocks);
    gameConfig.setPaytables(result.settings.paytables);
    gameConfig.setScatterType(result.settings.scatterType);
    gameConfig.setScatterTriggers(result.settings.scatterTriggers);
    gameConfig.setScatterFreeSpins(result.settings.scatterFreeSpins);
    gameConfig.setExtraScatterTriggers(result.settings.extraScatterTriggers);
    gameConfig.setExtraScatterFreeSpins(result.settings.extraScatterFreeSpins);
    gameConfig.setBuyFeatureBetMultiplier(result.settings.buyFeatureBetMultiplier);
    gameConfig.setJackpots(result.settings.jackpots);
    gameConfig.setGrid(result3.reels);
    gameConfig.setResumeType(result3.resumeType);
    gameConfig.setResumeBonusMeter(result3.bonus);
    gameConfig.setResumeBettingMoney(result3.bettingMoney);

    // User settings
    userSettings.setBetOptions(result.bettingLimit.MONEY_OPTION);
    userSettings.setBalance(result2.balance ?? 0);
    userSettings.setIndex(result2.index ?? 0);

    // Update URL with both parameters
    setUrlParams('lang', lang);
    setUrlParams('cur', cur);
}
