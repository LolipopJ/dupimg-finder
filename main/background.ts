import { app, dialog, ipcMain, net, protocol, shell } from "electron";
import serve from "electron-serve";
import Store from "electron-store";
import path from "path";

import { EFFICIENTIR_BINARY_PATH, IMAGE_EXTENSIONS } from "./constants";
import { EfficientIREvents, ElectronEvents, StoreEvents } from "./enums";
import {
  createWindow,
  getEfficientIRConfig,
  getEfficientIRConfigFilePath,
  runSpawn,
  updateEfficientIRConfig,
} from "./helpers";

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
const efficientIRConfigPath = getEfficientIRConfigFilePath();

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

  ipcMain.handle(ElectronEvents.SELECT_DIRECTORY, async () => {
    return await dialog.showOpenDialog({ properties: ["openDirectory"] });
  });

  ipcMain.handle(ElectronEvents.SELECT_IMAGE, async () => {
    return await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "images", extensions: IMAGE_EXTENSIONS }],
    });
  });

  ipcMain.handle(ElectronEvents.OPEN_FILE, async (_, path) => {
    return await shell.openPath(path);
  });

  ipcMain.on(ElectronEvents.REVEAL_FILE, (event, path) => {
    try {
      shell.showItemInFolder(path);
      event.returnValue = "";
    } catch (error) {
      event.returnValue = String(error);
    }
  });

  ipcMain.handle(ElectronEvents.DELETE_FILE, async (_, path) => {
    try {
      await shell.trashItem(path);
      return "";
    } catch (error) {
      return String(error);
    }
  });

  ipcMain.on(EfficientIREvents.GET_CONFIG, (event) => {
    event.returnValue = getEfficientIRConfig();
  });

  ipcMain.on(EfficientIREvents.UPDATE_CONFIG, (_, newConfig) => {
    updateEfficientIRConfig(newConfig);
  });

  ipcMain.on(EfficientIREvents.UPDATE_INDEX, (_, args) => {
    runSpawn(
      EFFICIENTIR_BINARY_PATH,
      [...args, ...["--config_path", efficientIRConfigPath]],
      mainWindow,
      {
        key: EfficientIREvents.UPDATE_INDEX,
        title: "Update Index",
        pipe: "stderr",
      },
    );
  });

  ipcMain.on(EfficientIREvents.UPDATE_ALL_INDEX, (_, args) => {
    runSpawn(
      EFFICIENTIR_BINARY_PATH,
      [...args, ...["--config_path", efficientIRConfigPath]],
      mainWindow,
      {
        key: EfficientIREvents.UPDATE_ALL_INDEX,
        title: "Update All Index",
        pipe: "stderr",
      },
    );
  });

  ipcMain.on(EfficientIREvents.SEARCH_DUP_PAIRS, (_, args) => {
    runSpawn(
      EFFICIENTIR_BINARY_PATH,
      [...args, ...["--config_path", efficientIRConfigPath]],
      mainWindow,
      {
        key: EfficientIREvents.SEARCH_DUP_PAIRS,
        title: "Search Duplicate Images",
        pipe: "stderr",
      },
    );
  });

  ipcMain.on(EfficientIREvents.SEARCH_DUP_IMG_OF_TARGET, (_, args) => {
    runSpawn(
      EFFICIENTIR_BINARY_PATH,
      [...args, ...["--config_path", efficientIRConfigPath]],
      mainWindow,
      {
        key: EfficientIREvents.SEARCH_DUP_IMG_OF_TARGET,
        title: "Search Duplicate Images of Target",
        pipe: "stderr",
      },
    );
  });
  //#endregion
})();
