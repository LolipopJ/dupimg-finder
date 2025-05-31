import { LoadingOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, List } from "antd";
import axios from "axios";
import Head from "next/head";

interface SettingItem {
  label: string;
  description?: string;
  actions: React.ReactNode[];
}

interface GithubRelease {
  html_url: string;
  name: string;
}

const currentVersion = window.electronApi.getSoftwareVersion();

export default function SettingPage() {
  const {
    data: latestRelease,
    loading: getLatestReleaseLoading,
    error: getLatestReleaseError,
  } = useRequest(async () => {
    return (
      await axios.get(
        "https://api.github.com/repos/lolipopj/dupimg-finder/releases/latest",
      )
    ).data as GithubRelease;
  });

  return (
    <>
      <Head>
        <title>Setting - Dupimg Finder</title>
      </Head>
      <div>
        <List<SettingItem>
          itemLayout="horizontal"
          dataSource={[
            {
              label: `软件版本：${currentVersion}`,
              description: latestRelease
                ? `最新版本：${latestRelease.name}`
                : "",
              actions: [
                getLatestReleaseLoading ? (
                  <>
                    <LoadingOutlined /> 正在检查中...
                  </>
                ) : getLatestReleaseError ? (
                  "检查更新失败"
                ) : latestRelease?.name === currentVersion ? (
                  "已是最新版本"
                ) : (
                  <Button
                    key="openReleasePage"
                    type="link"
                    onClick={() =>
                      window.electronApi.openExternalUrl(
                        latestRelease?.html_url ??
                          "https://github.com/LolipopJ/dupimg-finder/releases/latest",
                      )
                    }
                  >
                    前往更新
                  </Button>
                ),
              ],
            },
          ]}
          renderItem={(item) => (
            <List.Item actions={item.actions} className="mx-4 border-b-2">
              <List.Item.Meta
                title={item.label}
                description={item.description}
              />
            </List.Item>
          )}
          className="mx-auto min-w-64 max-w-[960px] rounded-lg border-2"
        />
      </div>
    </>
  );
}
