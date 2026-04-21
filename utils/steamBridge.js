/**
 * Steam 実績（Electron のみ）。ブラウザでは no-op。
 * Steam パートナーで定義した実績 API 名を渡す（例: 'ACH_FIRST_FLIGHT'）。
 *
 * @param {string} apiName
 * @returns {Promise<boolean>}
 */
export async function tryUnlockSteamAchievement(apiName) {
    if (typeof window === 'undefined' || !window.steamBridge || typeof apiName !== 'string') {
        return false;
    }
    try {
        const available = await window.steamBridge.isAvailable();
        if (!available) {
            return false;
        }
        return await window.steamBridge.activateAchievement(apiName);
    } catch {
        return false;
    }
}
