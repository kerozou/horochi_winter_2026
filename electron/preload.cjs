const { contextBridge } = require('electron');

/**
 * Steamworks 等を後から足すときは、ここで contextBridge.exposeInMainWorld を使う。
 */
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform
});
