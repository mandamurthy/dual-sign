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
import { getEnvironments } from "../api/environmentApi";
import {
  getProjects,
  addProject,
  updateProject,
  deleteProject,
} from "../api/projectApi";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../api/productApi";

interface EnvObj {
  id: string;
  name: string;
}
interface ProjectObj {
  id: string;
  name: string;
  environment: string;
  auditPath: string;
  auditCaptureApproach: string;
  auditRetentionDays: number;
  auditLogGranularity: string;
}
interface ProductObj {
  id: string;
  project: string;
  name: string;
  path: string;
  pattern: string;
  submitPrefix: string;
  auditMustColumns: string;
}

const ProjectOnboarding: React.FC = () => {
  const [projects, setProjects] = useState<ProjectObj[]>([]);
  const [environments, setEnvironments] = useState<EnvObj[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectEnv, setProjectEnv] = useState("");
  const [error, setError] = useState("");
  const [productProject, setProductProject] = useState("");
  const [productPattern, setProductPattern] = useState("");
  const [productPath, setProductPath] = useState("");
  const [productName, setProductName] = useState("");
  const [productSubmitPrefix, setProductSubmitPrefix] = useState("");
  const [products, setProducts] = useState<ProductObj[]>([]);
  const [editProjectIdx, setEditProjectIdx] = useState<number | null>(null);
  const [editProductIdx, setEditProductIdx] = useState<number | null>(null);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [auditPath, setAuditPath] = useState("");
  const [auditCaptureApproach, setAuditCaptureApproach] = useState("");
  const [auditRetentionDays, setAuditRetentionDays] = useState(14);
  const [auditLogGranularity, setAuditLogGranularity] = useState("");
  const [auditMustColumns, setAuditMustColumns] = useState("");
  const auditApproachOptions = ["Date", "ProductName"];
  const auditGranularityOptions = ["Diff Lines", "Diff Columns"];

  // Fetch environments, projects, and products from backend
  useEffect(() => {
    getEnvironments()
      .then(setEnvironments)
      .catch(() => setError("Failed to load environments"));
    getProjects()
      .then(setProjects)
      .catch(() => setError("Failed to load projects"));
    getProducts()
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  // Project onboarding handler
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectEnv) {
      setError("Project name and environment are required.");
      return;
    }
    if (!auditPath.trim()) {
      setError("Audit Path is required.");
      return;
    }
    if (!auditCaptureApproach) {
      setError("Audit Capture Approach is required.");
      return;
    }
    if (!auditLogGranularity) {
      setError("Audit Log Granularity is required.");
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
    if (editProjectIdx !== null && editProjectId) {
      await updateProject(editProjectId, {
        name: projectName.trim(),
        environment: projectEnv,
        auditPath: auditPath.trim(),
        auditCaptureApproach,
        auditRetentionDays,
        auditLogGranularity,
      });
      const updated = [...projects];
      updated[editProjectIdx] = {
        ...updated[editProjectIdx],
        name: projectName.trim(),
        environment: projectEnv,
        auditPath: auditPath.trim(),
        auditCaptureApproach,
        auditRetentionDays,
        auditLogGranularity,
      };
      setProjects(updated);
      setEditProjectIdx(null);
      setEditProjectId(null);
    } else {
      const newProject = {
        id: Date.now().toString(),
        name: projectName.trim(),
        environment: projectEnv,
        auditPath: auditPath.trim(),
        auditCaptureApproach,
        auditRetentionDays,
        auditLogGranularity,
      };
      await addProject(newProject);
      setProjects([...projects, newProject]);
    }
    setProjectName("");
    setProjectEnv("");
    setAuditPath("");
    setAuditCaptureApproach("");
    setAuditRetentionDays(14);
    setAuditLogGranularity("");
    setError("");
  };
  const handleEditProject = (idx: number) => {
    setProjectName(projects[idx].name);
    setProjectEnv(projects[idx].environment);
    setAuditPath(projects[idx].auditPath || "");
    setAuditCaptureApproach(projects[idx].auditCaptureApproach || "");
    setAuditRetentionDays(projects[idx].auditRetentionDays || 14);
    setAuditLogGranularity(projects[idx].auditLogGranularity || "");
    setEditProjectIdx(idx);
    setEditProjectId(projects[idx].id);
    setError("");
  };
  const handleDeleteProject = async (idx: number) => {
    const project = projects[idx];
    if (project.id) {
      await deleteProject(project.id);
      setProjects(projects.filter((_, i) => i !== idx));
    }
    // Remove products belonging to this project
    const updatedProducts = products.filter(
      (prod) => prod.project !== project.name + " | " + project.environment
    );
    setProducts(updatedProducts);
    if (editProjectIdx === idx) {
      setEditProjectIdx(null);
      setEditProjectId(null);
      setProjectName("");
      setProjectEnv("");
    }
  };

  // Product onboarding handler
  const handleAddProduct = async (e: React.FormEvent) => {
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
    if (editProductIdx !== null && editProductId) {
      await updateProduct(editProductId, {
        project: productProject,
        name: productName.trim(),
        path: productPath.trim(),
        pattern: productPattern.trim(),
        submitPrefix: productSubmitPrefix.trim(),
        auditMustColumns: auditMustColumns.trim(),
      });
      const updated = [...products];
      updated[editProductIdx] = {
        ...updated[editProductIdx],
        project: productProject,
        name: productName.trim(),
        path: productPath.trim(),
        pattern: productPattern.trim(),
        submitPrefix: productSubmitPrefix.trim(),
        auditMustColumns: auditMustColumns.trim(),
      };
      setProducts(updated);
      setEditProductIdx(null);
      setEditProductId(null);
    } else {
      const newProduct = {
        id: Date.now().toString(),
        project: productProject,
        name: productName.trim(),
        path: productPath.trim(),
        pattern: productPattern.trim(),
        submitPrefix: productSubmitPrefix.trim(),
        auditMustColumns: auditMustColumns.trim(),
      };
      await addProduct(newProduct);
      setProducts([...products, newProduct]);
    }
    setProductProject("");
    setProductName("");
    setProductPath("");
    setProductPattern("");
    setProductSubmitPrefix("");
    setAuditMustColumns("");
    setError("");
  };

  const handleEditProduct = (idx: number) => {
    const prod = products[idx];
    setProductProject(prod.project);
    setProductName(prod.name);
    setProductPath(prod.path);
    setProductPattern(prod.pattern);
    setProductSubmitPrefix(prod.submitPrefix || "");
    setAuditMustColumns(prod.auditMustColumns || "");
    setEditProductIdx(idx);
    setEditProductId(prod.id);
    setError("");
  };

  const handleDeleteProduct = async (idx: number) => {
    const prod = products[idx];
    if (prod.id) {
      await deleteProduct(prod.id);
      setProducts(products.filter((_, i) => i !== idx));
    }
    if (editProductIdx === idx) {
      setEditProductIdx(null);
      setEditProductId(null);
      setProductProject("");
      setProductName("");
      setProductPath("");
      setProductPattern("");
      setProductSubmitPrefix("");
      setAuditMustColumns("");
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
                  key={env.id}
                  value={env.name}
                  style={{ whiteSpace: "normal" }}
                >
                  {env.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Audit Path"
            value={auditPath}
            onChange={(e) => setAuditPath(e.target.value)}
            required
          />
          <FormControl fullWidth required sx={{ minWidth: 200, maxWidth: 400 }}>
            <InputLabel id="audit-capture-approach-label">
              Audit Capture Approach
            </InputLabel>
            <Select
              labelId="audit-capture-approach-label"
              value={auditCaptureApproach}
              label="Audit Capture Approach"
              onChange={(e) => setAuditCaptureApproach(e.target.value)}
            >
              {auditApproachOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required sx={{ minWidth: 200, maxWidth: 400 }}>
            <TextField
              label="Audit Retention Days"
              type="number"
              value={auditRetentionDays}
              onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
              inputProps={{ min: 1 }}
              required
              helperText="How long to retain audit logs (days)"
            />
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Audit Log Granularity</InputLabel>
            <Select
              value={auditLogGranularity}
              label="Audit Log Granularity"
              onChange={(e) => setAuditLogGranularity(e.target.value)}
            >
              {auditGranularityOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
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
                  setAuditPath("");
                  setAuditCaptureApproach("");
                  setAuditRetentionDays(14);
                  setAuditLogGranularity("");
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
            <ListItem key={idx} divider>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                width="100%"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight={600}>{proj.name}</Typography>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    size="small"
                    onClick={() => handleEditProject(idx)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={() => handleDeleteProject(idx)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <ListItemText
                  primary={null}
                  secondary={
                    <>
                      <Box component="span" display="block">
                        Environment: {proj.environment}
                      </Box>
                      <Box
                        component="span"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        Audit Path:{" "}
                        <a
                          href={proj.auditPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ wordBreak: "break-all" }}
                        >
                          {proj.auditPath && proj.auditPath.length > 30
                            ? proj.auditPath.slice(0, 20) + "..."
                            : proj.auditPath || "-"}
                        </a>
                        <Button
                          size="small"
                          sx={{ minWidth: 0, ml: 1 }}
                          onClick={() =>
                            navigator.clipboard.writeText(proj.auditPath || "")
                          }
                          title="Copy path"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </Button>
                      </Box>
                      <Box component="span" display="block">
                        Audit Capture: {proj.auditCaptureApproach || "-"}
                      </Box>
                      <Box component="span" display="block">
                        Audit Retention Days: {proj.auditRetentionDays || 14}{" "}
                        days
                      </Box>
                      <Box component="span" display="block">
                        Audit Log Granularity: {proj.auditLogGranularity || "-"}
                      </Box>
                    </>
                  }
                  sx={{ pr: 2 }}
                />
              </Box>
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
                  key={proj.id}
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
          <TextField
            label="Audit Must Columns"
            value={auditMustColumns}
            onChange={(e) => setAuditMustColumns(e.target.value)}
            fullWidth
            helperText="Pipe-delimited column names (e.g. col1|col2|col3)"
            sx={{ mb: 2 }}
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
                  setAuditMustColumns("");
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
            <ListItem key={idx} divider>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                width="100%"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography fontWeight={600}>{prod.name}</Typography>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    size="small"
                    onClick={() => handleEditProduct(idx)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={() => handleDeleteProduct(idx)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box textAlign="center" minWidth={0} flex={1} ml={2}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: "center",
                    }}
                  >
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
                  </div>
                  <div>Pattern: {prod.pattern}</div>
                  <div>Project: {prod.project}</div>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default ProjectOnboarding;
