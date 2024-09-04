export interface EfficientIRConfig {
  config_version: number;
  img_size: number;
  index_capacity: number;
  metainfo_path: string;
  exists_index_path: string;
  index_path: string;
  model_path: string;
  search_dir: string[];
}

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
