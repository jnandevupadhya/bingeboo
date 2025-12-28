const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  resize: (width, height) =>
    ipcRenderer.send("resize-window", { width, height }),

  close: () => ipcRenderer.send("window-close"),
  minimize: () => ipcRenderer.send("window-minimize"),
  exitDiscordFullscreen: () =>
    ipcRenderer.send("FOCUS_DISCORD_AND_EXIT_FULLSCREEN"),
  forceResize: () => ipcRenderer.send("window-reload"),
});
