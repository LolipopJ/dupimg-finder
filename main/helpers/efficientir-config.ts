import { app } from "electron";
import fs from "fs";
import path from "path";

import {
  EFFICIENTIR_CONFIG_FILENAME,
  EFFICIENTIR_DEFAULT_CONFIG_PATH,
  EFFICIENTIR_INDEXES_DIRNAME,
} from "../constants";
import type { EfficientIRConfig } from "../interfaces";

export const getEfficientIRConfigFilePath = () => {
  return path.join(app.getPath("userData"), EFFICIENTIR_CONFIG_FILENAME);
};

export const getEfficientIRIndexesDirectory = () => {
  return path.join(app.getPath("userData"), EFFICIENTIR_INDEXES_DIRNAME);
};

export const getEfficientIRConfig = () => {
  const configFilePath = getEfficientIRConfigFilePath();

  if (!fs.existsSync(configFilePath)) {
    const defaultConfig = JSON.parse(
      fs.readFileSync(EFFICIENTIR_DEFAULT_CONFIG_PATH).toString(),
    ) as EfficientIRConfig;

    const userDataPath = app.getPath("userData");
    defaultConfig.metainfo_path = path.join(
      userDataPath,
      "index/metainfo.json",
    );
    defaultConfig.exists_index_path = path.join(
      userDataPath,
      "index/name_index.json",
    );
    defaultConfig.index_path = path.join(userDataPath, "index/index.bin");

    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));

    return defaultConfig;
  }

  return JSON.parse(
    fs.readFileSync(configFilePath).toString(),
  ) as EfficientIRConfig;
};

export const updateEfficientIRConfig = (newConfig: EfficientIRConfig) => {
  const configFilePath = getEfficientIRConfigFilePath();
  fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
};
