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
import { readFile, writeFile } from "../api/fileApi";

// Helper to get environments, projects, and products from localStorage
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
const getProducts = () => {
  try {
    return JSON.parse(localStorage.getItem("dualSignProducts") || "[]");
  } catch {
    return [] as any[];
  }
};

const Maker: React.FC = () => {
  const [projects, setProjects] = useState<any[]>(() => getProjects());
  const [environments, setEnvironments] = useState<string[]>(() => getEnvs());
  const [products, setProducts] = useState<any[]>(() => getProducts());
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEnv, setSelectedEnv] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  // Sync with localStorage changes
  useEffect(() => {
    const sync = () => {
      setProjects(getProjects());
      setEnvironments(getEnvs());
      setProducts(getProducts());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Filter products for selected project/env
  const filteredProducts = products.filter(
    (prod) => prod.project === `${selectedProject} | ${selectedEnv}`
  );

  // List files from workspace folder for the selected product (real demo)
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  React.useEffect(() => {
    if (!selectedProject || !selectedEnv || !selectedProduct) {
      setAvailableFiles([]);
      return;
    }
    // Find the selected product's path and pattern
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
    console.debug("[MakerChecker] Raw product path:", prod.path);
    console.debug("[MakerChecker] Normalized relPath:", relPath);
    console.debug("[MakerChecker] Pattern:", prod.pattern);
    // Simulated file list for demo
    let allFiles = [
      "DTCC_Rewrite/Working/EQUITIES/CSV/EQ_File_City.csv",
      "DTCC_Rewrite/Working/EQUITIES/CSV/EQ_File_Address.csv",
      "DTCC_Rewrite/Working/EQUITIES/CSV/New Text Document.txt",
    ];
    // Filter files by pattern (e.g., '*.csv', '*City*', etc.)
    let pattern = prod.pattern.trim();
    let regex = null;
    if (pattern === "*.*") {
      regex = /.+\..+$/i;
    } else {
      // Convert wildcard pattern to regex: '*' -> '.*', '?' -> '.'
      // Escape regex special chars except * and ?
      let regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*")
        .replace(/\?/g, ".");
      regex = new RegExp("^" + regexPattern + "$", "i");
      // For patterns like '*City*', allow match anywhere
      if (pattern.startsWith("*") && pattern.endsWith("*")) {
        regex = new RegExp(regexPattern, "i");
      } else if (pattern.startsWith("*")) {
        regex = new RegExp(regexPattern + "$", "i");
      } else if (pattern.endsWith("*")) {
        regex = new RegExp("^" + regexPattern, "i");
      }
    }
    const filteredFiles = allFiles.filter((f) =>
      regex.test(f.split("/").pop() || f)
    );
    setAvailableFiles(filteredFiles);
    console.debug("[MakerChecker] Filtered files:", filteredFiles);
  }, [selectedProject, selectedEnv, selectedProduct, products]);

  // Add debug logging for product selection and file listing
  React.useEffect(() => {
    if (selectedProduct) {
      const prodObj = products.find(
        (p) =>
          p.project === `${selectedProject} | ${selectedEnv}` &&
          p.name === selectedProduct
      );
      console.debug("[MakerChecker] Selected product name:", selectedProduct);
      console.debug("[MakerChecker] Selected product object:", prodObj);
      if (prodObj) {
        console.debug("[MakerChecker] Product path:", prodObj.path);
        console.debug("[MakerChecker] Product pattern:", prodObj.pattern);
        console.debug(
          "[MakerChecker] Product submitPrefix:",
          prodObj.submitPrefix
        );
      }
      console.debug("[MakerChecker] Available files:", availableFiles);
    }
  }, [selectedProduct, selectedProject, selectedEnv, products, availableFiles]);

  // Step 6: Role-Based Access Enforcement (simple simulation)
  // In a real app, get the current user and their roles from session/auth
  // For demo, allow toggling between Maker and Checker roles
  const [currentRole, setCurrentRole] = useState<"Maker" | "Checker">("Maker");

  // Step 7: UI/UX Enhancements - Add snackbars for feedback
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionModalFile, setVersionModalFile] = useState<string | null>(null);
  const [versionList, setVersionList] = useState<any[]>([]);

  // Helper to get file stats (e.g., last modified time) from the backend
  const getFileStat = async (
    relPath: string
  ): Promise<{ mtime: string } | null> => {
    try {
      const resp = await fetch(
        `http://localhost:3001/api/stat?path=${encodeURIComponent(relPath)}`
      );
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  };

  // Helper to get all versions for a file from localStorage
  const getVersionsForFile = async (file: string) => {
    const versions: any[] = [];
    // v0 (workspace)
    let v0UploadedAt = "-";
    const relPath = file.replace(/^.*public[\\/]/, "").replace(/\\/g, "/");
    const stat = await getFileStat(relPath);
    if (stat && stat.mtime) {
      v0UploadedAt = new Date(stat.mtime).toLocaleString();
    }
    versions.push({
      versionLabel: "V0 (Workspace)",
      uploadedAt: v0UploadedAt,
      status: "Current",
      isCurrent: true,
    });
    // Uploaded versions (find all dualSignUpload_<file>_VYYYYMMDDHHMMSS)
    const regex = new RegExp(
      `^dualSignUpload_${file.replace(
        /[-\\^$*+?.()|[\]{}]/g,
        "\\$&"
      )}_V(\\d{14})$`
    );
    const found = Object.keys(localStorage)
      .map((key) => {
        const m = key.match(regex);
        if (m) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || "{}") || {};
            return {
              versionLabel: `V${m[1]}`,
              uploadedAt: data.uploadedAt || "-",
              status: data.status || "Pending",
              isCurrent: false,
              key,
            };
          } catch {}
        }
        return null;
      })
      .filter((v) => v !== null);
    // Sort by version timestamp descending (latest first)
    found.sort((a, b) => b!.versionLabel.localeCompare(a!.versionLabel));
    versions.push(...found);
    return versions;
  };

  const handleUpload = async (file: string, uploadedContent: string) => {
    // Use timestamp for version label
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const versionTimestamp = `${now.getFullYear()}${pad(
      now.getMonth() + 1
    )}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(
      now.getSeconds()
    )}`;
    const versionKey = `dualSignUpload_${file}_V${versionTimestamp}`;
    const versionLabel = `V${versionTimestamp}`;
    const uploadedAt = now.toLocaleString();
    localStorage.setItem(
      versionKey,
      JSON.stringify({
        content: uploadedContent,
        versionLabel,
        uploadedAt,
        status: "Pending",
      })
    );
    setSnackbar({
      open: true,
      message: (
        <span>
          Upload successful.{" "}
          <a
            href="#"
            onClick={() => {
              window.open(
                `/diff?v0=${encodeURIComponent(file)}&vN=${encodeURIComponent(
                  versionKey
                )}&versionLabel=${encodeURIComponent(
                  versionLabel
                )}&uploadedAt=${encodeURIComponent(uploadedAt)}`,
                "_blank"
              );
            }}
          >
            View Diff
          </a>
        </span>
      ) as any,
    });
  };

  const handleDropVersion = async (versionLabel: string) => {
    if (!versionModalFile) return;
    // Find the key for this version
    const key = Object.keys(localStorage).find(
      (k) =>
        k.startsWith(`dualSignUpload_${versionModalFile}_`) &&
        localStorage.getItem(k)?.includes(`"${versionLabel}"`)
    );
    if (key) localStorage.removeItem(key);
    const versions = await getVersionsForFile(versionModalFile);
    setVersionList(versions);
  };

  const handleReplaceVersion = async (versionLabel: string) => {
    if (!versionModalFile) return;
    // Find the key for this version
    const key = Object.keys(localStorage).find(
      (k) =>
        k.startsWith(`dualSignUpload_${versionModalFile}_`) &&
        localStorage.getItem(k)?.includes(`"${versionLabel}"`)
    );
    if (key) {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      try {
        await writeFile(
          versionModalFile.replace(/^.*public[\\/]/, "").replace(/\\/g, "/"),
          data.content || ""
        );
        setSnackbar({
          open: true,
          message: `Workspace file replaced with ${versionLabel}`,
        });
        setVersionModalOpen(false);
        // Refresh version list if modal is reopened
        const versions = await getVersionsForFile(versionModalFile);
        setVersionList(versions);
      } catch (e) {
        setSnackbar({
          open: true,
          message: "Replace failed: " + (e as Error).message,
        });
      }
    }
  };

  const handleViewDiff = (versionLabel: string) => {
    if (!versionModalFile) return;
    // Find the key for this version
    if (versionLabel === "v0 (Workspace)") {
      // Compare v0 to itself (no diff)
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
    const key = `dualSignUpload_${versionModalFile}_${versionLabel}`;
    if (key in localStorage) {
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      window.open(
        `/diff?v0=${encodeURIComponent(
          versionModalFile
        )}&vN=${encodeURIComponent(key)}&versionLabel=${encodeURIComponent(
          versionLabel
        )}&uploadedAt=${encodeURIComponent(data.uploadedAt || "")}`,
        "_blank"
      );
    }
  };

  const handleDownloadVersion = async (versionLabel: string) => {
    console.debug("[DownloadVersion] versionLabel:", versionLabel);
    if (versionLabel.trim().toLowerCase() === "v0 (workspace)") {
      // Download the workspace file from backend API (consistent with Maker Process frame)
      try {
        // Enable debug mode for path
        console.debug("[V0 Download] versionModalFile:", versionModalFile);
        let rel = versionModalFile
          .replace(/^.*public[\\/]/, "")
          .replace(/\\/g, "/");
        console.debug("[V0 Download] rel path for API:", rel);
        const content = await readFile(rel);
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const base =
          rel
            .split("/")
            .pop()
            ?.replace(/\.csv$/i, "") || "downloaded_file";
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("[V0 Download] Error:", e);
        setSnackbar({
          open: true,
          message:
            "Download failed: " +
            (e as Error).message +
            ". Please check if the file exists in the workspace.",
        });
      }
    } else {
      // Find the key for this version
      const key = `dualSignUpload_${versionModalFile}_${versionLabel}`;
      if (key in localStorage) {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const blob = new Blob([data.content || ""], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const base =
          versionModalFile
            .split("/")
            .pop()
            ?.replace(/\.csv$/i, "") || "downloaded_file";
        const filename = `${base}_${versionLabel}.csv`;
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    }
  };

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
                  key={p.name + "-" + p.environment}
                  value={p.name}
                  style={{ whiteSpace: "normal" }}
                >
                  {p.name}
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
              {filteredProducts.map((prod) => (
                <MenuItem
                  key={prod.name}
                  value={prod.name}
                  style={{ whiteSpace: "normal" }}
                >
                  {prod.name}
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
                    sx={{
                      pl: 0,
                      pr: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
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
                            // Fetch file content from public folder (simulate workspace fetch)
                            const response = await fetch(`/${file}`);
                            if (!response.ok)
                              throw new Error(
                                "File not found or cannot be downloaded."
                              );
                            const blob = await response.blob();
                            // Create a link and trigger download
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
                              return;
                            }
                            try {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                const uploadedContent = event.target
                                  ?.result as string;
                                // Use timestamp for version label
                                const now = new Date();
                                const pad = (n: number) =>
                                  n.toString().padStart(2, "0");
                                const versionTimestamp = `${now.getFullYear()}${pad(
                                  now.getMonth() + 1
                                )}${pad(now.getDate())}${pad(
                                  now.getHours()
                                )}${pad(now.getMinutes())}${pad(
                                  now.getSeconds()
                                )}`;
                                const versionKey = `dualSignUpload_${file}_V${versionTimestamp}`;
                                const versionLabel = `V${versionTimestamp}`;
                                const uploadedAt = now.toLocaleString();
                                localStorage.setItem(
                                  versionKey,
                                  JSON.stringify({
                                    content: uploadedContent,
                                    versionLabel,
                                    uploadedAt,
                                    status: "Pending",
                                  })
                                );
                                setSnackbar({
                                  open: true,
                                  message: (
                                    <span>
                                      Upload successful.{" "}
                                      <a
                                        href="#"
                                        onClick={() => {
                                          window.open(
                                            `/diff?v0=${encodeURIComponent(
                                              file
                                            )}&vN=${encodeURIComponent(
                                              versionKey
                                            )}&versionLabel=${encodeURIComponent(
                                              versionLabel
                                            )}&uploadedAt=${encodeURIComponent(
                                              uploadedAt
                                            )}`,
                                            "_blank"
                                          );
                                        }}
                                      >
                                        View Diff
                                      </a>
                                    </span>
                                  ) as any,
                                });
                              };
                              reader.readAsText(fileObj);
                            } catch (err: any) {
                              setSnackbar({
                                open: true,
                                message: err.message || "Upload failed.",
                              });
                            }
                          }}
                        />
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          setVersionModalFile(file);
                          const versions = await getVersionsForFile(file);
                          setVersionList(versions);
                          setVersionModalOpen(true);
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
        {/* Step 7: Snackbar for feedback */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ open: false, message: "" })}
          message={snackbar.message}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
        <VersionListModal
          open={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          file={versionModalFile || ""}
          versions={versionList}
          onViewDiff={handleViewDiff}
          onDownload={handleDownloadVersion}
          onRestore={handleReplaceVersion}
          onDrop={handleDropVersion}
        />
      </Box>
      {/* ...existing code... */}
    </Box>
  );
};

export default Maker;
