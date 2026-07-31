/** Merges `updates` into the stored record and persists the result. */
export const mergeStoreRecord = <T>(
  key: string,
  updates: Record<string, T>,
): Record<string, T> => {
  const record = { ...window.storeApi.getValue(key), ...updates };
  window.storeApi.setValue(key, record);
  return record;
};

/** Removes `keys` from the stored record and persists the result. */
export const deleteStoreRecordKeys = <T>(
  key: string,
  keys: string[],
): Record<string, T> => {
  const record = window.storeApi.getValue(key);
  keys.forEach((k) => delete record[k]);
  window.storeApi.setValue(key, record);
  return record;
};
