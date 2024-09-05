export enum StoreEvents {
  SET_VALUE = "store:setValue",
  GET_VALUE = "store:getValue",
}

export enum ElectronEvents {
  SELECT_DIRECTORY = "electron:selectDirectory",
  SELECT_IMAGE = "electron:selectImage",
  OPEN_FILE = "electron:openFile",
  REVEAL_FILE = "electron:revealFile",
  DELETE_FILE = "electron:deleteFile",
}

export enum EfficientIREvents {
  GET_CONFIG = "efficientIR:getConfig",
  UPDATE_CONFIG = "efficientIR:updateConfig",
  UPDATE_INDEX = "efficientIR:updateIndex",
  UPDATE_ALL_INDEX = "efficientIR:updateAllIndex",
  SEARCH_DUP_PAIRS = "efficientIR:searchDupPairs",
  SEARCH_DUP_IMG_OF_TARGET = "efficientIR:searchDupImgOfTarget",
}

export enum SpawnEvents {
  SPAWN_STARTED = "__SPAWN_STARTED__",
  SPAWN_STDOUT = "__SPAWN_STDOUT__",
  SPAWN_STDERR = "__SPAWN_STDERR__",
  SPAWN_FINISHED = "__SPAWN_FINISHED__",
}
