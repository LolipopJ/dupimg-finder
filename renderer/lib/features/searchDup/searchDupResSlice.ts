import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { merge } from "lodash";

import { SearchDupResRecord } from "../../../interfaces";

export interface IndexRecordState {
  value: SearchDupResRecord[];
}

const initialState: IndexRecordState = { value: [] };

export const searchDupResSlice = createSlice({
  name: "searchDupRes",
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

export default searchDupResSlice.reducer;
