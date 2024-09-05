import { Dropdown, type DropdownProps, type MenuProps } from "antd";

import {
  deleteImage,
  type DeleteImageOptions,
  openImage,
  type OpenImageOptions,
  revealImage,
  type RevealImageOptions,
} from "../utils/image";

export interface ImageDropdownMenuProps
  extends DropdownProps,
    OpenImageOptions,
    RevealImageOptions,
    DeleteImageOptions {}

const menuItems: MenuProps["items"] = [
  { key: "open", label: "Open" },
  { key: "reveal", label: "Reveal" },
  {
    key: "delete",
    label: <span className="text-red-600">Delete</span>,
  },
];

export const ImageDropdownMenu = (props: ImageDropdownMenuProps) => {
  const { path, onOpen, onReveal, onDelete, ...restProps } = props;

  const onMenuItemClick: MenuProps["onClick"] = async (info) => {
    info.domEvent.stopPropagation();

    switch (info.key) {
      case "open":
        await openImage({ path, onOpen });
        break;
      case "reveal":
        revealImage({ path, onReveal });
        break;
      case "delete":
        await deleteImage({ path, onDelete });
        break;
      default:
        console.warn(`Unhandled image dropdown menu item key \`${info.key}\``);
    }
  };

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: onMenuItemClick }}
      trigger={["contextMenu"]}
      destroyPopupOnHide
      {...restProps}
    />
  );
};

export default ImageDropdownMenu;
