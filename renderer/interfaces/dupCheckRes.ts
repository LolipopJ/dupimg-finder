import type { Stats } from "fs";

export interface DupCheckRes {
  pathA: string;
  pathB: string;
  similarity: number;
}

export interface DupCheckResRecord extends DupCheckRes {
  fileA: Stats;
  fileB: Stats;
}
