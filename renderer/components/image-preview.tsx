import { Image, type ImageProps } from "antd";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  deleteImage,
  type DeleteImageOptions,
  openImage,
  type OpenImageOptions,
  type RevealImageOptions,
} from "../utils/image";
import ImageDropdownMenu, {
  type ImageDropdownMenuProps,
} from "./image-dropdown-menu";

export interface ImagePreviewProps
  extends DeleteImageOptions,
    OpenImageOptions,
    RevealImageOptions {
  path: string;
  dropdownMenuProps?: ImageDropdownMenuProps;
  imageProps?: ImageProps;
  children?: React.ReactNode;
}

export const ImagePreview = (props: ImagePreviewProps) => {
  const {
    children,
    path,
    onDelete,
    onOpen,
    onReveal,
    dropdownMenuProps,
    imageProps,
  } = props;

  const isHoveringRef = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Delete" && isHoveringRef.current) {
        deleteImage({ path, onDelete });
      }
    },
    [path, onDelete],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const wrapWithDropdownMenu = (innerChildren: React.ReactNode) => {
    return (
      <ImageDropdownMenu
        path={path}
        onDelete={onDelete}
        onOpen={onOpen}
        onReveal={onReveal}
        {...dropdownMenuProps}
      >
        <div
          onMouseEnter={() => {
            isHoveringRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveringRef.current = false;
          }}
        >
          {innerChildren}
        </div>
      </ImageDropdownMenu>
    );
  };

  if (children && isValidElement(children)) {
    const clonedChildren = cloneElement(children, {
      onClick: async (event: React.MouseEvent) => {
        await children.props.onClick?.(event);
        await openImage({ path, onOpen });
      },
    });

    return wrapWithDropdownMenu(clonedChildren);
  }

  return wrapWithDropdownMenu(
    <Image
      src={`media://${path}`}
      alt={path}
      className="cursor-pointer rounded-md"
      preview={false}
      {...imageProps}
      onClick={async (event) => {
        imageProps?.onClick?.(event);
        await openImage({ path, onOpen });
      }}
    />,
  );
};

export default ImagePreview;
