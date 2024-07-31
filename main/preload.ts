import { execSync } from "child_process";
import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  type OpenDialogReturnValue,
} from "electron";
import iconv from "iconv-lite";
import path from "path";

import { IndexRecord } from "../renderer/interfaces";
import { DialogEvents } from "./enums";

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

const electronApi = {
  selectDirectory: () =>
    ipcRenderer.invoke(
      DialogEvents.OPEN_DIRECTORY,
    ) as Promise<OpenDialogReturnValue>,
};

const efficientIRBinaryPath = path.resolve(
  "EfficientIR/dist/EfficientIR_nogui",
  process.platform === "win32" ? "EfficientIR.exe" : "EfficientIR",
);
const execEncoding = process.platform === "win32" ? "cp936" : "utf-8";

const runExecSync = (cmd: string) => {
  try {
    const res = execSync(cmd, { encoding: "binary" });
    return iconv.decode(Buffer.from(res, "binary"), execEncoding);
  } catch (error) {
    console.error(error);
    return "";
  }
};

const efficientIRApi = {
  addIndexDir: (indexDir: IndexRecord["path"][]) => {
    const execParams = indexDir
      .map((dir) => `--add_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${efficientIRBinaryPath} ${execParams}`);
  },
  removeIndexDir: (indexDir: IndexRecord["path"][]) => {
    const execParams = indexDir
      .map((dir) => `--remove_index_dir ${dir}`)
      .join(" ");
    runExecSync(`${efficientIRBinaryPath} ${execParams}`);
  },
  getIndexDir: () => {
    return JSON.parse(
      runExecSync(`${efficientIRBinaryPath} --get_index_dir`),
    ) as IndexRecord["path"][];
  },
};

contextBridge.exposeInMainWorld("ipc", handler);
contextBridge.exposeInMainWorld("electronApi", electronApi);
contextBridge.exposeInMainWorld("efficientIRApi", efficientIRApi);

export type IpcHandler = typeof handler;
export type ElectronApi = typeof electronApi;
export type EfficientIRApi = typeof efficientIRApi;
