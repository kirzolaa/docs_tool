// Electron Preload Script
const { contextBridge, ipcRenderer } = require('electron');

console.log('Electron preload.js loaded, setting up contextBridge for electronAPI');

contextBridge.exposeInMainWorld('electronAPI', {
  search: async (query) => {
    try {
      console.log(`IPC Preload: Sending search query "${query}" to main.`);
      const results = await ipcRenderer.invoke('perform-search', query);
      console.log(`IPC Preload: Received results for "${query}":`, results);
      return results;
    } catch (error) {
      console.error('IPC Preload: Error invoking "perform-search":', error);
      return { error: 'IPC call failed from preload', details: error.message };
    }
  },
  openExternalPath: (filePath) => {
    if (filePath && typeof filePath === 'string') {
      console.log(`IPC Preload: Sending request to open external path: ${filePath}`);
      ipcRenderer.send('handle-open-external-path', filePath);
    } else {
      console.error('IPC Preload: Invalid filePath for openExternalPath:', filePath);
    }
  },
  getGeminiApiKey: async () => {
    try {
      return await ipcRenderer.invoke('get-gemini-api-key');
    } catch (error) {
      console.error('IPC Preload: Error invoking get-gemini-api-key:', error);
      return null;
    }
  },
  setGeminiApiKey: async (apiKey) => {
    try {
      return await ipcRenderer.invoke('set-gemini-api-key', apiKey);
    } catch (error) {
      console.error('IPC Preload: Error invoking set-gemini-api-key:', error);
      return { success: false, error: error.message };
    }
  },
  clearGeminiApiKey: async () => {
    try {
      return await ipcRenderer.invoke('clear-gemini-api-key');
    } catch (error) {
      console.error('IPC Preload: Error invoking clear-gemini-api-key:', error);
      return { success: false, error: error.message };
    }
  },
  sendChatMessage: async ({ userMessage, chatHistory }) => {
    try {
      console.log('IPC Preload: Sending chat message to main:', userMessage.substring(0,30));
      return await ipcRenderer.invoke('send-chat-message', { userMessage, chatHistory });
    } catch (error) {
      console.error('IPC Preload: Error invoking send-chat-message:', error);
      return { error: 'IPC call to send-chat-message failed from preload', details: error.message };
    }
  }
});
