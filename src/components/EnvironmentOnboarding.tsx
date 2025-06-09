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
  Stack,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const defaultEnvironments = ["Development", "SIT", "UAT", "DR", "Production"];

const ENV_KEY = "dualSignEnvironments";

const EnvironmentOnboarding: React.FC = () => {
  const [environments, setEnvironments] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("dualSignEnvironments") || "[]");
    } catch {
      return [] as string[];
    }
  });
  const [envName, setEnvName] = useState("");
  const [error, setError] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);

  useEffect(() => {
    const syncEnvs = () => {
      try {
        setEnvironments(
          JSON.parse(localStorage.getItem("dualSignEnvironments") || "[]")
        );
      } catch {
        setEnvironments([]);
      }
    };
    window.addEventListener("storage", syncEnvs);
    window.addEventListener("focus", syncEnvs);
    return () => {
      window.removeEventListener("storage", syncEnvs);
      window.removeEventListener("focus", syncEnvs);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(ENV_KEY, JSON.stringify(environments));
  }, [environments]);

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = envName.trim();
    if (!name) {
      setError("Environment name is required.");
      return;
    }
    if (
      environments.some(
        (env, idx) =>
          env.toLowerCase() === name.toLowerCase() && idx !== editIdx
      )
    ) {
      setError("Environment already exists.");
      return;
    }
    if (editIdx !== null) {
      const updated = [...environments];
      updated[editIdx] = name;
      setEnvironments(updated);
      setEditIdx(null);
    } else {
      setEnvironments([...environments, name]);
    }
    setEnvName("");
    setError("");
  };

  const handleEdit = (idx: number) => {
    setEnvName(environments[idx]);
    setEditIdx(idx);
    setError("");
  };

  const handleDelete = (idx: number) => {
    setEnvironments(environments.filter((_, i) => i !== idx));
    setError("");
    if (editIdx === idx) {
      setEditIdx(null);
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
              color="secondary"
              onClick={() => {
                setEditIdx(null);
                setEnvName("");
                setError("");
              }}
            >
              Cancel Update
            </Button>
          )}
        </Box>
      </form>
      <Typography variant="h6" mt={4}>
        Environment List
      </Typography>
      <List>
        {environments.map((env, idx) => (
          <ListItem
            key={env}
            divider
            secondaryAction={
              <Stack direction="row" spacing={1}>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => handleEdit(idx)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleDelete(idx)}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            }
          >
            <ListItemText primary={env} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default EnvironmentOnboarding;
