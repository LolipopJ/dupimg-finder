export interface SpawnOptions {
  key: string;
  title: string;
  receiveData?: "append" | "replace";
  pipe?: "stdout" | "stderr";
}
