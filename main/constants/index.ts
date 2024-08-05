import { resolve } from "path";

export const EFFICIENTIR_BINARY_PATH = resolve(
  "EfficientIR/dist/EfficientIR_nogui",
  process.platform === "win32" ? "EfficientIR.exe" : "EfficientIR",
);

export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "tiff", "bmp", "webp"];
