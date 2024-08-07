import type { FileStats } from "./file";

export interface SearchDupPairsRes {
  path_a: string;
  path_b: string;
  sim: number;
}

export interface SearchDupPairsResRecord extends SearchDupPairsRes {
  key: string;
  fileA: FileStats;
  fileB: FileStats;
}
