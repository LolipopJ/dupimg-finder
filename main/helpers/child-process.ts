import {
  type ChildProcess,
  execSync,
  spawn,
  type SpawnOptionsWithoutStdio as ChildProcessOptions,
} from "child_process";
import { type BrowserWindow } from "electron";
import iconv from "iconv-lite";

import { SpawnEvents } from "../enums";
import { SpawnOptions } from "../interfaces";

const execEncoding = "binary";
// Compatible with default command line encoding `cp936` on Windows platform
const iconvDecoding = process.platform === "win32" ? "cp936" : "utf-8";

// Tracks child processes started via `runSpawn` so they can be terminated
// when the app quits, avoiding orphaned processes.
const activeProcesses: Record<number, ChildProcess> = {};

export const hasActiveProcesses = () => Object.keys(activeProcesses).length > 0;

export const killActiveProcesses = () => {
  Object.keys(activeProcesses).forEach((pid) => {
    activeProcesses[Number(pid)].kill();
    delete activeProcesses[Number(pid)];
  });
};

export const runExecSync = (cmd: string) => {
  try {
    const res = execSync(cmd, { encoding: execEncoding });
    return iconv.decode(Buffer.from(res, execEncoding), iconvDecoding);
  } catch (error) {
    console.error(`An error occurred while executing \`${cmd}\`.\n${error}`);
    return String(error);
  }
};

export const runSpawn = (
  cmd: string,
  args: string[],
  browserWindow?: BrowserWindow,
  spawnOptions?: SpawnOptions,
  processOptions?: ChildProcessOptions,
) => {
  const process = spawn(cmd, args, processOptions ?? {});
  process.on("error", (error) => {
    console.error(`Failed to start ${cmd}:`, error);
  });
  if (process.pid !== undefined) {
    const pid = process.pid;
    activeProcesses[pid] = process;
    process.once("close", () => {
      delete activeProcesses[pid];
    });
  }

  if (browserWindow && spawnOptions) {
    browserWindow.webContents.send(SpawnEvents.SPAWN_STARTED, spawnOptions);

    process.stdout.on("data", (data) => {
      browserWindow.webContents.send(
        SpawnEvents.SPAWN_STDOUT,
        iconv.decode(Buffer.from(data, execEncoding), iconvDecoding),
        spawnOptions,
      );
    });

    process.stderr.on("data", (data) => {
      browserWindow.webContents.send(
        SpawnEvents.SPAWN_STDERR,
        iconv.decode(Buffer.from(data, execEncoding), iconvDecoding),
        spawnOptions,
      );
    });

    process.on("close", (code) => {
      browserWindow.webContents.send(
        SpawnEvents.SPAWN_FINISHED,
        code ?? 0,
        spawnOptions,
      );
    });
  }
  return process;
};
