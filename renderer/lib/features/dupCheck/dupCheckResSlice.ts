import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { merge } from "lodash";

import { DupCheckResRecord, FileStats } from "../../../interfaces";
import { type RootState } from "../../store";

export interface IndexRecordState {
  value: DupCheckResRecord[];
}

const initialState: IndexRecordState = { value: [] };

export const dupCheckResSlice = createSlice({
  name: "indexRecord",
  initialState,
  reducers: {
    setDupCheckResValue: (
      state,
      action: PayloadAction<DupCheckResRecord[]>,
    ) => {
      state.value = action.payload;
    },
    updateDupCheckResFileStats: (
      state,
      action: PayloadAction<{ path: string; stats: Partial<FileStats> }>,
    ) => {
      const { path, stats } = action.payload;
      for (const record of state.value) {
        if (record.path_a === path) merge(record.fileA, stats);
        if (record.path_b === path) merge(record.fileB, stats);
      }
    },
  },
});

export const { setDupCheckResValue, updateDupCheckResFileStats } =
  dupCheckResSlice.actions;

export const dupCheckRes = (state: RootState) => state.dupCheckRes.value;

export default dupCheckResSlice.reducer;
