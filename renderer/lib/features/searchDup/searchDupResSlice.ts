import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { merge } from "lodash";

import { SearchDupResRecord } from "../../../interfaces";
import { type RootState } from "../../store";

export interface IndexRecordState {
  value: SearchDupResRecord[];
}

const initialState: IndexRecordState = { value: [] };

export const searchDupResSlice = createSlice({
  name: "indexRecord",
  initialState,
  reducers: {
    setSearchDupResValue: (
      state,
      action: PayloadAction<SearchDupResRecord[]>,
    ) => {
      state.value = action.payload;
    },
    updateSearchDupResFileStats: (
      state,
      action: PayloadAction<{
        path: string;
        stats: Partial<SearchDupResRecord["file"]>;
      }>,
    ) => {
      const { path, stats } = action.payload;
      for (const record of state.value) {
        if (record.path === path) merge(record.file, stats);
      }
    },
  },
});

export const { setSearchDupResValue, updateSearchDupResFileStats } =
  searchDupResSlice.actions;

export const searchDupRes = (state: RootState) => state.searchDupRes.value;

export default searchDupResSlice.reducer;
