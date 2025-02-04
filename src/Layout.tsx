import type { ReactNode } from "react";
import { Layout as RALayout, Menu, MenuItemLink } from "react-admin";
import ImageIcon from "@mui/icons-material/Image";
import CompressIcon from "@mui/icons-material/Compress";

const CustomMenu = () => (
  <Menu>
    <MenuItemLink
      to="/optimize"
      primaryText="Optimiser des images"
      leftIcon={<CompressIcon />}
    />
    <MenuItemLink
      to="/"
      primaryText="Images"
      leftIcon={<ImageIcon />}
    />
  </Menu>
);

export const Layout = ({ children }: { children: ReactNode }) => (
  <RALayout menu={CustomMenu}>
    {children}
  </RALayout>
);
