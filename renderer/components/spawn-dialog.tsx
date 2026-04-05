import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Button, Modal, Popconfirm } from "antd";
import { useEffect, useRef, useState } from "react";

import { SpawnEvents } from "../enums";
import type { SpawnOptions } from "../interfaces";
import { cancelProcess } from "../lib/features/config/configSlice";
import { useAppDispatch } from "../lib/hooks";

const SPAWN_LOG_MAX_LENGTH = 2000;

export const SpawnDialog = ({ showTimer = true }: { showTimer?: boolean }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [cancelable, setStoppable] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>("Spawn log");
  const [dialogContent, setDialogContent] = useState<string>("");
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const cleanupSpawnStarted = window.ipc.on(
      SpawnEvents.SPAWN_STARTED,
      // @ts-expect-error: override using defined types
      (options: SpawnOptions) => {
        setLoading(true);
        setError(false);
        setStoppable(!!options.cancelable);
        setDialogTitle(options.title);
        setDialogContent("");
        setOpen(true);
        if (showTimer) {
          const start = Date.now();
          startTimeRef.current = start;
          setElapsedMs(0);
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
          }
          intervalRef.current = window.setInterval(() => {
            const s = startTimeRef.current ?? start;
            setElapsedMs(Date.now() - s);
          }, 500);
        } else {
          startTimeRef.current = null;
          setElapsedMs(0);
        }
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
        if (intervalRef.current) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const start = startTimeRef.current;
        if (start) {
          setElapsedMs(Date.now() - start);
          startTimeRef.current = null;
        }
      },
    );

    return () => {
      cleanupSpawnStarted();
      cleanupSpawnStdout();
      cleanupSpawnStderr();
      cleanupSpawnFinished();
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showTimer]);

  const onClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const onStop = () => {
    if (loading) {
      dispatch(cancelProcess());
      setLoading(false);
      setError(true);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimeRef.current = null;
    }
  };

  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <Modal
      title={
        <div
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
          {showTimer ? (
            <span className="ml-2 font-mono text-sm text-stone-300">
              {formatElapsed(elapsedMs)}
            </span>
          ) : null}
          {cancelable ? (
            <Popconfirm
              title="Are you sure to cancel the process?"
              onConfirm={onStop}
            >
              <Button
                className="ml-4"
                size="small"
                type="link"
                danger
                disabled={!loading}
              >
                {loading ? "CANCEL" : error ? "CANCELED" : "FULFILLED"}
              </Button>
            </Popconfirm>
          ) : null}
        </div>
      }
      className={`spawn-modal ${loading ? "spawn-modal--loading" : error ? "spawn-modal--error" : "spawn-modal--success"}`}
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
