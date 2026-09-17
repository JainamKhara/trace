const { app, BrowserWindow, protocol, net } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    title: "TRACE - Threat Reconnaissance & Analytics Engine",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadURL("app://-/index.html");
  }
}

app.whenReady().then(() => {
  protocol.handle("app", (request) => {
    try {
      const parsedUrl = new URL(request.url);
      let pathname = decodeURIComponent(parsedUrl.pathname);

      if (pathname === "/" || pathname === "") {
        pathname = "/index.html";
      }

      let filePath = path.join(__dirname, "../out", pathname);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      } else if (!fs.existsSync(filePath) && !path.extname(filePath)) {
        const tryIndex = path.join(filePath, "index.html");
        const tryHtml = filePath + ".html";
        if (fs.existsSync(tryIndex)) {
          filePath = tryIndex;
        } else if (fs.existsSync(tryHtml)) {
          filePath = tryHtml;
        }
      }

      return net.fetch(url.pathToFileURL(filePath).toString());
    } catch (err) {
      console.error("Protocol handler error:", err);
      return new Response("Not found", { status: 404 });
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});