import "../styles/globals.css";

import { ConfigProvider } from "antd";
import type { AppProps } from "next/app";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

import { refreshIndexRecord } from "../lib/features/indexRecord/indexRecordSlice";
import { AppStore, makeStore } from "../lib/store";
import theme from "../themes/themeConfig";

function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    storeRef.current?.dispatch(refreshIndexRecord());
  }, []);

  return <Provider store={storeRef.current}>{children}</Provider>;
}

function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider theme={theme}>
      <StoreProvider>
        <Component {...pageProps} />
      </StoreProvider>
    </ConfigProvider>
  );
}

export default App;
