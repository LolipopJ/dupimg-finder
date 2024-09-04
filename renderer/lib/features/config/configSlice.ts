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
      action: PayloadAction<IndexRecord["path"][] | undefined>,
    ) => {
      const currentDateLocaleString = new Date().toLocaleString();
      const indexLastUpdatedRecord =
        window.storeApi.getValue(INDEX_LAST_UPDATED_KEY) ?? {};

      const payload = action.payload;
      const isUpdateAllIndex = !Array.isArray(payload);
      if (isUpdateAllIndex) {
        window.efficientIRApi.updateAllIndex();
      } else {
        window.efficientIRApi.updateIndex(payload);
      }

      state.indexRecord = state.indexRecord.map((record) => {
        const path = record.path;
        if (isUpdateAllIndex || payload.includes(path)) {
          record.lastUpdated = currentDateLocaleString;
          indexLastUpdatedRecord[path] = currentDateLocaleString;
        }
        return record;
      });
      window.storeApi.setValue(INDEX_LAST_UPDATED_KEY, indexLastUpdatedRecord);
    },
  },
});

export const {
  refreshConfig,
  addIndexRecord,
  removeIndexRecord,
  updateIndexRecord,
} = configSlice.actions;

export default configSlice.reducer;
