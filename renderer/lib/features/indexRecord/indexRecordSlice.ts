import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { remove } from "lodash";

import { IndexRecord } from "../../../interfaces";
import { type RootState } from "../../store";

export interface IndexRecordState {
  value: IndexRecord[];
}

const initialState: IndexRecordState = { value: [] };

export const indexRecordSlice = createSlice({
  name: "indexRecord",
  initialState,
  reducers: {
    refreshIndexRecord: (state) => {
      state.value = window.efficientIRApi.getIndexDir().map((path) => ({
        path,
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
  },
});

export const { refreshIndexRecord, addIndexRecord, removeIndexRecord } =
  indexRecordSlice.actions;

export const indexRecord = (state: RootState) => state.indexRecord.value;

export default indexRecordSlice.reducer;
