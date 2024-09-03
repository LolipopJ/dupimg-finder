import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { merge } from "lodash";

import { FileStats, SearchDupPairsResRecord } from "../../../interfaces";

export interface IndexRecordState {
  value: SearchDupPairsResRecord[];
  ignored: Record<string, Record<string, boolean>>;
}

const initialState: IndexRecordState = { value: [], ignored: {} };

const IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY = "ignored-search-dup-pairs-records";

export const searchDupPairsResSlice = createSlice({
  name: "searchDupPairsRes",
  initialState,
  reducers: {
    setSearchDupPairsResValue: (
      state,
      action: PayloadAction<SearchDupPairsResRecord[]>,
    ) => {
      state.value = action.payload;
    },
    updateSearchDupPairsResFileStats: (
      state,
      action: PayloadAction<{ path: string; stats: Partial<FileStats> }>,
    ) => {
      const { path, stats } = action.payload;
      for (const record of state.value) {
        if (record.path_a === path) merge(record.fileA, stats);
        if (record.path_b === path) merge(record.fileB, stats);
      }
    },
    refreshIgnoredRecords: (state) => {
      const ignored: IndexRecordState["ignored"] =
        window.storeApi.getValue(IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY) ?? {};

      for (const pathA in ignored) {
        for (const pathB in ignored[pathA]) {
          if (!ignored[pathA][pathB]) {
            delete ignored[pathA][pathB];
          }
        }

        if (Object.keys(ignored[pathA]).length === 0) {
          delete ignored[pathA];
        }
      }

      state.ignored = ignored;
    },
    addIgnoredRecord: (
      state,
      action: PayloadAction<{ pathA: string; pathB: string }>,
    ) => {
      const ignored: IndexRecordState["ignored"] =
        window.storeApi.getValue(IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY) ?? {};
      const { pathA, pathB } = action.payload;

      if (!ignored[pathA]) {
        ignored[pathA] = {};
      }
      ignored[pathA][pathB] = true;

      if (!ignored[pathB]) {
        ignored[pathB] = {};
      }
      ignored[pathB][pathA] = true;

      window.storeApi.setValue(IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY, ignored);
      state.ignored = ignored;
    },
    removeIgnoredRecord: (
      state,
      action: PayloadAction<{ pathA: string; pathB: string }>,
    ) => {
      const ignored: IndexRecordState["ignored"] =
        window.storeApi.getValue(IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY) ?? {};
      const { pathA, pathB } = action.payload;

      ignored[pathA][pathB] = false;
      ignored[pathB][pathA] = false;

      window.storeApi.setValue(IGNORED_SEARCH_DUP_PAIRS_RECORDS_KEY, ignored);
      state.ignored = ignored;
    },
  },
});

export const {
  setSearchDupPairsResValue,
  updateSearchDupPairsResFileStats,
  refreshIgnoredRecords,
  addIgnoredRecord,
  removeIgnoredRecord,
} = searchDupPairsResSlice.actions;

export default searchDupPairsResSlice.reducer;
