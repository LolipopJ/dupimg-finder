import {
  contextBridge,
  ipcRenderer,
  type IpcRendererEvent,
  type OpenDialogReturnValue,
} from "electron";
import path from "path";

import { EfficientIREvents, ElectronEvents, StoreEvents } from "./enums";
import { runExecSync } from "./helpers/child-process";

//#region IPC
const ipc = {
  send(channel: string, ...args: unknown[]) {
    ipcRenderer.send(channel, ...args);
  },
  on(channel: string, func: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  once(channel: string, func: (...args: unknown[]) => void) {
    ipcRenderer.once(channel, (_event, ...args) => func(...args));
  },
};
//#endregion

//#region Store
const storeApi = {
  setValue: (key: string, value: unknown) => {
    ipcRenderer.send(StoreEvents.SET_VALUE, key, value);
  },
  getValue: (key: string) => ipcRenderer.sendSync(StoreEvents.GET_VALUE, key),
};
//#endregion

//#region ElectronApi
const electronApi = {
  selectDirectory: () =>
    ipcRenderer.invoke(
      ElectronEvents.OPEN_DIRECTORY,
    ) as Promise<OpenDialogReturnValue>,
  openFile: (path: string) =>
    ipcRenderer.invoke(ElectronEvents.OPEN_FILE, path) as Promise<string>,
};
//#endregion

//#region EfficientIRApi
const efficientIRBinaryPath = path.resolve(
  "EfficientIR/dist/EfficientIR_nogui",
  process.platform === "win32" ? "EfficientIR.exe" : "EfficientIR",
);

const efficientIRApi = {
  addIndexDir: (indexDir: string[]) => {
    const execParams = indexDir
      .map((dir) => `--add_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${efficientIRBinaryPath} ${execParams}`);
  },
  removeIndexDir: (indexDir: string[]) => {
    const execParams = indexDir
      .map((dir) => `--remove_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${efficientIRBinaryPath} ${execParams}`);
  },
  getIndexDir: () => {
    return JSON.parse(
      runExecSync(`${efficientIRBinaryPath} --get_index_dir`),
    ) as string[];
  },
  updateIndex: (indexDir: string[]) => {
    const args: string[] = [];
    indexDir.forEach((dir) => {
      args.push("--update_index_dir");
      args.push(dir);
    });
    ipcRenderer.send(
      EfficientIREvents.UPDATE_INDEX,
      efficientIRBinaryPath,
      args,
    );
  },
  updateAllIndex: () => {
    ipcRenderer.send(
      EfficientIREvents.UPDATE_ALL_INDEX,
      efficientIRBinaryPath,
      ["--update_index"],
    );
  },
  searchDupImg: (options?: {
    /** 70 <= threshold <= 100 */
    threshold?: number;
    sameDir?: boolean;
  }) => {
    const { threshold = 98.5, sameDir = true } = options ?? {};
    ipcRenderer.send(EfficientIREvents.SEARCH_DUP_IMG, efficientIRBinaryPath, [
      "--search_index",
      "--search_index_similarity_threshold",
      threshold,
      sameDir ? "--search_index_same_dir" : "",
    ]);
  },
};
//#endregion

contextBridge.exposeInMainWorld("ipc", ipc);
contextBridge.exposeInMainWorld("storeApi", storeApi);
contextBridge.exposeInMainWorld("electronApi", electronApi);
contextBridge.exposeInMainWorld("efficientIRApi", efficientIRApi);

export type Ipc = typeof ipc;
export type StoreApi = typeof storeApi;
export type ElectronApi = typeof electronApi;
export type EfficientIRApi = typeof efficientIRApi;
