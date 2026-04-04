export interface EfficientIRConfig {
  config_version: number;
  img_size: number;
  index_capacity: number;
  /** @deprecated Merged into `combined_index_path` */
  metainfo_path?: string;
  /** @deprecated Merged into `combined_index_path` */
  exists_index_path?: string;
  combined_index_path: string;
  index_path: string;
  model_path: string;
  search_dir: string[];
}

export interface SpawnOptions {
  key: string;
  title: string;
  receiveData?: "append" | "replace";
  pipe?: "stdout" | "stderr";
  cancelable?: boolean;
}

export interface SearchDupOptions {
  matchN?: number;
}

export interface SearchDupPairsOptions {
  /** 70 <= threshold <= 100 */
  threshold?: number;
  sameDir?: boolean;
}
