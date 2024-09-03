import {
  contextBridge,
  ipcRenderer,
  type IpcRendererEvent,
  type OpenDialogReturnValue,
} from "electron";
import fs, { type Stats } from "fs";

import {
  DEFAULT_SEARCH_DUP_OPTIONS,
  DEFAULT_SEARCH_DUP_PAIRS_OPTIONS,
  EFFICIENTIR_BINARY_PATH,
} from "./constants";
import { EfficientIREvents, ElectronEvents, StoreEvents } from "./enums";
import { runExecSync } from "./helpers/child-process";
import type { SearchDupOptions, SearchDupPairsOptions } from "./interfaces";

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

//#region
const fileStatsCache: Record<string, Stats | null> = {};

const nodeApi = {
  getFilesStats: (paths: string[]): (Stats | null)[] => {
    return paths.map((path) => {
      try {
        if (fileStatsCache[path]) {
          return fileStatsCache[path];
        }

        const fileStats = fs.statSync(path);
        fileStatsCache[path] = fileStats;

        return fileStats;
      } catch (error) {
        console.warn(`Get stats of file \`${path}\` failed:`, error);
        return null;
      }
    });
  },
  updateFileStatsCache: (path: string, stats: Stats | null) => {
    fileStatsCache[path] = stats;
  },
};
//#endregion

//#region ElectronApi
const electronApi = {
  selectDirectory: () =>
    ipcRenderer.invoke(
      ElectronEvents.SELECT_DIRECTORY,
    ) as Promise<OpenDialogReturnValue>,
  selectImage: () =>
    ipcRenderer.invoke(
      ElectronEvents.SELECT_IMAGE,
    ) as Promise<OpenDialogReturnValue>,
  openFile: (path: string) =>
    ipcRenderer.invoke(ElectronEvents.OPEN_FILE, path) as Promise<string>,
};
//#endregion

//#region EfficientIRApi
const efficientIRApi = {
  addIndexDir: (indexDir: string[]) => {
    const execParams = indexDir
      .map((dir) => `--add_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${EFFICIENTIR_BINARY_PATH} ${execParams}`);
  },
  removeIndexDir: (indexDir: string[]) => {
    const execParams = indexDir
      .map((dir) => `--remove_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${EFFICIENTIR_BINARY_PATH} ${execParams}`);
  },
  getIndexDir: () => {
    return JSON.parse(
      runExecSync(`${EFFICIENTIR_BINARY_PATH} --get_index_dir`),
    ) as string[];
  },
  updateIndex: (indexDir: string[]) => {
    const args: string[] = [];
    indexDir.forEach((dir) => {
      args.push("--update_index_dir");
      args.push(dir);
    });
    ipcRenderer.send(EfficientIREvents.UPDATE_INDEX, args);
  },
  updateAllIndex: () => {
    ipcRenderer.send(EfficientIREvents.UPDATE_ALL_INDEX, ["--update_index"]);
  },
  searchDupPairs: (options?: SearchDupPairsOptions) => {
    const { threshold, sameDir } = options ?? DEFAULT_SEARCH_DUP_PAIRS_OPTIONS;
    ipcRenderer.send(EfficientIREvents.SEARCH_DUP_PAIRS, [
      "--search_index",
      ...(threshold ? ["--similarity_threshold", threshold] : []),
      ...(sameDir ? ["--same_dir"] : []),
    ]);
  },
  searchDupImgOfTarget: (path: string, options?: SearchDupOptions) => {
    const { matchN } = options ?? DEFAULT_SEARCH_DUP_OPTIONS;
    ipcRenderer.send(EfficientIREvents.SEARCH_DUP_IMG_OF_TARGET, [
      ...["--search_target", path],
      ...(matchN ? ["--match_n", matchN] : []),
    ]);
  },
};
//#endregion

contextBridge.exposeInMainWorld("ipc", ipc);
contextBridge.exposeInMainWorld("storeApi", storeApi);
contextBridge.exposeInMainWorld("nodeApi", nodeApi);
contextBridge.exposeInMainWorld("electronApi", electronApi);
contextBridge.exposeInMainWorld("efficientIRApi", efficientIRApi);

export type Ipc = typeof ipc;
export type StoreApi = typeof storeApi;
export type NodeApi = typeof nodeApi;
export type ElectronApi = typeof electronApi;
export type EfficientIRApi = typeof efficientIRApi;
