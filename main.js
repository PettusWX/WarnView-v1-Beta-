const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            plugins: true, // Allow plugins
            webSecurity: false, // Disable web security for streams
        },
    });

    mainWindow.loadFile('index.html');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('start-stream', async (event, slotId, url) => {
    try {
        const vlcInstance = new VLCClient({
            username: 'admin',
            password: 'rF4kS9eb',
            ip: '127.0.0.1',
            port: 8080,
        });
        await vlcInstance.play(url);
        return { success: true };
    } catch (error) {
        console.error(`Error starting VLC stream in slot ${slotId}:`, error);
        return { success: false, error: error.message };
    }
});
