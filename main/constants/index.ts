import { resolve } from "path";

import type { SearchDupOptions, SearchDupPairsOptions } from "../interfaces";

export const EFFICIENTIR_DIR_PATH = resolve(
  "EfficientIR/dist/EfficientIR_nogui",
);

export const EFFICIENTIR_BINARY_PATH = resolve(
  EFFICIENTIR_DIR_PATH,
  process.platform === "win32" ? "EfficientIR.exe" : "EfficientIR",
);

export const EFFICIENTIR_DEFAULT_CONFIG_PATH = resolve(
  EFFICIENTIR_DIR_PATH,
  "nogui/config.json",
);

export const EFFICIENTIR_CONFIG_FILENAME = "efficientir-config.json";

export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "tiff", "bmp", "webp"];

export const DEFAULT_SEARCH_DUP_OPTIONS: SearchDupOptions = {
  matchN: 5,
};

export const DEFAULT_SEARCH_DUP_PAIRS_OPTIONS: SearchDupPairsOptions = {
  threshold: 98.5,
  sameDir: true,
};
