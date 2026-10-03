import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { EfficientIRConfig, IndexRecord } from "../../../interfaces";
import {
  deleteStoreRecordKeys,
  mergeStoreRecord,
} from "../../../utils/storeRecord";

const initialState = {
  config: {
    config_version: 1,
    img_size: 260,
    index_capacity: 1000000,
    combined_index_path: "",
    index_path: "",
    model_path: "",
    search_dir: [],
  } as EfficientIRConfig,
  indexRecord: [] as IndexRecord[],
  /** Dirs whose index update is currently in-flight, awaiting `SPAWN_FINISHED`. */
  pendingUpdateDirs: null as IndexRecord["path"][] | null,
};

const INDEX_LAST_UPDATED_KEY = "index-state-last-updated";

export interface UpdateIndexRecordPayload {
  dirs?: IndexRecord["path"][];
  checkMeta?: boolean;
}

export const configSlice = createSlice({
  name: "config",
  initialState: initialState,
  reducers: {
    refreshConfig: (state) => {
      const config = window.efficientIRApi.getConfig();
      const indexLastUpdatedRecord = window.storeApi.getValue(
        INDEX_LAST_UPDATED_KEY,
      );

      state.config = config;
      state.indexRecord = config.search_dir.map(
        (path) =>
          ({
            path,
            lastUpdated: indexLastUpdatedRecord[path],
          }) as IndexRecord,
      );
    },
    addIndexRecord: (state, action: PayloadAction<string[]>) => {
      state.config = {
        ...state.config,
        search_dir: state.config.search_dir.concat(action.payload),
      };
      state.indexRecord = state.indexRecord.concat(
        action.payload.map(
          (path) =>
            ({
              path,
              lastUpdated: undefined,
            }) as IndexRecord,
        ),
      );
      window.efficientIRApi.updateConfig(
        JSON.parse(JSON.stringify(state.config)),
      );
    },
    removeIndexRecord: (state, action: PayloadAction<string[]>) => {
      state.config = {
        ...state.config,
        search_dir: state.config.search_dir.filter(
          (path) => !action.payload.includes(path),
        ),
      };
      state.indexRecord = state.indexRecord.filter(
        (record) => !action.payload.includes(record.path),
      );
      window.efficientIRApi.updateConfig(
        JSON.parse(JSON.stringify(state.config)),
      );

      deleteStoreRecordKeys(INDEX_LAST_UPDATED_KEY, action.payload);
    },
    /**
     * Requests an index update for `dirs` (or all indexed dirs when omitted).
     * `lastUpdated` is only committed once `resolveIndexUpdate` is dispatched
     * in response to a successful `SPAWN_FINISHED`.
     */
    requestIndexUpdate: (
      state,
      action: PayloadAction<UpdateIndexRecordPayload>,
    ) => {
      const { dirs = [], checkMeta = false } = action.payload;
      const isUpdateAllIndex = dirs.length === 0;
      if (isUpdateAllIndex) {
        window.efficientIRApi.updateAllIndex({ checkMeta });
      } else {
        window.efficientIRApi.updateIndex(dirs, { checkMeta });
      }

      state.pendingUpdateDirs = isUpdateAllIndex
        ? state.indexRecord.map((record) => record.path)
        : dirs;
    },
    /** Commits pending dirs as updated. Call only after a successful `SPAWN_FINISHED`. */
    resolveIndexUpdate: (state) => {
      const pendingDirs = state.pendingUpdateDirs ?? [];
      if (pendingDirs.length === 0) return;

      const currentDateLocaleString = new Date().toLocaleString();
      const updates = Object.fromEntries(
        pendingDirs.map((path) => [path, currentDateLocaleString]),
      );
      mergeStoreRecord(INDEX_LAST_UPDATED_KEY, updates);

      state.indexRecord = state.indexRecord.map((record) =>
        pendingDirs.includes(record.path)
          ? { ...record, lastUpdated: currentDateLocaleString }
          : record,
      );
      state.pendingUpdateDirs = null;
    },
    /** Discards pending update tracking after a failed/cancelled `SPAWN_FINISHED`. */
    rejectIndexUpdate: (state) => {
      state.pendingUpdateDirs = null;
    },
    clearIndexUpdateHistory: (state) => {
      window.storeApi.setValue(INDEX_LAST_UPDATED_KEY, {});
      state.indexRecord = state.indexRecord.map((record) => ({
        ...record,
        lastUpdated: undefined,
      }));
      state.pendingUpdateDirs = null;
    },
    cancelProcess: () => {
      window.efficientIRApi.cancelProcess();
    },
  },
});

export const {
  refreshConfig,
  addIndexRecord,
  removeIndexRecord,
  requestIndexUpdate,
  resolveIndexUpdate,
  rejectIndexUpdate,
  clearIndexUpdateHistory,
  cancelProcess,
} = configSlice.actions;

export default configSlice.reducer;
