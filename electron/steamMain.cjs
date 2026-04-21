/**
 * Steamworks（steamworks.js）— メインプロセスのみで使用。
 * レンダラーは preload 経由の IPC を使う。
 */
const path = require('path');
const fs = require('fs');

let steamworks = null;
try {
    steamworks = require('steamworks.js');
} catch (e) {
    console.warn('[Steam] steamworks.js を読み込めません:', e.message);
}

/**
 * 配布ビルド: 実行ファイルと同じフォルダ。開発時: リポジトリ直下の steam_appid.txt
 */
function readSteamAppId() {
    const { app } = require('electron');
    const candidates = [];
    try {
        if (app && app.isPackaged) {
            candidates.push(path.join(path.dirname(process.execPath), 'steam_appid.txt'));
        }
    } catch (_) {
        /* noop */
    }
    candidates.push(path.join(__dirname, '..', 'steam_appid.txt'));
    for (const file of candidates) {
        if (fs.existsSync(file)) {
            const n = parseInt(fs.readFileSync(file, 'utf8').trim(), 10);
            if (!Number.isNaN(n) && n > 0) {
                return n;
            }
        }
    }
    return 480;
}

let steamClient = null;

function getSteamClient() {
    return steamClient;
}

function initSteamClient(appId) {
    if (!steamworks) {
        return null;
    }
    try {
        steamClient = steamworks.init(appId);
        console.log('[Steam] 初期化 OK (AppID:', appId, ')');
        return steamClient;
    } catch (e) {
        console.warn('[Steam] 初期化に失敗しました（Steam クライアント未起動など）:', e.message);
        steamClient = null;
        return null;
    }
}

/**
 * app.ready の前に呼ぶ。Steam からの正しい起動でなければ再起動して終了する。
 */
function restartIfNecessary(appId) {
    if (!steamworks) {
        return false;
    }
    try {
        return steamworks.restartAppIfNecessary(appId);
    } catch (e) {
        console.warn('[Steam] restartAppIfNecessary:', e.message);
        return false;
    }
}

/**
 * オーバーレイは環境変数 STEAM_OVERLAY=1 のときのみ（クラッシュ報告があるため任意）
 */
function maybeEnableSteamOverlay() {
    if (!steamworks || process.env.STEAM_OVERLAY !== '1') {
        return;
    }
    try {
        steamworks.electronEnableSteamOverlay(true);
        console.log('[Steam] オーバーレイを有効にしました');
    } catch (e) {
        console.warn('[Steam] electronEnableSteamOverlay に失敗:', e.message);
    }
}

function registerSteamIpc(ipcMain) {
    ipcMain.handle('steam:isAvailable', () => !!steamClient);

    ipcMain.handle('steam:getPersonaName', () => {
        if (!steamClient) {
            return null;
        }
        try {
            return steamClient.localplayer.getName();
        } catch {
            return null;
        }
    });

    ipcMain.handle('steam:activateAchievement', (_event, apiName) => {
        if (!steamClient || typeof apiName !== 'string') {
            return false;
        }
        try {
            return steamClient.achievement.activate(apiName);
        } catch {
            return false;
        }
    });

    ipcMain.handle('steam:isAchievementActivated', (_event, apiName) => {
        if (!steamClient || typeof apiName !== 'string') {
            return false;
        }
        try {
            return steamClient.achievement.isActivated(apiName);
        } catch {
            return false;
        }
    });

    ipcMain.handle('steam:clearAchievement', (_event, apiName) => {
        if (!steamClient || typeof apiName !== 'string') {
            return false;
        }
        try {
            return steamClient.achievement.clear(apiName);
        } catch {
            return false;
        }
    });
}

module.exports = {
    steamworks,
    readSteamAppId,
    getSteamClient,
    initSteamClient,
    restartIfNecessary,
    maybeEnableSteamOverlay,
    registerSteamIpc
};
