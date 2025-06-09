import React from "react";
import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  Typography,
  Box,
  ListItemButton,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StorageIcon from "@mui/icons-material/Storage";

const drawerWidth = 220;

interface SidebarProps {
  selected: string;
  onSelect: (key: string) => void;
  navItems: { label: string; icon: React.ReactNode; key: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ selected, onSelect, navItems }) => (
  <Drawer
    variant="permanent"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
    }}
  >
    <Toolbar />
    <Box sx={{ overflow: "auto" }}>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={selected === item.key}
            onClick={() => onSelect(item.key)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  </Drawer>
);

export default Sidebar;
