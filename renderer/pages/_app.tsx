import "../styles/globals.css";

import {
  ConfigProvider as AntdConfigProvider,
  Layout,
  Menu,
  type MenuProps,
  Spin,
} from "antd";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { CSSTransition, SwitchTransition } from "react-transition-group";

import SpawnDialog from "../components/spawn-dialog";
import { refreshIndexRecord } from "../lib/features/indexRecord/indexRecordSlice";
import { refreshIgnoredRecords } from "../lib/features/searchDupPairs/searchDupPairsResSlice";
import { AppStore, makeStore } from "../lib/store";
import theme from "../themes/themeConfig";

type MenuItem = Required<MenuProps>["items"][number];

const getItem = (
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
) => {
  return {
    key,
    icon,
    children,
    label,
  } as NonNullable<MenuItem>;
};

const menuItems = [
  getItem(<Link href="/home">Home</Link>, "/home"),
  getItem(<Link href="/search">Search</Link>, "/search"),
  getItem(<Link href="/search-target">Search Target</Link>, "/search-target"),
];

function StoreProvider({
  children,
  onLoaded,
}: {
  children: React.ReactNode;
  onLoaded?: () => void;
}) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore();
  }

  useEffect(() => {
    storeRef.current?.dispatch(refreshIndexRecord());
    storeRef.current?.dispatch(refreshIgnoredRecords());
    onLoaded?.();
  }, [onLoaded]);

  return <Provider store={storeRef.current}>{children}</Provider>;
}

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pathname = router.pathname;

  const [loadingState, setLoadingState] = useState<"loading" | "loaded">(
    "loading",
  );
  const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setMenuSelectedKeys([
      String(
        menuItems.find((menuItem) => String(menuItem.key) === pathname)?.key,
      ),
    ]);
  }, [pathname]);

  const onStoreLoaded = useCallback(() => {
    setLoadingState("loaded");
  }, []);

  return (
    <StoreProvider onLoaded={onStoreLoaded}>
      <AntdConfigProvider theme={theme}>
        <SwitchTransition mode="in-out">
          <CSSTransition
            key={loadingState}
            timeout={300}
            classNames="root-layout"
          >
            {loadingState === "loading" ? (
              <Spin tip="Preparing for you..." fullscreen />
            ) : (
              <Layout className="h-screen">
                <Layout.Sider>
                  <Menu
                    items={menuItems}
                    selectedKeys={menuSelectedKeys}
                    theme="dark"
                    mode="inline"
                    className="h-full"
                  />
                </Layout.Sider>

                <Layout className="overflow-auto">
                  <Layout.Content className="p-6">
                    <SwitchTransition mode="out-in">
                      <CSSTransition
                        key={pathname}
                        timeout={150}
                        classNames="route-page"
                      >
                        <Component {...pageProps} />
                      </CSSTransition>
                    </SwitchTransition>
                  </Layout.Content>
                </Layout>

                <SpawnDialog />
              </Layout>
            )}
          </CSSTransition>
        </SwitchTransition>
      </AntdConfigProvider>
    </StoreProvider>
  );
}

export default App;
