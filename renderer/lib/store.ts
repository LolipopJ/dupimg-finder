import { configureStore } from "@reduxjs/toolkit";

import dupCheckResSlice from "./features/dupCheck/dupCheckResSlice";
import indexRecordSlice from "./features/indexRecord/indexRecordSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      indexRecord: indexRecordSlice,
      dupCheckRes: dupCheckResSlice,
    },
  });

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export default makeStore;
