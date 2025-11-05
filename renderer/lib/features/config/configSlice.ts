import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { EfficientIRConfig, IndexRecord } from "../../../interfaces";

const initialState = {
  config: {
    config_version: 1,
    img_size: 260,
    index_capacity: 1000000,
    metainfo_path: "",
    exists_index_path: "",
    index_path: "",
    model_path: "",
    search_dir: [],
  } as EfficientIRConfig,
  indexRecord: [] as IndexRecord[],
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
      const indexLastUpdatedRecord =
        window.storeApi.getValue(INDEX_LAST_UPDATED_KEY) ?? {};

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

      const indexLastUpdatedRecord =
        window.storeApi.getValue(INDEX_LAST_UPDATED_KEY) ?? {};
      action.payload.map((path) => {
        delete indexLastUpdatedRecord[path];
      });
      window.storeApi.setValue(INDEX_LAST_UPDATED_KEY, indexLastUpdatedRecord);
    },
    updateIndexRecord: (
      state,
      /**
       * When passed parameter is of `Array` type, update target index records.
       * Otherwise, update all index records.
       */
      action: PayloadAction<UpdateIndexRecordPayload>,
    ) => {
      const currentDateLocaleString = new Date().toLocaleString();
      const indexLastUpdatedRecord =
        window.storeApi.getValue(INDEX_LAST_UPDATED_KEY) ?? {};

      const { dirs = [], checkMeta = false } = action.payload;
      const isUpdateAllIndex = dirs.length === 0;
      if (isUpdateAllIndex) {
        window.efficientIRApi.updateAllIndex({ checkMeta });
      } else {
        window.efficientIRApi.updateIndex(dirs, { checkMeta });
      }

      state.indexRecord = state.indexRecord.map((record) => {
        const path = record.path;
        if (isUpdateAllIndex || dirs.includes(path)) {
          record.lastUpdated = currentDateLocaleString;
          indexLastUpdatedRecord[path] = currentDateLocaleString;
        }
        return record;
      });
      window.storeApi.setValue(INDEX_LAST_UPDATED_KEY, indexLastUpdatedRecord);
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
  updateIndexRecord,
  cancelProcess,
} = configSlice.actions;

export default configSlice.reducer;
