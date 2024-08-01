import { Modal } from "antd";
import { useEffect, useState } from "react";

import { SpawnEvents } from "../enums";
import type { SpawnOptions } from "../interfaces";

const SPAWN_LOG_MAX_LENGTH = 2000;

export const SpawnDialog = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogTitle, setDialogTitle] = useState<string>("Spawn log");
  const [dialogContent, setDialogContent] = useState<string>("");

  useEffect(() => {
    const cleanupSpawnStarted = window.ipc.on(
      SpawnEvents.SPAWN_STARTED,
      (options: SpawnOptions) => {
        setLoading(true);
        setDialogTitle(options.title);
        setDialogContent("");
        setOpen(true);
      },
    );
    const cleanupSpawnStdout = window.ipc.on(
      SpawnEvents.SPAWN_STDOUT,
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
      (code: string) => {
        setDialogContent((prevContent) => {
          return `Spawn closed with code: ${code}` + "\n" + prevContent;
        });
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
      open={open}
      title={dialogTitle}
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
