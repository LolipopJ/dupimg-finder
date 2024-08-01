import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { remove } from "lodash";

import { IndexRecord } from "../../../interfaces";
import { type RootState } from "../../store";

export interface IndexRecordState {
  value: IndexRecord[];
}

const initialState: IndexRecordState = { value: [] };

const indexLastUpdatedKey = "index-state-last-updated";

export const indexRecordSlice = createSlice({
  name: "indexRecord",
  initialState,
  reducers: {
    refreshIndexRecord: (state) => {
      const indexLastUpdatedRecord =
        window.storeApi.getValue(indexLastUpdatedKey) ?? {};
      state.value = window.efficientIRApi.getIndexDir().map((path) => ({
        path,
        lastUpdated: indexLastUpdatedRecord[path] ?? "Never",
      }));
    },
    addIndexRecord: (state, action: PayloadAction<IndexRecord["path"][]>) => {
      window.efficientIRApi.addIndexDir(action.payload);
      state.value = state.value.concat(
        action.payload.map((path) => ({
          path,
        })),
      );
    },
    removeIndexRecord: (
      state,
      action: PayloadAction<IndexRecord["path"][]>,
    ) => {
      window.efficientIRApi.removeIndexDir(action.payload);
      remove(state.value, (record) => action.payload.includes(record.path));
    },
    updateIndexRecord: (
      state,
      /**
       * When passed parameter is of `Array` type, update target index records.
       * Otherwise, update all index records.
       */
      action: PayloadAction<IndexRecord["path"][] | undefined>,
    ) => {
      const currentDateTime = new Date().toLocaleString();
      const indexLastUpdatedRecord =
        window.storeApi.getValue(indexLastUpdatedKey) ?? {};

      const payload = action.payload;
      const isUpdateAllIndex = !Array.isArray(payload);
      if (isUpdateAllIndex) {
        window.efficientIRApi.updateAllIndex();
      } else {
        window.efficientIRApi.updateIndex(payload);
      }

      state.value = state.value.map((record) => {
        const path = record.path;
        if (isUpdateAllIndex || payload.includes(path)) {
          record.lastUpdated = currentDateTime;
          indexLastUpdatedRecord[path] = currentDateTime;
        }
        return record;
      });
      window.storeApi.setValue(indexLastUpdatedKey, indexLastUpdatedRecord);
    },
  },
});

export const {
  refreshIndexRecord,
  addIndexRecord,
  removeIndexRecord,
  updateIndexRecord,
} = indexRecordSlice.actions;

export const indexRecord = (state: RootState) => state.indexRecord.value;

export default indexRecordSlice.reducer;
