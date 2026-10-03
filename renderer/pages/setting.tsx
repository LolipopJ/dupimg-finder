import { GithubOutlined, LoadingOutlined } from "@ant-design/icons";
import { useRequest } from "ahooks";
import { Button, InputNumber, List, message, Modal } from "antd";
import axios from "axios";
import Head from "next/head";
import { useEffect, useState } from "react";

import { DEFAULT_MAX_PROCESS, MIN_MAX_PROCESS } from "../constants";
import { clearIndexUpdateHistory } from "../lib/features/config/configSlice";
import { useAppDispatch } from "../lib/hooks";

const DELETE_INDEXES_COUNTDOWN_SECONDS = 5;

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
  const [currentVersion] = useState<string>(
    () => window.electronApi.getSoftwareVersion() ?? "",
  );
  const [indexesSize, setIndexesSize] = useState<number>(
    () => window.electronApi.getIndexesSize() ?? 0,
  );
  const [maxProcess, setMaxProcess] = useState<number>(
    () => window.storeApi.getValue("max-process") ?? DEFAULT_MAX_PROCESS,
  );
  const [deleteIndexesOpen, setDeleteIndexesOpen] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(
    DELETE_INDEXES_COUNTDOWN_SECONDS,
  );
  const [deletingIndexes, setDeletingIndexes] = useState(false);
  const [messageApi, messageContextHolder] = message.useMessage();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!deleteIndexesOpen || deleteCountdown === 0) return;
    const timer = window.setTimeout(() => {
      setDeleteCountdown((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [deleteIndexesOpen, deleteCountdown]);

  const onDeleteIndexes = async () => {
    if (!deleteIndexesOpen || deleteCountdown > 0 || deletingIndexes) return;
    setDeletingIndexes(true);
    try {
      const error = await window.electronApi.deleteIndexes();
      if (error) throw new Error(error);
      dispatch(clearIndexUpdateHistory());
      setDeleteIndexesOpen(false);
      messageApi.success(
        "Indexes deleted. Update indexes before searching again.",
      );
    } catch (error) {
      messageApi.error(`Failed to delete indexes: ${String(error)}`);
    } finally {
      setIndexesSize(window.electronApi.getIndexesSize());
      setDeletingIndexes(false);
    }
  };

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
    description: `Total size: ${(indexesSize / 1024 / 1024).toFixed(2)} MB`,
    actions: [
      <Button
        key="openIndexesDirectory"
        type="link"
        onClick={() => window.electronApi.openIndexesDirectory()}
        className="px-0"
      >
        Open directory
      </Button>,
      <Button
        key="deleteIndexes"
        type="link"
        danger
        disabled={deletingIndexes}
        onClick={() => {
          setDeleteCountdown(DELETE_INDEXES_COUNTDOWN_SECONDS);
          setDeleteIndexesOpen(true);
        }}
        className="px-0"
      >
        Delete indexes
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
      {messageContextHolder}
      <Head>
        <title>Setting - Duplicate Images Finder</title>
      </Head>
      <Modal
        title="Delete all indexes?"
        open={deleteIndexesOpen}
        onOk={onDeleteIndexes}
        onCancel={() => {
          if (!deletingIndexes) setDeleteIndexesOpen(false);
        }}
        okText={
          deleteCountdown > 0
            ? `Delete indexes (${deleteCountdown}s)`
            : "Delete indexes"
        }
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          disabled: deleteCountdown > 0 || deletingIndexes,
        }}
        confirmLoading={deletingIndexes}
        cancelButtonProps={{ disabled: deletingIndexes }}
        closable={!deletingIndexes}
        maskClosable={!deletingIndexes}
        keyboard={!deletingIndexes}
      >
        <p>
          This will permanently delete index.bin and combined_index.json from
          the application&apos;s index directory. Your images and configured
          directories will be kept.
        </p>
        <p className="mt-2">
          You will need to update indexes before searching again. Please wait
          five seconds before confirming.
        </p>
      </Modal>
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
