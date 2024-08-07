import { configureStore } from "@reduxjs/toolkit";

import indexRecordSlice from "./features/indexRecord/indexRecordSlice";
import searchDupResSlice from "./features/searchDup/searchDupResSlice";
import searchDupPairsResSlice from "./features/searchDupPairs/searchDupPairsResSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      indexRecord: indexRecordSlice,
      searchDupPairsRes: searchDupPairsResSlice,
      searchDupRes: searchDupResSlice,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
  });

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export default makeStore;
