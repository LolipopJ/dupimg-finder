import type { Stats } from "fs";

export interface DupCheckRes {
  path_a: string;
  path_b: string;
  sim: number;
}

export interface FileStats extends Partial<Stats> {
  isDeleted?: boolean;
}

export interface DupCheckResRecord extends DupCheckRes {
  key: string;
  fileA: FileStats;
  fileB: FileStats;
}
