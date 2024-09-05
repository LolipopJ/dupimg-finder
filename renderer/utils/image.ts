export interface OpenImageOptions {
  path: string;
  onOpen?: (error?: string) => void;
}

export const openImage = async (options: OpenImageOptions) => {
  const { path, onOpen } = options;
  const error = await window.electronApi.openFile(path);
  if (error) {
    console.error(`Open file \`${path}\` failed:`, error);
  }
  onOpen?.(error);
};

export interface RevealImageOptions {
  path: string;
  onReveal?: (error?: string) => void;
}

export const revealImage = (options: RevealImageOptions) => {
  const { path, onReveal } = options;
  const error = window.electronApi.revealFile(path);
  if (error) {
    console.error(`Reveal file \`${path}\` failed:`, error);
  }
  onReveal?.(error);
};

export interface DeleteImageOptions {
  path: string;
  onDelete?: (error?: string) => void;
}

export const deleteImage = async (options: DeleteImageOptions) => {
  const { path, onDelete } = options;
  const error = await window.electronApi.deleteFile(path);
  if (error) {
    console.error(`Delete file \`${path}\` failed:`, error);
  }
  onDelete?.(error);
};
