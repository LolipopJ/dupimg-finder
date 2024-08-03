import type { FileStats } from "./file";

export interface SearchDupRes {
  path: string;
  sim: number;
}

export interface SearchDupResRecord extends SearchDupRes {
  key: string;
  file: FileStats;
}
