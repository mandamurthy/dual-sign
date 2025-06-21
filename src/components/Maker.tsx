// Maker.tsx - formerly MakerChecker.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  Button,
  Snackbar,
} from "@mui/material";
import VersionListModal from "./VersionListModal";
import { writeFile } from "../api/fileApi";
import { getProjects } from "../api/projectApi";
import { getEnvironments } from "../api/environmentApi";
import { getProducts } from "../api/productApi";

const Maker: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<"Maker" | "Checker">("Maker");
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [snackbarAction, setSnackbarAction] = useState<React.ReactNode>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionModalFile, setVersionModalFile] = useState<string | null>(null);
  const [versionList, setVersionList] = useState<any[]>([]);

  // Fetch onboarding data from backend
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
    getEnvironments()
      .then(setEnvironments)
      .catch(() => setEnvironments([]));
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  // Filter products for selected project/env
  const filteredProducts = products.filter(
    (prod) => prod.project === `${selectedProject} | ${selectedEnv}`
  );

  // List files for the selected product using backend
  useEffect(() => {
    if (!selectedProject || !selectedEnv || !selectedProduct) {
      setAvailableFiles([]);
      return;
    }
    const prod = products.find(
      (p) =>
        p.project === `${selectedProject} | ${selectedEnv}` &&
        p.name === selectedProduct
    );
    if (!prod) {
      setAvailableFiles([]);
      return;
    }
    let relPath = prod.path
      .replace(/^([A-Za-z]:\\Users\\Murthy Manda\\Workbench\\)/, "")
      .replace(/\\/g, "/");
    fetch(`/api/list-files?dir=${encodeURIComponent(relPath)}`)
      .then((resp) => resp.json())
      .then((files) => {
        // Filter files by pattern
        let pattern = prod.pattern.trim();
        let regex = null;
        if (pattern === "*.*") {
          regex = /.+\..+$/i;
        } else {
          let regexPattern = pattern
            .replace(/[.+^${}()|[\\]\\]/g, "\\$&")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".");
          regex = new RegExp("^" + regexPattern + "$", "i");
          if (pattern.startsWith("*") && pattern.endsWith("*")) {
            regex = new RegExp(regexPattern, "i");
          } else if (pattern.startsWith("*")) {
            regex = new RegExp(regexPattern + "$", "i");
          } else if (pattern.endsWith("*")) {
            regex = new RegExp("^" + regexPattern, "i");
          }
        }
        const filteredFiles = files.filter((f: string) => regex.test(f));
        setAvailableFiles(filteredFiles.map((f: string) => relPath + "/" + f));
      })
      .catch(() => setAvailableFiles([]));
  }, [selectedProject, selectedEnv, selectedProduct, products]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          mx: 0,
          my: 6,
          p: 3,
        }}
        component={Paper}
        elevation={3}
      >
        <Typography variant="h4" align="left" gutterBottom>
          Maker Process
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          mb={3}
          alignItems="flex-start"
          sx={{ width: "100%" }}
        >
          <FormControl sx={{ minWidth: 180, maxWidth: 250, flex: 1 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              value={currentRole}
              label="Role"
              onChange={(e) =>
                setCurrentRole(e.target.value as "Maker" | "Checker")
              }
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 250 } },
              }}
            >
              <MenuItem value="Maker">Maker</MenuItem>
              <MenuItem value="Checker">Checker</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180, maxWidth: 250, flex: 1 }}>
            <InputLabel id="project-label">Project</InputLabel>
            <Select
              labelId="project-label"
              value={selectedProject}
              label="Project"
              onChange={(e) => setSelectedProject(e.target.value)}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 250 } },
              }}
            >
              {projects.map((p: any) => (
                <MenuItem
                  key={p.id || `${p.name}-${p.environment}`}
                  value={p.name}
                  style={{ whiteSpace: "normal" }}
                >
                  {typeof p.name === "string" ? p.name : JSON.stringify(p.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180, maxWidth: 250, flex: 1 }}>
            <InputLabel id="env-label">Environment</InputLabel>
            <Select
              labelId="env-label"
              value={selectedEnv}
              label="Environment"
              onChange={(e) => setSelectedEnv(e.target.value)}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 250 } },
              }}
            >
              {environments.map((env: any) => (
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
          <FormControl sx={{ minWidth: 180, maxWidth: 250, flex: 1 }}>
            <InputLabel id="product-label">Product</InputLabel>
            <Select
              labelId="product-label"
              value={selectedProduct}
              label="Product"
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={!selectedProject || !selectedEnv}
              MenuProps={{
                PaperProps: { style: { maxHeight: 300, width: 250 } },
              }}
            >
              {filteredProducts.map((prod: any) => (
                <MenuItem
                  key={prod.id || prod.name}
                  value={prod.name}
                  style={{ whiteSpace: "normal" }}
                >
                  {typeof prod.name === "string"
                    ? prod.name
                    : JSON.stringify(prod.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {/* Only show file actions if all are selected */}
        {selectedProject && selectedEnv && selectedProduct ? (
          <Box>
            <Typography variant="h6" align="left" gutterBottom>
              Files Available for: {selectedProduct}
            </Typography>
            {availableFiles.length === 0 ? (
              <Alert severity="info">
                No files found matching the product pattern.
              </Alert>
            ) : (
              <List sx={{ width: "100%" }}>
                {availableFiles.map((file) => (
                  <ListItem
                    key={file}
                    divider
                    sx={{ pl: 0, pr: 0, display: "flex", alignItems: "center" }}
                    secondaryAction={null}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        textAlign: "left",
                        wordBreak: "break-all",
                      }}
                    >
                      {file}
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ ml: 2 }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            // Download v0 (workspace) file from backend
                            const apiResp = await fetch(
                              `/api/file?path=${encodeURIComponent(file)}`
                            );
                            if (apiResp.ok) {
                              const blob = await apiResp.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download =
                                file.split("/").pop() || "downloaded_file";
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              window.URL.revokeObjectURL(url);
                              setSnackbar({
                                open: true,
                                message: `Downloaded: ${file.split("/").pop()}`,
                              });
                              return;
                            }
                            throw new Error(
                              "File not found or cannot be downloaded."
                            );
                          } catch (err: any) {
                            setSnackbar({
                              open: true,
                              message: err.message || "Download failed.",
                            });
                          }
                        }}
                      >
                        Download
                      </Button>
                      <Button size="small" variant="outlined" component="label">
                        Upload
                        <input
                          type="file"
                          accept=".csv,.txt"
                          hidden
                          onChange={async (e) => {
                            const fileObj = e.target.files && e.target.files[0];
                            if (!fileObj) {
                              setSnackbar({
                                open: true,
                                message: "No file selected for upload.",
                              });
                              setSnackbarAction(null);
                              return;
                            }
                            try {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const uploadedContent = event.target
                                  ?.result as string;
                                // Use ISO timestamp for version label, match backend pattern
                                const now = new Date();
                                const iso = now
                                  .toISOString()
                                  .replace(/:/g, "-");
                                // versioned file: base.csv.2025-06-21T03-24-53.199Z.diff.json
                                const baseName = file.split("/").pop() || file;
                                const dirName = file.substring(
                                  0,
                                  file.lastIndexOf("/")
                                );
                                const versionedFile = `${dirName}/${baseName}.${iso}.diff.json`;
                                await writeFile(versionedFile, uploadedContent);
                                // Refresh version list
                                const resp = await fetch(
                                  `/api/list-versions?file=${encodeURIComponent(
                                    file
                                  )}`
                                );
                                const versions = resp.ok
                                  ? await resp.json()
                                  : [];
                                setVersionList(versions);
                                setSnackbar({
                                  open: true,
                                  message: "File Uploaded.",
                                });
                                // Find the latest versioned file
                                const vN = versions.find(
                                  (v: any) => !v.isCurrent
                                );
                                if (vN) {
                                  setSnackbarAction(
                                    <Button
                                      color="secondary"
                                      size="small"
                                      onClick={() => {
                                        window.open(
                                          `/diff?v0=${encodeURIComponent(
                                            file
                                          )}&vN=${encodeURIComponent(
                                            vN.file
                                          )}&versionLabel=${encodeURIComponent(
                                            vN.versionLabel
                                          )}&uploadedAt=${encodeURIComponent(
                                            vN.uploadedAt
                                          )}`,
                                          "_blank"
                                        );
                                      }}
                                    >
                                      View Diff
                                    </Button>
                                  );
                                  // Open the version modal to show the new version
                                  setVersionModalFile(file);
                                  setVersionModalOpen(true);
                                } else {
                                  setSnackbarAction(null);
                                }
                              };
                              reader.readAsText(fileObj);
                            } catch (err: any) {
                              setSnackbar({
                                open: true,
                                message: err.message || "Upload failed.",
                              });
                              setSnackbarAction(null);
                            }
                          }}
                        />
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          // Fetch versions for this file from backend
                          try {
                            const relFile = file;
                            const resp = await fetch(
                              `/api/list-versions?file=${encodeURIComponent(
                                relFile
                              )}`
                            );
                            if (!resp.ok)
                              throw new Error("Failed to fetch versions");
                            const versions = await resp.json();
                            setVersionModalFile(file);
                            setVersionList(versions);
                            setVersionModalOpen(true);
                          } catch (err: any) {
                            setSnackbar({
                              open: true,
                              message:
                                err.message || "Failed to fetch versions.",
                            });
                          }
                        }}
                      >
                        Display Versions
                      </Button>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ) : (
          <Alert severity="info">
            Select a project, environment, and product to view file actions.
          </Alert>
        )}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ open: false, message: "" })}
          message={snackbar.message}
          action={snackbarAction}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
        <VersionListModal
          open={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          file={versionModalFile || ""}
          versions={versionList}
          onViewDiff={(versionLabel: string) => {
            // Find the version info
            const v = versionList.find(
              (v: any) => v.versionLabel === versionLabel
            );
            if (!versionModalFile) return;
            if (versionLabel === "V0 (Workspace)") {
              window.open(
                `/diff?v0=${encodeURIComponent(
                  versionModalFile
                )}&vN=${encodeURIComponent(
                  versionModalFile
                )}&versionLabel=${encodeURIComponent(versionLabel)}`,
                "_blank"
              );
              return;
            }
            if (v && v.file) {
              window.open(
                `/diff?v0=${encodeURIComponent(
                  versionModalFile
                )}&vN=${encodeURIComponent(
                  v.file
                )}&versionLabel=${encodeURIComponent(
                  versionLabel
                )}&uploadedAt=${encodeURIComponent(v.uploadedAt)}`,
                "_blank"
              );
            }
          }}
          onDownload={async (versionLabel: string) => {
            // Download logic for V0 and versioned files
            try {
              let downloadPath = versionModalFile || "";
              if (versionLabel !== "V0 (Workspace)") {
                // Find the versioned file path from versionList
                const v = versionList.find(
                  (v: any) => v.versionLabel === versionLabel
                );
                if (v && v.file) downloadPath = v.file;
              }
              const apiResp = await fetch(
                `/api/file?path=${encodeURIComponent(downloadPath)}`
              );
              if (apiResp.ok) {
                const blob = await apiResp.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = downloadPath.split("/").pop() || "downloaded_file";
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                setSnackbar({
                  open: true,
                  message: `Downloaded: ${downloadPath.split("/").pop()}`,
                });
                return;
              }
              throw new Error("File not found or cannot be downloaded.");
            } catch (err: any) {
              setSnackbar({
                open: true,
                message: err.message || "Download failed.",
              });
            }
          }}
          onDrop={async (versionLabel: string) => {
            // Optionally implement version deletion
            setSnackbar({
              open: true,
              message: `Drop version: ${versionLabel}`,
            });
          }}
        />
      </Box>
    </Box>
  );
};

export default Maker;
