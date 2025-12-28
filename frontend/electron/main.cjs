const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { screen } = require("electron");
const { exec } = require("child_process");
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 300,
    height: 340,
    resizable: true,
    frame: false, // 🔥 removes title bar & borders
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true, // 👈 key line
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../src/assets/icon.png"),

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");

  if (!app.isPackaged) {
    win.loadURL("http://localhost:8080");
  } else {
    const indexPath = path.join(app.getAppPath(), "dist", "index.html");

    win.loadFile(indexPath);
  }
}

ipcMain.on("resize-window", (_, { width, height }) => {
  if (!win) return;

  win.setSize(width, height, true);
  moveToBottomRight();
});

ipcMain.on("window-close", () => {
  if (win) win.close();
});

ipcMain.on("window-minimize", () => {
  if (win) win.minimize();
});

ipcMain.on("window-reload", () => {
  if (win) {
    // win.hide();
    // win.show();
    // win.center();
    // win.setSize(300, 340, true);
    app.relaunch();
    app.exit(0);
  }
});

ipcMain.on("FOCUS_DISCORD_AND_EXIT_FULLSCREEN", () => {
  exec(`
powershell -NoProfile -Command "
Add-Type -AssemblyName System.Windows.Forms;
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport(\"user32.dll\")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);
}
'@
$p = Get-Process discord -ErrorAction SilentlyContinue |
     Where-Object { $_.MainWindowHandle -ne 0 } |
     Select-Object -First 1;
if ($p) {
  [Win32]::SetForegroundWindow($p.MainWindowHandle);
  Start-Sleep -Milliseconds 150;
  [System.Windows.Forms.SendKeys]::SendWait('{ESC}');
}
"
`);
});

function moveToBottomRight() {
  const { width, height } = win.getBounds();
  const { workArea } = screen.getPrimaryDisplay();

  const x = workArea.x + workArea.width - width - 50;
  const y = workArea.y + workArea.height - height - 50;

  win.setPosition(x, y, false);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
