import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemIcon,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const roles = [
  "Admin",
  "Developer",
  "Tester",
  "Maker",
  "Checker",
  "ReadOnly",
  "SuperUser",
];

interface User {
  username: string;
  roles: { [env: string]: string };
}

// Helper to get environments from localStorage
const getEnvs = () => {
  try {
    return JSON.parse(localStorage.getItem("dualSignEnvironments") || "[]");
  } catch {
    return [] as string[];
  }
};

const UserOnboarding: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    // Load users from localStorage on initial mount only
    const stored = localStorage.getItem("dualSignUsers");
    return stored ? JSON.parse(stored) : [];
  });
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [environments, setEnvironments] = useState<string[]>(() => getEnvs());
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [envRoles, setEnvRoles] = useState<{ [env: string]: string }>({});
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Save users to localStorage on change
  React.useEffect(() => {
    localStorage.setItem("dualSignUsers", JSON.stringify(users));
  }, [users]);

  // Keep environments in sync with localStorage changes (e.g., from EnvironmentOnboarding)
  React.useEffect(() => {
    const syncEnvs = () => setEnvironments(getEnvs());
    window.addEventListener("storage", syncEnvs);
    // Also poll localStorage on tab focus (for SPA navigation)
    window.addEventListener("focus", syncEnvs);
    return () => {
      window.removeEventListener("storage", syncEnvs);
      window.removeEventListener("focus", syncEnvs);
    };
  }, []);

  const handleEnvToggle = (env: string) => {
    setSelectedEnvs((prev) =>
      prev.includes(env) ? prev.filter((e) => e !== env) : [...prev, env]
    );
  };
  const handleEnvRoleChange = (env: string, role: string) => {
    setEnvRoles((prev) => ({ ...prev, [env]: role }));
  };

  const handleEditUser = (idx: number) => {
    const user = users[idx];
    setUsername(user.username);
    setSelectedEnvs(Object.keys(user.roles));
    setEnvRoles({ ...user.roles });
    setEditIdx(idx);
  };

  const handleDeleteUser = (idx: number) => {
    setUsers(users.filter((_, i) => i !== idx));
    if (editIdx === idx) {
      setEditIdx(null);
      setUsername("");
      setSelectedEnvs([]);
      setEnvRoles({});
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (
      users.some(
        (u, i) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          i !== editIdx
      )
    ) {
      setError("Username already exists.");
      return;
    }
    if (selectedEnvs.length === 0) {
      setError("Select at least one environment.");
      return;
    }
    // Build roles per environment
    const userRoles: { [env: string]: string } = {};
    selectedEnvs.forEach((env) => {
      userRoles[env] = envRoles[env] || roles[0];
    });
    if (editIdx !== null) {
      const updated = [...users];
      updated[editIdx] = { username: username.trim(), roles: userRoles };
      setUsers(updated);
      setEditIdx(null);
    } else {
      setUsers([...users, { username: username.trim(), roles: userRoles }]);
    }
    setUsername("");
    setSelectedEnvs([]);
    setEnvRoles({});
    setError("");
  };

  return (
    <Box maxWidth={900} mx="auto" my={6} display="flex" gap={4}>
      {/* Add User Form */}
      <Box flex={1} p={3} component={Paper} elevation={3}>
        <Typography variant="h4" align="center" gutterBottom>
          User Onboarding
        </Typography>
        <form
          onSubmit={handleAddUser}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Typography variant="subtitle1">
            Assign Environments & Roles
          </Typography>
          <List>
            {environments.map((env) => (
              <ListItem key={env} dense divider>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedEnvs.includes(env)}
                    onChange={() => handleEnvToggle(env)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={env} />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id={`role-label-${env}`}>Role</InputLabel>
                  <Select
                    labelId={`role-label-${env}`}
                    value={envRoles[env] || roles[0]}
                    label="Role"
                    onChange={(e) => handleEnvRoleChange(env, e.target.value)}
                    disabled={!selectedEnvs.includes(env)}
                  >
                    {roles.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </ListItem>
            ))}
          </List>
          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained" color="primary">
              {editIdx !== null ? "Update User" : "Add User"}
            </Button>
            {editIdx !== null && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditIdx(null);
                  setUsername("");
                  setSelectedEnvs([]);
                  setEnvRoles({});
                  setError("");
                }}
              >
                Cancel Update
              </Button>
            )}
          </Box>
        </form>
      </Box>
      {/* User List */}
      <Box
        flex={1}
        p={3}
        component={Paper}
        elevation={3}
        minWidth={350}
        maxWidth={450}
      >
        <Typography variant="h6" align="center" gutterBottom>
          User List
        </Typography>
        <List>
          {users.map((user, idx) => (
            <ListItem
              key={idx}
              divider
              alignItems="flex-start"
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditUser(idx)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDeleteUser(idx)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <Box display="flex" flexDirection="column" width="100%">
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontWeight={600}>{user.username}</Typography>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ wordBreak: "break-word", mt: 1 }}
                >
                  {Object.entries(user.roles)
                    .map(([env, role]) => `${env}: ${role}`)
                    .join(" | ")}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default UserOnboarding;
