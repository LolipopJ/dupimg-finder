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
  const userDataPath = app.getPath("userData");

  if (!fs.existsSync(configFilePath)) {
    const defaultConfig = JSON.parse(
      fs.readFileSync(EFFICIENTIR_DEFAULT_CONFIG_PATH).toString(),
    ) as EfficientIRConfig;

    defaultConfig.combined_index_path = path.join(
      userDataPath,
      "index/combined_index.json",
    );
    defaultConfig.index_path = path.join(userDataPath, "index/index.bin");

    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));

    return defaultConfig;
  }

  const efficientIRConfig = JSON.parse(
    fs.readFileSync(configFilePath).toString(),
  ) as EfficientIRConfig;

  if (efficientIRConfig.config_version === 1) {
    delete efficientIRConfig.metainfo_path;
    delete efficientIRConfig.exists_index_path;
    efficientIRConfig.combined_index_path = path.join(
      userDataPath,
      "index/combined_index.json",
    );

    efficientIRConfig.config_version = 2;

    fs.writeFileSync(
      configFilePath,
      JSON.stringify(efficientIRConfig, null, 2),
    );
  }

  return efficientIRConfig;
};

export const updateEfficientIRConfig = (newConfig: EfficientIRConfig) => {
  const configFilePath = getEfficientIRConfigFilePath();
  fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2));
};
