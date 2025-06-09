import React, { useState } from "react";
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
  IconButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// Helper to get environments and projects from localStorage
const getEnvs = () => {
  try {
    return JSON.parse(localStorage.getItem("dualSignEnvironments") || "[]");
  } catch {
    return [] as string[];
  }
};
const getProjects = () => {
  try {
    return JSON.parse(localStorage.getItem("dualSignProjects") || "[]");
  } catch {
    return [] as any[];
  }
};

const ProjectOnboarding: React.FC = () => {
  const [projects, setProjects] = useState<any[]>(() => getProjects());
  const [environments, setEnvironments] = useState<string[]>(() => getEnvs());
  const [projectName, setProjectName] = useState("");
  const [projectEnv, setProjectEnv] = useState("");
  const [error, setError] = useState("");
  const [productProject, setProductProject] = useState("");
  const [productPattern, setProductPattern] = useState("");
  const [productPath, setProductPath] = useState("");
  const [productName, setProductName] = useState("");
  const [productSubmitPrefix, setProductSubmitPrefix] = useState("");
  const [products, setProducts] = useState<any[]>(() => {
    const stored = localStorage.getItem("dualSignProducts");
    return stored ? JSON.parse(stored) : [];
  });
  const [editProjectIdx, setEditProjectIdx] = useState<number | null>(null);
  const [editProductIdx, setEditProductIdx] = useState<number | null>(null);

  // Sync environments and projects on storage/focus
  React.useEffect(() => {
    const sync = () => {
      setEnvironments(getEnvs());
      setProjects(getProjects());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Project onboarding handler
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectEnv) {
      setError("Project name and environment are required.");
      return;
    }
    if (
      projects.some(
        (p, idx) =>
          p.name === projectName.trim() &&
          p.environment === projectEnv &&
          idx !== editProjectIdx
      )
    ) {
      setError("Project already exists for this environment.");
      return;
    }
    if (editProjectIdx !== null) {
      const updated = [...projects];
      updated[editProjectIdx] = {
        name: projectName.trim(),
        environment: projectEnv,
      };
      setProjects(updated);
      localStorage.setItem("dualSignProjects", JSON.stringify(updated));
      setEditProjectIdx(null);
    } else {
      const newProjects = [
        ...projects,
        { name: projectName.trim(), environment: projectEnv },
      ];
      setProjects(newProjects);
      localStorage.setItem("dualSignProjects", JSON.stringify(newProjects));
    }
    setProjectName("");
    setProjectEnv("");
    setError("");
  };
  const handleEditProject = (idx: number) => {
    setProjectName(projects[idx].name);
    setProjectEnv(projects[idx].environment);
    setEditProjectIdx(idx);
    setError("");
  };
  const handleDeleteProject = (idx: number) => {
    const updated = projects.filter((_, i) => i !== idx);
    setProjects(updated);
    localStorage.setItem("dualSignProjects", JSON.stringify(updated));
    // Remove products belonging to this project
    const updatedProducts = products.filter(
      (prod) =>
        prod.project !== projects[idx].name + " | " + projects[idx].environment
    );
    setProducts(updatedProducts);
    localStorage.setItem("dualSignProducts", JSON.stringify(updatedProducts));
    if (editProjectIdx === idx) {
      setEditProjectIdx(null);
      setProjectName("");
      setProjectEnv("");
    }
  };

  // Product onboarding handler
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !productProject ||
      !productName.trim() ||
      !productPath.trim() ||
      !productPattern.trim() ||
      !productSubmitPrefix.trim()
    ) {
      setError("All product fields are required.");
      return;
    }
    if (
      products.some(
        (p, idx) =>
          p.project === productProject &&
          p.name === productName.trim() &&
          idx !== editProductIdx
      )
    ) {
      setError("Product already exists for this project.");
      return;
    }
    if (editProductIdx !== null) {
      const updated = [...products];
      updated[editProductIdx] = {
        project: productProject,
        name: productName.trim(),
        path: productPath.trim(),
        pattern: productPattern.trim(),
        submitPrefix: productSubmitPrefix.trim(),
      };
      setProducts(updated);
      localStorage.setItem("dualSignProducts", JSON.stringify(updated));
      setEditProductIdx(null);
    } else {
      const newProducts = [
        ...products,
        {
          project: productProject,
          name: productName.trim(),
          path: productPath.trim(),
          pattern: productPattern.trim(),
          submitPrefix: productSubmitPrefix.trim(),
        },
      ];
      setProducts(newProducts);
      localStorage.setItem("dualSignProducts", JSON.stringify(newProducts));
    }
    setProductProject("");
    setProductName("");
    setProductPath("");
    setProductPattern("");
    setProductSubmitPrefix("");
    setError("");
  };

  const handleEditProduct = (idx: number) => {
    const prod = products[idx];
    setProductProject(prod.project);
    setProductName(prod.name);
    setProductPath(prod.path);
    setProductPattern(prod.pattern);
    setProductSubmitPrefix(prod.submitPrefix || "");
    setEditProductIdx(idx);
    setError("");
  };

  const handleDeleteProduct = (idx: number) => {
    const updated = products.filter((_, i) => i !== idx);
    setProducts(updated);
    localStorage.setItem("dualSignProducts", JSON.stringify(updated));
    if (editProductIdx === idx) {
      setEditProductIdx(null);
      setProductProject("");
      setProductName("");
      setProductPath("");
      setProductPattern("");
      setProductSubmitPrefix("");
    }
  };

  return (
    <Box
      maxWidth={1400}
      mx="auto"
      my={6}
      display="flex"
      gap={4}
      justifyContent="center"
      alignItems="flex-start"
    >
      {/* Add New Project Frame */}
      <Box
        flex={1.2}
        p={3}
        component={Paper}
        elevation={3}
        minWidth={400}
        maxWidth={600}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h5" align="center" gutterBottom>
          Add New Project
        </Typography>
        <form
          onSubmit={handleAddProject}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <FormControl fullWidth required sx={{ minWidth: 200, maxWidth: 400 }}>
            <InputLabel id="project-env-label">Environment</InputLabel>
            <Select
              labelId="project-env-label"
              value={projectEnv}
              label="Environment"
              onChange={(e) => setProjectEnv(e.target.value)}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 400 } },
              }}
            >
              {environments.map((env) => (
                <MenuItem
                  key={env}
                  value={env}
                  style={{ whiteSpace: "normal" }}
                >
                  {env}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained" color="primary">
              {editProjectIdx !== null ? "Update Project" : "Add Project"}
            </Button>
            {editProjectIdx !== null && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditProjectIdx(null);
                  setProjectName("");
                  setProjectEnv("");
                  setError("");
                }}
              >
                Cancel Update
              </Button>
            )}
          </Box>
        </form>
      </Box>
      {/* Project List Frame */}
      <Box
        flex={1}
        p={3}
        component={Paper}
        elevation={3}
        minWidth={350}
        maxWidth={450}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h6" align="center" gutterBottom>
          Projects
        </Typography>
        <List sx={{ width: "100%" }}>
          {projects.map((proj, idx) => (
            <ListItem
              key={idx}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditProject(idx)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteProject(idx)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={proj.name}
                secondary={`Environment: ${proj.environment}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      {/* Add New Product Frame */}
      <Box
        flex={1.2}
        p={3}
        component={Paper}
        elevation={3}
        minWidth={400}
        maxWidth={600}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h5" align="center" gutterBottom>
          Add New Product
        </Typography>
        <form
          onSubmit={handleAddProduct}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <FormControl fullWidth required sx={{ minWidth: 200, maxWidth: 400 }}>
            <InputLabel id="product-project-label">Project Name</InputLabel>
            <Select
              labelId="product-project-label"
              value={productProject}
              label="Project Name"
              onChange={(e) => setProductProject(e.target.value)}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 400 } },
              }}
            >
              {projects.map((proj) => (
                <MenuItem
                  key={proj.name + "-" + proj.environment}
                  value={proj.name + " | " + proj.environment}
                  style={{ whiteSpace: "normal" }}
                >
                  {proj.name + " | " + proj.environment}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <TextField
            label="Product File Path"
            value={productPath}
            onChange={(e) => setProductPath(e.target.value)}
            required
          />
          <TextField
            label="Product File Pattern (wildcards allowed)"
            value={productPattern}
            onChange={(e) => setProductPattern(e.target.value)}
            required
          />
          <TextField
            label="Product Submit File Prefix"
            value={productSubmitPrefix}
            onChange={(e) => setProductSubmitPrefix(e.target.value)}
            required
          />
          <Box display="flex" gap={2}>
            <Button type="submit" variant="contained" color="primary">
              {editProductIdx !== null ? "Update Product" : "Add Product"}
            </Button>
            {editProductIdx !== null && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditProductIdx(null);
                  setProductProject("");
                  setProductName("");
                  setProductPath("");
                  setProductPattern("");
                  setProductSubmitPrefix("");
                  setError("");
                }}
              >
                Cancel Update
              </Button>
            )}
          </Box>
        </form>
      </Box>
      {/* Product List Frame */}
      <Box
        flex={1}
        p={3}
        component={Paper}
        elevation={3}
        minWidth={350}
        maxWidth={450}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h6" align="center" gutterBottom>
          Products
        </Typography>
        <List sx={{ width: "100%" }}>
          {products.map((prod, idx) => (
            <ListItem
              key={idx}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEditProduct(idx)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteProduct(idx)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={`${prod.name} (${prod.project})`}
                secondary={
                  <>
                    Path:{" "}
                    <a
                      href={prod.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ wordBreak: "break-all" }}
                    >
                      {prod.path.length > 30
                        ? prod.path.slice(0, 20) + "..."
                        : prod.path}
                    </a>
                    <Button
                      size="small"
                      sx={{ minWidth: 0, ml: 1 }}
                      onClick={() => navigator.clipboard.writeText(prod.path)}
                      title="Copy path"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </Button>
                    {" | Pattern: " + prod.pattern}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ProjectOnboarding;
