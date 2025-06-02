import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  downloadExtension: (savePath?: string) => ipcRenderer.invoke('download-extension', savePath),
  getExtensionInfo: () => ipcRenderer.invoke('get-extension-info'),
  onExtensionUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on('extension-updated', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('extension-updated');
    };
  }
});