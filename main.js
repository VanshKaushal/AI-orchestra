const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const isDev = require("electron-is-dev");

let mainWindow;
let backendProcess;

function startBackend() {
  console.log("🚀 Starting FastAPI backend...");
  
  // Use 'python' or your environment's python command
  // Improved robustness: Use python -m uvicorn
  const pythonCmd = process.platform === "win32" ? "python" : "python3";
  const args = ["-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "127.0.0.1"];

  backendProcess = spawn(pythonCmd, args, {
    cwd: process.cwd(),
    shell: true,
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend]: ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend Error]: ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Backend] process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // Create this later if needed
    },
    show: false, // Don't show until ready
  });

  const url = isDev 
    ? "http://localhost:3001" 
    : `file://${path.join(__dirname, "frontend", "out", "index.html")}`;

  mainWindow.loadURL(url);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startBackend();
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (backendProcess) {
    console.log("🛑 Killing backend process...");
    // On Windows, taskkill might be cleaner for child processes
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
    } else {
      backendProcess.kill();
    }
  }
});
