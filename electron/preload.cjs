const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronApp', {
    platform: process.platform
});

/**
 * Steamworks（メインプロセス経由）。Steam 未起動・未同梱時は isAvailable が false。
 */
contextBridge.exposeInMainWorld('steamBridge', {
    isAvailable: () => ipcRenderer.invoke('steam:isAvailable'),
    getPersonaName: () => ipcRenderer.invoke('steam:getPersonaName'),
    activateAchievement: (apiName) => ipcRenderer.invoke('steam:activateAchievement', apiName),
    isAchievementActivated: (apiName) => ipcRenderer.invoke('steam:isAchievementActivated', apiName),
    clearAchievement: (apiName) => ipcRenderer.invoke('steam:clearAchievement', apiName)
});
