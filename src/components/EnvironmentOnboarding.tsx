import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getEnvironments,
  addEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from "../api/environmentApi";

interface EnvObj {
  id: string;
  name: string;
}

const EnvironmentOnboarding: React.FC = () => {
  const [environments, setEnvironments] = useState<EnvObj[]>([]);
  const [envName, setEnvName] = useState("");
  const [error, setError] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    getEnvironments()
      .then((envs) => setEnvironments(envs))
      .catch(() => setError("Failed to load environments"));
  }, []);

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = envName.trim();
    if (!name) {
      setError("Environment name is required.");
      return;
    }
    if (
      environments.some(
        (env, idx) =>
          env.name.toLowerCase() === name.toLowerCase() && idx !== editIdx
      )
    ) {
      setError("Environment already exists.");
      return;
    }
    if (editIdx !== null && editId) {
      await updateEnvironment(editId, { name });
      const updated = [...environments];
      updated[editIdx] = { ...updated[editIdx], name };
      setEnvironments(updated);
      setEditIdx(null);
      setEditId(null);
    } else {
      const newEnv = { id: Date.now().toString(), name };
      await addEnvironment(newEnv);
      setEnvironments([...environments, newEnv]);
    }
    setEnvName("");
    setError("");
  };

  const handleEdit = (idx: number) => {
    setEnvName(environments[idx].name);
    setEditIdx(idx);
    setEditId(environments[idx].id);
    setError("");
  };

  const handleDelete = async (idx: number) => {
    const env = environments[idx];
    if (env.id) {
      await deleteEnvironment(env.id);
      setEnvironments(environments.filter((_, i) => i !== idx));
    }
    setError("");
    if (editIdx === idx) {
      setEditIdx(null);
      setEditId(null);
      setEnvName("");
    }
  };

  return (
    <Box maxWidth={400} mx="auto" my={6} p={3} component={Paper} elevation={3}>
      <Typography variant="h4" align="center" gutterBottom>
        Environment Onboarding
      </Typography>
      <form
        onSubmit={handleAddOrEdit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Environment Name"
          value={envName}
          onChange={(e) => setEnvName(e.target.value)}
          required
        />
        <Box display="flex" gap={2}>
          <Button type="submit" variant="contained" color="primary">
            {editIdx !== null ? "Update Environment" : "Add Environment"}
          </Button>
          {editIdx !== null && (
            <Button
              variant="outlined"
              onClick={() => {
                setEditIdx(null);
                setEditId(null);
                setEnvName("");
                setError("");
              }}
            >
              Cancel
            </Button>
          )}
        </Box>
      </form>
      <List>
        {environments.map((env, idx) => (
          <ListItem key={env.id} divider>
            <ListItemText primary={env.name} />
            <IconButton onClick={() => handleEdit(idx)}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(idx)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default EnvironmentOnboarding;
