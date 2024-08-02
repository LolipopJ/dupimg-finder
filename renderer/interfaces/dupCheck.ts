import type { Stats } from "fs";

export interface DupCheckRes {
  path_a: string;
  path_b: string;
  sim: number;
}

export interface DupCheckResRecord extends DupCheckRes {
  key: string;
  fileA: Stats;
  fileB: Stats;
}
