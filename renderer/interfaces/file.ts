import type { Stats } from "fs";

export interface FileStats extends Partial<Stats> {
  isDeleted?: boolean;
}
