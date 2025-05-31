import { GithubOutlined, LoadingOutlined } from "@ant-design/icons";
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

export default function SettingPage() {
  const currentVersion = window.electronApi.getSoftwareVersion();
  const indexesSize = window.electronApi.getIndexesSize();

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

  const versionSetting: SettingItem = {
    label: `Current version: ${currentVersion}`,
    description: latestRelease ? `Latest version: ${latestRelease.name}` : "",
    actions: [
      <span key="updateSoftware">
        {getLatestReleaseLoading ? (
          <>
            <LoadingOutlined /> Checking update...
          </>
        ) : getLatestReleaseError ? (
          "Failed on checking update"
        ) : latestRelease?.name === currentVersion ? (
          "Current is latest version"
        ) : (
          <Button
            type="link"
            onClick={() =>
              window.electronApi.openExternalUrl(
                latestRelease?.html_url ??
                  "https://github.com/LolipopJ/dupimg-finder/releases/latest",
              )
            }
            className="px-0"
          >
            Open release page
          </Button>
        )}
      </span>,
    ],
  };

  const indexesDirectorySetting: SettingItem = {
    label: "Indexes stats",
    description:
      indexesSize > 0
        ? `Size: ${(indexesSize / 1024 / 1024).toFixed(2)} MB`
        : "Get stats of indexes files failed",
    actions: [
      <Button
        key="openIndexesDirectory"
        type="link"
        onClick={() => window.electronApi.openIndexesDirectory()}
        className="px-0"
      >
        Open indexes directory
      </Button>,
    ],
  };

  return (
    <>
      <Head>
        <title>Setting - Dupimg Finder</title>
      </Head>
      <div className="flex h-full min-w-96 max-w-[960px] flex-col">
        <List<SettingItem>
          itemLayout="horizontal"
          dataSource={[versionSetting, indexesDirectorySetting]}
          renderItem={(item) => (
            <List.Item actions={item.actions} className="mx-4 border-b-2">
              <List.Item.Meta
                title={item.label}
                description={item.description}
              />
            </List.Item>
          )}
          className="mx-auto w-full rounded-lg border-2"
        />
        <div className="mt-auto flex items-center justify-center pt-8 text-4xl">
          <GithubOutlined
            onClick={() =>
              window.electronApi.openExternalUrl(
                "https://github.com/LolipopJ/dupimg-finder",
              )
            }
          />
        </div>
      </div>
    </>
  );
}
