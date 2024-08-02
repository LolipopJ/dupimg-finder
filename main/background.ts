import { app, dialog, ipcMain, net, protocol, shell } from "electron";
import serve from "electron-serve";
import Store from "electron-store";
import path from "path";

import { EfficientIREvents, ElectronEvents, StoreEvents } from "./enums";
import { createWindow } from "./helpers";
import { runSpawn } from "./helpers/child-process";

const store = new Store();

protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  //#region custom protocols
  protocol.handle("media", (request) => {
    let mediaPath = request.url.slice("media://".length);
    if (process.platform === "win32") {
      mediaPath = mediaPath.replace("/", ":/");
    }
    return net.fetch(mediaPath);
  });
  //#endregion

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  //#region app events
  app.on("window-all-closed", () => {
    app.quit();
  });
  //#endregion

  //#region ipcMain events
  ipcMain.on(StoreEvents.SET_VALUE, (_, key, value) => {
    store.set(key, value);
  });

  ipcMain.on(StoreEvents.GET_VALUE, (event, key) => {
    event.returnValue = store.get(key);
  });

  ipcMain.handle(ElectronEvents.OPEN_DIRECTORY, async () => {
    return await dialog.showOpenDialog({ properties: ["openDirectory"] });
  });

  ipcMain.handle(ElectronEvents.OPEN_FILE, async (_, path) => {
    return await shell.openPath(path);
  });

  ipcMain.on(EfficientIREvents.UPDATE_INDEX, (_, binaryPath, args) => {
    runSpawn(binaryPath, args, mainWindow, {
      key: EfficientIREvents.UPDATE_INDEX,
      title: "Update index",
      pipe: "stderr",
    });
  });

  ipcMain.on(EfficientIREvents.UPDATE_ALL_INDEX, (_, binaryPath, args) => {
    runSpawn(binaryPath, args, mainWindow, {
      key: EfficientIREvents.UPDATE_ALL_INDEX,
      title: "Update all index",
      pipe: "stderr",
    });
  });

  ipcMain.on(EfficientIREvents.SEARCH_DUP_IMG, (_, binaryPath, args) => {
    runSpawn(binaryPath, args, mainWindow, {
      key: EfficientIREvents.SEARCH_DUP_IMG,
      title: "Search duplicate images",
      pipe: "stderr",
    });
  });
  //#endregion
})();
