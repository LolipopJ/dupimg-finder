import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Modal } from "antd";
import { useEffect, useState } from "react";

import { SpawnEvents } from "../enums";
import type { SpawnOptions } from "../interfaces";

const SPAWN_LOG_MAX_LENGTH = 2000;

export const SpawnDialog = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>("Spawn log");
  const [dialogContent, setDialogContent] = useState<string>("");

  useEffect(() => {
    const cleanupSpawnStarted = window.ipc.on(
      SpawnEvents.SPAWN_STARTED,
      // @ts-expect-error: override using defined types
      (options: SpawnOptions) => {
        setLoading(true);
        setError(false);
        setDialogTitle(options.title);
        setDialogContent("");
        setOpen(true);
      },
    );
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
      // @ts-expect-error: override using defined types
      (data: string, options: SpawnOptions) => {
        if (options.pipe !== "stderr") {
          setDialogContent((prevContent) => {
            if (options.receiveData === "replace") {
              return data;
            } else {
              return (data + "\n" + prevContent).substring(
                0,
                SPAWN_LOG_MAX_LENGTH,
              );
            }
          });
        }
      },
    );
    const cleanupSpawnStderr = window.ipc.on(
      SpawnEvents.SPAWN_STDERR,
      // @ts-expect-error: override using defined types
      (data: string, options: SpawnOptions) => {
        if (options.pipe !== "stdout") {
          setDialogContent((prevContent) => {
            if (options.receiveData === "replace") {
              return data;
            } else {
              return (data + "\n" + prevContent).substring(
                0,
                SPAWN_LOG_MAX_LENGTH,
              );
            }
          });
        }
      },
    );
    const cleanupSpawnFinished = window.ipc.on(
      SpawnEvents.SPAWN_FINISHED,
      // @ts-expect-error: override using defined types
      (code: number) => {
        setDialogContent((prevContent) => {
          return `Spawn closed with code: ${code}` + "\n" + prevContent;
        });
        if (code !== 0) setError(true);
        setLoading(false);
      },
    );

    return () => {
      cleanupSpawnStarted();
      cleanupSpawnStdout();
      cleanupSpawnStderr();
      cleanupSpawnFinished();
    };
  }, []);

  const onClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  return (
    <Modal
      title={
        <span
          className={`${loading ? "" : error ? "text-red-600" : "text-green-600"}`}
        >
          <span className="mr-2">
            {loading ? (
              <LoadingOutlined />
            ) : error ? (
              <CloseCircleOutlined />
            ) : (
              <CheckCircleOutlined />
            )}
          </span>
          {dialogTitle}
        </span>
      }
      className={`spawn-modal ${loading ? "" : error ? "spawn-modal--error" : "spawn-modal--success"}`}
      open={open}
      closable={!loading}
      maskClosable={!loading}
      onCancel={onClose}
      footer={null}
    >
      <div className="whitespace-pre-wrap rounded-md bg-gray-800 p-3 text-stone-100">
        {dialogContent}
      </div>
    </Modal>
  );
};

export default SpawnDialog;
