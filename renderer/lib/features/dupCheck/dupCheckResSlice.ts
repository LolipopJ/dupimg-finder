import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { DupCheckResRecord } from "../../../interfaces";
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
    updateDupCheckResRecord: (
      state,
      action: PayloadAction<DupCheckResRecord>,
    ) => {
      const targetRecordIndex = state.value.findIndex(
        (record) =>
          record.path_a === action.payload.path_a &&
          record.path_b === action.payload.path_b,
      );
      state.value[targetRecordIndex] = action.payload;
    },
  },
});

export const { setDupCheckResValue, updateDupCheckResRecord } =
  dupCheckResSlice.actions;

export const dupCheckRes = (state: RootState) => state.dupCheckRes.value;

export default dupCheckResSlice.reducer;
