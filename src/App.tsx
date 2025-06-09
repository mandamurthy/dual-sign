import React, { useState } from "react";
import { Box, Toolbar, AppBar, Typography } from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import StorageIcon from "@mui/icons-material/Storage";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Sidebar from "./components/Sidebar";
import UserOnboarding from "./components/UserOnboarding";
import EnvironmentOnboarding from "./components/EnvironmentOnboarding";
import ProjectOnboarding from "./components/ProjectOnboarding";
import Maker from "./components/MakerChecker";
import Checker from "./components/Checker";
import AuditTrail from "./components/AuditTrail";
import "./App.css";

const drawerWidth = 220;

const navItems = [
  { label: "User Onboarding", icon: <PersonAddIcon />, key: "user" },
  { label: "Environment Onboarding", icon: <StorageIcon />, key: "env" },
  { label: "Project Onboarding", icon: <FolderOpenIcon />, key: "project" },
  { label: "Maker", icon: <FactCheckIcon />, key: "maker" },
  { label: "Checker", icon: <CheckCircleIcon />, key: "checker" },
  { label: "Audit Trail", icon: <SecurityIcon />, key: "audit" },
];

function App() {
  const [selected, setSelected] = useState("user");

  let content;
  if (selected === "user") content = <UserOnboarding />;
  else if (selected === "env") content = <EnvironmentOnboarding />;
  else if (selected === "project") content = <ProjectOnboarding />;
  else if (selected === "maker") content = <Maker />;
  else if (selected === "checker") content = <Checker />;
  else if (selected === "audit") content = <AuditTrail />;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Dual Sign
          </Typography>
        </Toolbar>
      </AppBar>
      <Sidebar selected={selected} onSelect={setSelected} navItems={navItems} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <Toolbar />
        {content}
      </Box>
    </Box>
  );
}

export default App;
