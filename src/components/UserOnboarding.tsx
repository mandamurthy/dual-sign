import React, { useState, useEffect } from "react";
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
import { getUsers, addUser, updateUser, deleteUser } from "../api/userApi";
import { getEnvironments } from "../api/environmentApi";

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
  id?: string;
  username: string;
  roles: { [env: string]: string };
}

interface EnvObj {
  id: string;
  name: string;
}

const UserOnboarding: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [environments, setEnvironments] = useState<EnvObj[]>([]);
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]); // store selected env ids
  const [envRoles, setEnvRoles] = useState<{ [envId: string]: string }>({});
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch users and environments from backend
  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError("Failed to load users"));
    getEnvironments()
      .then(setEnvironments)
      .catch(() => setError("Failed to load environments"));
  }, []);

  const handleEnvToggle = (envId: string) => {
    setSelectedEnvs((prev) =>
      prev.includes(envId) ? prev.filter((e) => e !== envId) : [...prev, envId]
    );
  };
  const handleEnvRoleChange = (envId: string, role: string) => {
    setEnvRoles((prev) => ({ ...prev, [envId]: role }));
  };

  const handleEditUser = (idx: number) => {
    const user = users[idx];
    setUsername(user.username);
    setSelectedEnvs(Object.keys(user.roles));
    setEnvRoles({ ...user.roles });
    setEditIdx(idx);
    setEditId(user.id || null);
  };

  const handleDeleteUser = async (idx: number) => {
    const user = users[idx];
    if (user.id) {
      await deleteUser(user.id);
      setUsers(users.filter((_, i) => i !== idx));
    }
    if (editIdx === idx) {
      setEditIdx(null);
      setEditId(null);
      setUsername("");
      setSelectedEnvs([]);
      setEnvRoles({});
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
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
    const userRoles: { [envId: string]: string } = {};
    selectedEnvs.forEach((envId) => {
      userRoles[envId] = envRoles[envId] || roles[0];
    });
    if (editIdx !== null && editId) {
      await updateUser(editId, { username: username.trim(), roles: userRoles });
      const updated = [...users];
      updated[editIdx] = {
        ...updated[editIdx],
        username: username.trim(),
        roles: userRoles,
      };
      setUsers(updated);
      setEditIdx(null);
      setEditId(null);
    } else {
      // Generate a simple id (in real app, backend should do this)
      const newUser = {
        id: Date.now().toString(),
        username: username.trim(),
        roles: userRoles,
      };
      await addUser(newUser);
      setUsers([...users, newUser]);
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
              <ListItem key={env.id} dense divider>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedEnvs.includes(env.id)}
                    onChange={() => handleEnvToggle(env.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={env.name} />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id={`role-label-${env.id}`}>Role</InputLabel>
                  <Select
                    labelId={`role-label-${env.id}`}
                    value={envRoles[env.id] || roles[0]}
                    onChange={(e) =>
                      handleEnvRoleChange(env.id, e.target.value)
                    }
                    label="Role"
                    disabled={!selectedEnvs.includes(env.id)}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        {role}
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
                onClick={() => {
                  setEditIdx(null);
                  setEditId(null);
                  setUsername("");
                  setSelectedEnvs([]);
                  setEnvRoles({});
                  setError("");
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Box>
      {/* User List */}
      <Box flex={1} p={3} component={Paper} elevation={3}>
        <Typography variant="h5" align="center" gutterBottom>
          Users
        </Typography>
        <List>
          {users.map((user, idx) => (
            <ListItem key={user.id || user.username} divider>
              <ListItemText
                primary={user.username}
                secondary={Object.entries(user.roles)
                  .map(([envId, role]) => {
                    const envObj = environments.find((e) => e.id === envId);
                    return envObj
                      ? `${envObj.name}: ${role}`
                      : `${envId}: ${role}`;
                  })
                  .join(", ")}
              />
              <IconButton onClick={() => handleEditUser(idx)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => handleDeleteUser(idx)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default UserOnboarding;
