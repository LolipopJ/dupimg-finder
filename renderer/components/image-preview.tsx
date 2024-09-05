import { Image, type ImageProps } from "antd";
import { cloneElement, isValidElement } from "react";

import {
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

  const wrapWithDropdownMenu = (innerChildren: React.ReactNode) => {
    return (
      <ImageDropdownMenu
        path={path}
        onDelete={onDelete}
        onOpen={onOpen}
        onReveal={onReveal}
        {...dropdownMenuProps}
      >
        {innerChildren}
      </ImageDropdownMenu>
    );
  };

  if (children && isValidElement(children)) {
    const clonedChildren = cloneElement(children, {
      // @ts-expect-error: wrap children with `onClick`
      onClick: async (event) => {
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
