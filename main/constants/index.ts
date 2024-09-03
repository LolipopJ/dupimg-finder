import { resolve } from "path";

import type { SearchDupOptions, SearchDupPairsOptions } from "../interfaces";

export const EFFICIENTIR_BINARY_PATH = resolve(
  "EfficientIR/dist/EfficientIR_nogui",
  process.platform === "win32" ? "EfficientIR.exe" : "EfficientIR",
);

export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "tiff", "bmp", "webp"];

export const DEFAULT_SEARCH_DUP_OPTIONS: SearchDupOptions = {
  matchN: 5,
};

export const DEFAULT_SEARCH_DUP_PAIRS_OPTIONS: SearchDupPairsOptions = {
  threshold: 98.5,
  sameDir: true,
};
