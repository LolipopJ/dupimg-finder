export enum StoreEvents {
  SET_VALUE = "store:setValue",
  GET_VALUE = "store:getValue",
}

export enum ElectronEvents {
  OPEN_DIRECTORY = "electron:openDirectory",
  OPEN_FILE = "electron:openFile",
}

export enum EfficientIREvents {
  UPDATE_INDEX = "efficientIR:updateIndex",
  UPDATE_ALL_INDEX = "efficientIR:updateAllIndex",
  SEARCH_DUP_IMG = "efficientIR:searchDupImg",
}

export enum SpawnEvents {
  SPAWN_STARTED = "__SPAWN_STARTED__",
  SPAWN_STDOUT = "__SPAWN_STDOUT__",
  SPAWN_STDERR = "__SPAWN_STDERR__",
  SPAWN_FINISHED = "__SPAWN_FINISHED__",
}
