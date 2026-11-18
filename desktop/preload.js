// Puente mínimo y seguro entre la ventana de configuración y el proceso principal.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('configuracion', {
  datos: () => ipcRenderer.invoke('config:datos'),
  guardar: (datos) => ipcRenderer.invoke('config:guardar', datos),
});
