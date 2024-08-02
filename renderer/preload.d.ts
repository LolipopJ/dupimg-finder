import type {
  EfficientIRApi,
  ElectronApi,
  Ipc,
  NodeApi,
  StoreApi,
} from "../main/preload";

declare global {
  interface Window {
    ipc: Ipc;
    storeApi: StoreApi;
    nodeApi: NodeApi;
    electronApi: ElectronApi;
    efficientIRApi: EfficientIRApi;
  }
}
