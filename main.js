const { app, BrowserWindow, ipcMain, shell, protocol, Menu, safeStorage } = require('electron'); // Added Menu, safeStorage

const fs = require('fs'); // Required for reading files // Added shell for potentially opening external links securely if ever needed, though not used for loadFile.
const { handleSearchQuery, sendChatMessageToGemini } = require('./middleware'); // Import from middleware
const path = require('path');

let store; // Will be initialized after dynamic import

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false // Recommended for security, use preload for Node.js access in renderer
    }
  });

  // Load index.html
  mainWindow.loadFile('index.html'); // We'll create this file

  // Set a Content Security Policy for the main window to allow necessary resources
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          // Allows scripts and styles from 'self' (our app) and 'unsafe-inline' (often needed for React/Webpack dev).
          // 'unsafe-eval' might be needed for some dev server setups / source maps.
          // data: allows inline images like base64 encoded ones.
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
        ]
      }
    });
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => { // Make this async
  try {
    const { default: Store } = await import('electron-store');
    store = new Store();
  } catch (err) {
    console.error('Failed to load electron-store:', err);
    // Handle error appropriately, maybe quit the app or show an error dialog
    app.quit();
    return;
  }

  createWindow();

  // Create a basic application menu to ensure standard shortcuts like Ctrl+F work
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }, // Keep this for debugging
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Handle search query from renderer process
ipcMain.handle('perform-search', async (event, query) => {
  console.log(`IPC Main: Received search query "${query}" from renderer.`);
  try {
    const results = await handleSearchQuery(query);
    return results;
  } catch (error) {
    console.error('IPC Main: Error during search handling:', error);
    return { error: 'Search failed in main process', details: error.message };
  }
});

// Handle request to open a file/path using the system's default application
ipcMain.on('handle-open-external-path', (event, filePath) => {
  if (!filePath || typeof filePath !== 'string') {
    console.error('IPC Main: Invalid file path received for handle-open-external-path.');
    return;
  }
  console.log(`IPC Main: Received request to open relative external path: ${filePath}`);
  const appDir = app.getAppPath();
  const absoluteFilePath = path.resolve(appDir, filePath);
  console.log(`IPC Main: Resolved to absolute external path: ${absoluteFilePath}`);

  // Convert to file:// URL. Note: on Windows, path.resolve already gives a path that works with file://
  // On POSIX, it's straightforward. URL constructor handles special characters.
  const fileUrl = new URL(`file://${absoluteFilePath}`).toString();
  console.log(`IPC Main: Opening URL in external browser: ${fileUrl}`);

  shell.openExternal(fileUrl)
    .then(() => {
      console.log(`IPC Main: Successfully requested to open ${fileUrl} in external browser.`);
    })
    .catch(err => {
      console.error(`IPC Main: Error opening ${fileUrl} in external browser:`, err);
      // Optionally, send a message back to the renderer if opening failed
    });
});

// Gemini API Key Management
const GEMINI_API_KEY_STORAGE_KEY = 'geminiApiKey';

ipcMain.handle('get-gemini-api-key', async () => {
  try {
    const encryptedKey = store.get(GEMINI_API_KEY_STORAGE_KEY);
    if (encryptedKey && safeStorage.isEncryptionAvailable()) {
      const decryptedKey = safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
      return decryptedKey;
    }
  } catch (error) {
    console.error('IPC Main: Error getting/decrypting Gemini API key:', error);
    return null;
  }
  return null;
});

ipcMain.handle('set-gemini-api-key', async (event, apiKey) => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('IPC Main: Encryption is not available. Cannot securely store API key.');
    return { success: false, error: 'Encryption not available' };
  }
  if (typeof apiKey !== 'string') {
    console.error('IPC Main: Invalid API key provided for setting.');
    return { success: false, error: 'Invalid API key format' };
  }
  try {
    const encryptedKey = safeStorage.encryptString(apiKey).toString('base64');
    store.set(GEMINI_API_KEY_STORAGE_KEY, encryptedKey);
    return { success: true };
  } catch (error) {
    console.error('IPC Main: Error encrypting/setting Gemini API key:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-gemini-api-key', async () => {
  try {
    store.delete(GEMINI_API_KEY_STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('IPC Main: Error clearing Gemini API key:', error);
    return { success: false, error: error.message };
  }
});

// Handle sending chat message to Gemini
ipcMain.handle('send-chat-message', async (event, { userMessage, chatHistory }) => {
  console.log('IPC Main: Received chat message from renderer:', userMessage.substring(0,30));
  try {
    // It's better to call the handler directly if it's in the same process rather than invoking through IPC again.
    // However, to keep it simple and reuse the existing logic including decryption:
    const encryptedKey = store.get(GEMINI_API_KEY_STORAGE_KEY);
    let apiKey = null;
    if (encryptedKey && safeStorage.isEncryptionAvailable()) {
      try {
        apiKey = safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
      } catch (decryptionError) {
        console.error('IPC Main: Error decrypting API key for chat:', decryptionError);
        return { error: 'Failed to decrypt API key. Please re-enter it in Settings.' };
      }
    }

    if (!apiKey) {
      console.warn('IPC Main: Gemini API key not found or decryption failed for chat message.');
      return { error: 'API key not configured or unreadable. Please set/reset it in Settings.' };
    }

    const result = await sendChatMessageToGemini(apiKey, userMessage, chatHistory);
    return result; // This will be { text: 'response' } or { error: 'message' }

  } catch (error) {
    console.error('IPC Main: Error handling chat message:', error);
    return { error: 'Failed to send chat message in main process', details: error.message };
  }
});
