const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const steam = require('./steamMain.cjs');

const appId = steam.readSteamAppId();

// Steam 経由の正しい起動でなければ再起動して終了（公式フロー）
if (steam.steamworks && steam.restartIfNecessary(appId)) {
    app.quit();
    process.exit(0);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 880,
        minWidth: 800,
        minHeight: 600,
        show: false,
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    win.once('ready-to-show', () => {
        win.show();
    });

    win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
    steam.initSteamClient(appId);
    steam.maybeEnableSteamOverlay();
    steam.registerSteamIpc(ipcMain);
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
