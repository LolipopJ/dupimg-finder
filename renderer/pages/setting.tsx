import { GithubOutlined, LoadingOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, InputNumber, List } from "antd";
import axios from "axios";
import Head from "next/head";
import { useState } from "react";

import { DEFAULT_MAX_PROCESS, MIN_MAX_PROCESS } from "../constants";

interface SettingItem {
  label: React.ReactNode;
  description?: React.ReactNode;
  actions: React.ReactNode[];
}

interface GithubRelease {
  html_url: string;
  name: string;
}

export default function SettingPage() {
  const currentVersion = window.electronApi.getSoftwareVersion();
  const indexesSize = window.electronApi.getIndexesSize();

  const [maxProcess, setMaxProcess] = useState<number>(
    window.storeApi.getValue("max-process") ?? DEFAULT_MAX_PROCESS,
  );

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
    label: `Software version: ${currentVersion}`,
    description: latestRelease ? `Latest version: ${latestRelease.name}` : "-",
    actions: [
      <span key="updateSoftware">
        {getLatestReleaseLoading ? (
          <>
            <LoadingOutlined /> Checking update 🤔...
          </>
        ) : getLatestReleaseError ? (
          "Failed on checking update 🫠"
        ) : latestRelease?.name === currentVersion ? (
          "You are using the latest version 🥰"
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
        ? `Total size: ${(indexesSize / 1024 / 1024).toFixed(2)} MB`
        : "Get total size of indexes files failed 😶‍🌫️",
    actions: [
      <Button
        key="openIndexesDirectory"
        type="link"
        onClick={() => window.electronApi.openIndexesDirectory()}
        className="px-0"
      >
        Open directory
      </Button>,
    ],
  };

  const workersSetting: SettingItem = {
    label: "Max work processes",
    description: "Number of parallel processes used when updating indexes",
    actions: [
      <InputNumber
        key="maxProcess"
        min={MIN_MAX_PROCESS}
        step={1}
        precision={0}
        value={maxProcess}
        onChange={(value) => {
          const val = value ?? DEFAULT_MAX_PROCESS;
          setMaxProcess(val);
          window.storeApi.setValue("max-process", val);
        }}
      />,
    ],
  };

  return (
    <>
      <Head>
        <title>Setting - Duplicate Images Finder</title>
      </Head>
      <div className="mx-auto flex h-full min-w-96 max-w-[960px] flex-col">
        <List<SettingItem>
          itemLayout="horizontal"
          dataSource={[versionSetting, workersSetting, indexesDirectorySetting]}
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
            className="transition-all hover:rotate-12"
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
