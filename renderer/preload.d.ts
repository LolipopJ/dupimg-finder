import type { EfficientIRApi, ElectronApi, IpcHandler } from "../main/preload";

declare global {
  interface Window {
    ipc: IpcHandler;
    electronApi: ElectronApi;
    efficientIRApi: EfficientIRApi;
  }
}
