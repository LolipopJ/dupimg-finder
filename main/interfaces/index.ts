export interface SpawnOptions {
  key: string;
  title: string;
  receiveData?: "append" | "replace";
  pipe?: "stdout" | "stderr";
}

export interface SearchDupOptions {
  matchN?: number;
}

export interface SearchDupPairsOptions {
  /** 70 <= threshold <= 100 */
  threshold?: number;
  sameDir?: boolean;
}
