import "../styles/globals.css";

import {
  ConfigProvider as AntdConfigProvider,
  Layout,
  Menu,
  type MenuProps,
} from "antd";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";

import SpawnDialog from "../components/spawnDialog";
import { refreshIndexRecord } from "../lib/features/indexRecord/indexRecordSlice";
import { AppStore, makeStore } from "../lib/store";
import theme from "../themes/themeConfig";

type MenuItem = Required<MenuProps>["items"][number];

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
];

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const [menuSelectedKeys, setMenuSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setMenuSelectedKeys([
      String(
        menuItems.find((menuItem) => String(menuItem.key) === pathname)?.key,
      ),
    ]);
  }, [pathname]);

  return (
    <AntdConfigProvider theme={theme}>
      <StoreProvider>
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
              <Component {...pageProps} />
            </Layout.Content>
          </Layout>
        </Layout>
      </StoreProvider>
      <SpawnDialog />
    </AntdConfigProvider>
  );
}

export default App;
