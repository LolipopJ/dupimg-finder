import type {
  EfficientIRApi,
  ElectronApi,
  Ipc,
  StoreApi,
} from "../main/preload";

declare global {
  interface Window {
    ipc: Ipc;
    storeApi: StoreApi;
    electronApi: ElectronApi;
    efficientIRApi: EfficientIRApi;
  }
}
