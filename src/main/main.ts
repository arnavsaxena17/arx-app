import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { autoUpdater } from 'electron-updater';
import ElectronStore from 'electron-store';

const SERVER_URL = 'https://arxena.com';

const store = new ElectronStore({
  schema: {
    extensionPath: {
      type: 'string',
      default: ''
    },
    lastUpdated: {
      type: 'number',
      default: 0
    }
  }
});

let mainWindow: BrowserWindow | null = null;

// Add this near the top of the file after imports
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Add this near the top of main.ts for testing
if (process.env.NODE_ENV === 'development') {
  autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
}

function createWindow() {
  const iconPath = process.platform === 'darwin' 
    ? path.join(__dirname, '../../public/assets/icons/app.icns')
    : path.join(__dirname, '../../public/assets/icons/android-launchericon-512-512.png');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  console.log("Main process started");
  // mainWindow.webContents.on('did-finish-load', () => {
  //   mainWindow?.webContents.openDevTools();
  // });
  
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  console.log("HTML path:", path.join(__dirname, '../renderer/index.html'));

  // Download extension on startup
  const extensionPath = store.get('extensionPath') as string;
  if (!extensionPath) {
    // Set default path for first download
    const defaultPath = path.join(app.getPath('downloads'), 'candidate_cvs', 'arx-crx');
    downloadChromeExtension(defaultPath).then(success => {
      if (success) {
        store.set('extensionPath', defaultPath);
        store.set('lastUpdated', Date.now());
      }
    });
  } else {
    // For subsequent updates, ensure we're using the correct path
    const normalizedPath = path.normalize(extensionPath).replace(/arx-crx(\/arx-crx)+$/, 'arx-crx');
    if (normalizedPath !== extensionPath) {
      store.set('extensionPath', normalizedPath);
    }
    updateChromeExtension();
  }

  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Add this function to setup auto-updater
function setupAutoUpdater() {
  // Log updates
  autoUpdater.logger = require("electron-log");
  (autoUpdater.logger as any).transports.file.level = "info";

  // Setup event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    // Optionally notify the user
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater error:', err);
  });
}

// Modify your existing checkForAppUpdates function
async function checkForAppUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates();
    console.log('Update check result:', result);
  } catch (err) {
    console.error('Error checking for updates:', err);
  }
}

async function downloadChromeExtension(targetPath: string): Promise<boolean> {
  try {
    const response = await axios.get(`${SERVER_URL}/extension`, {
      responseType: 'arraybuffer'
    });
    
    const zipBuffer = Buffer.from(response.data);
    console.log(`Received zip buffer of size: ${zipBuffer.length} bytes`);
    
    // Normalize the target path to prevent nested arx-crx directories
    const normalizedPath = path.normalize(targetPath).replace(/arx-crx(\/arx-crx)+$/, 'arx-crx');
    
    // Ensure base directory exists
    const baseDir = path.dirname(normalizedPath);
    if (!fs.existsSync(baseDir)) {
      console.log(`Creating base directory: ${baseDir}`);
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const extensionDir = normalizedPath;
    const zipPath = path.join(baseDir, 'extension.zip');

    // Write and extract zip file
    fs.writeFileSync(zipPath, zipBuffer);
    console.log(`Wrote zip file to: ${zipPath}`);

    // Remove existing extension directory if it exists
    if (fs.existsSync(extensionDir)) {
      fs.rmSync(extensionDir, { recursive: true, force: true });
    }

    // Create extension directory
    fs.mkdirSync(extensionDir, { recursive: true });
    
    // Extract zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extensionDir, true);
    console.log(`Extracted zip contents to: ${extensionDir}`);
    
    // Clean up zip file
    fs.unlinkSync(zipPath);
    console.log('Removed zip file after extraction');
    
    const extractedFiles = fs.readdirSync(extensionDir);
    console.log('Extracted files:', extractedFiles);
    
    store.set('extensionPath', extensionDir);
    store.set('lastUpdated', Date.now());
    console.log("Extension downloaded successfully::", extensionDir);
    return true;
  } catch (error) {
    console.error('Error downloading extension:', error);
    return false;
  }
}

// Update the Chrome extension if needed
async function updateChromeExtension() {
  try {
    const extensionPath = store.get('extensionPath') as string;
    if (!extensionPath) {
      console.log('No extension path set, skipping update');
      return;
    }

    console.log("Extension path for updating chrome extension:", extensionPath);
    const success = await downloadChromeExtension(extensionPath);
    if (success && mainWindow) {
      mainWindow.webContents.send('extension-updated', {
        path: extensionPath,
        timestamp: Date.now()
      });
      console.log('Extension updated successfully');
    } else {
      console.error('Failed to update extension');
    }
  } catch (error) {
    console.error('Error updating extension:', error);
  }
}

// Update your setupPeriodicUpdates function
function setupPeriodicUpdates() {
  // Check for updates immediately on startup
  checkForAppUpdates();
  
  // Then check periodically (every 30 minutes)
  setInterval(() => {
    checkForAppUpdates();
  }, 10 * 60 * 1000);
}

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();
  checkForAppUpdates();
  setupPeriodicUpdates();

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

ipcMain.handle('download-extension', async (_, savePath: string) => {
  let finalPath: string = '';
  
  if (!savePath) {
    // First check if we have a stored extension path
    const storedPath = store.get('extensionPath') as string;
    
    if (storedPath) {
      // Use the existing stored path
      finalPath = storedPath;
    } else {
      // Only show dialog if no stored path exists
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select where to save the Chrome extension'
      });
      if (canceled || filePaths.length === 0) {
        return { success: false, message: 'Cancelled by user' };
      }
      finalPath = path.join(filePaths[0], 'arx-crx');
    }
  } else {
    finalPath = savePath.endsWith('arx-crx') ? savePath : path.join(savePath, 'arx-crx');
  }
  
  // Normalize the path to prevent nested arx-crx directories
  finalPath = path.normalize(finalPath).replace(/arx-crx(\/arx-crx)+$/, 'arx-crx');
  
  if (!finalPath) {
    return {
      success: false,
      message: 'Failed to determine valid extension path'
    };
  }
  
  const success = await downloadChromeExtension(finalPath);
  return {
    success,
    path: finalPath,
    message: success ? 'Extension downloaded successfully' : 'Failed to download extension'
  };
});

ipcMain.handle('get-extension-info', () => {
  return {
    path: store.get('extensionPath'),
    lastUpdated: store.get('lastUpdated')
  };
}); 