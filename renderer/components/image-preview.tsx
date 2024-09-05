import { Image } from "antd";
import { cloneElement, isValidElement } from "react";

export interface ImagePreviewProps {
  path: string;
  onOpen?: () => void;
  onFailed?: (error: string) => void;
  children?: React.ReactNode;
}

export const ImagePreview = (props: ImagePreviewProps) => {
  const { path, onOpen, onFailed, children } = props;

  const openImage = async () => {
    const error = await window.electronApi.openFile(path);
    if (error) {
      console.error(`Open file \`${path}\` failed:`, error);
      onFailed?.(error);
    } else {
      onOpen?.();
    }
  };

  if (children && isValidElement(children)) {
    return cloneElement(children, {
      // @ts-expect-error: wrap children with `onClick`
      onClick: (event) => {
        children.props.onClick?.(event);
        openImage();
      },
    });
  }

  return (
    <Image
      src={`media://${path}`}
      alt={path}
      className="cursor-pointer rounded-md"
      preview={false}
      onClick={openImage}
    />
  );
};

export default ImagePreview;
