import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  Typography,
  Box,
  Snackbar,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  TextField,
  Chip,
} from "@mui/material";
import { writeFile } from "../api/fileApi";

interface VersionInfo {
  versionLabel: string;
  uploadedAt: string;
  status?: string;
  isCurrent?: boolean;
}

interface VersionListModalProps {
  open: boolean;
  onClose: () => void;
  file: string;
  versions: VersionInfo[];
  onViewDiff: (versionLabel: string) => void;
  onDownload: (versionLabel: string) => void;
  onDrop: (versionLabel: string) => void;
}

const VersionListModal: React.FC<VersionListModalProps> = ({
  open,
  onClose,
  file,
  versions,
  onViewDiff,
  onDownload,
  onDrop,
}) => {
  const [confirmDrop, setConfirmDrop] = useState<null | string>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [sendToCheckerVersion, setSendToCheckerVersion] = useState<
    string | null
  >(null);
  const [makerComment, setMakerComment] = useState("");
  const [makerCommentError, setMakerCommentError] = useState("");

  // Helper to get checker status/comment for a version
  const getCheckerTask = (file: string, versionLabel: string) => {
    try {
      const tasks = JSON.parse(
        localStorage.getItem("dualSignCheckerTasks") || "[]"
      );
      return tasks.find(
        (t: any) => t.file === file && t.versionLabel === versionLabel
      );
    } catch {
      return null;
    }
  };

  // Helper to check if any version is pending approval
  const anyPendingApproval = versions.some((v) => {
    const checkerTask = !v.isCurrent
      ? getCheckerTask(file, v.versionLabel)
      : null;
    return checkerTask && checkerTask.status === "Pending";
  });

  // Helper to get product info for the current file
  const getProductForFile = (file: string) => {
    try {
      const products = JSON.parse(
        localStorage.getItem("dualSignProducts") || "[]"
      );
      // Find product whose path is a prefix of the file path
      return products.find((p: any) => file.startsWith(p.path));
    } catch {
      return null;
    }
  };

  // Handler for Submit button
  const handleSubmit = (versionLabel: string) => {
    const product = getProductForFile(file);
    if (!product) {
      setSnackbar({
        open: true,
        message: "Product info not found for this file.",
      });
      return;
    }
    const submitFileName = `${product.name}${product.submitPrefix}.txt`;
    const submitFilePath = `${product.path}/${submitFileName}`.replace(
      /\\/g,
      "/"
    );
    writeFile(
      submitFilePath,
      `Submitted by Maker at ${new Date().toLocaleString()}`
    )
      .then(() => {
        // Update checker task status to SUBMITTED
        const tasks = JSON.parse(
          localStorage.getItem("dualSignCheckerTasks") || "[]"
        );
        const idx = tasks.findIndex(
          (t: any) => t.file === file && t.versionLabel === versionLabel
        );
        if (idx !== -1) {
          tasks[idx].status = "SUBMITTED";
          localStorage.setItem("dualSignCheckerTasks", JSON.stringify(tasks));
        }
        setSnackbar({
          open: true,
          message: `Submit file created: ${submitFileName}`,
        });
      })
      .catch(() => {
        setSnackbar({ open: true, message: "Failed to create submit file." });
      });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Versions for {file.split("/").pop()}</DialogTitle>
      <DialogContent>
        <List>
          {versions.map((v) => {
            const checkerTask = !v.isCurrent
              ? getCheckerTask(file, v.versionLabel)
              : null;
            const status = checkerTask ? checkerTask.status : v.status;
            const makerCommentVal =
              checkerTask && checkerTask.makerComment
                ? checkerTask.makerComment
                : null;
            const isPending = checkerTask && checkerTask.status === "Pending";
            const isSubmitted =
              checkerTask && checkerTask.status === "SUBMITTED";
            return (
              <ListItem
                key={v.versionLabel}
                divider
                sx={v.isCurrent ? { background: "#e3f2fd" } : {}}
              >
                <Box flex={1}>
                  <Typography variant="subtitle2">
                    {v.versionLabel} {v.isCurrent ? "(Current)" : ""}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uploaded: {v.uploadedAt}
                    {status ? ` | Status: ${status}` : ""}
                  </Typography>
                  {/* Maker and Checker action/comments as full-width lines below version info, above buttons */}
                  {makerCommentVal && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                        mt: 1,
                      }}
                    >
                      <Chip
                        label="Maker"
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 70 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#1976d2",
                          fontWeight: 500,
                          width: "100%",
                          whiteSpace: "pre-line",
                          wordBreak: "break-word",
                        }}
                        component="div"
                      >
                        {makerCommentVal}
                      </Typography>
                    </Box>
                  )}
                  {checkerTask &&
                    checkerTask.status &&
                    checkerTask.status !== "Pending" && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                          mt: 0.5,
                        }}
                      >
                        <Chip
                          label={`Checker: ${checkerTask.status}`}
                          color={
                            checkerTask.status === "Approved"
                              ? "success"
                              : checkerTask.status === "Rejected"
                              ? "error"
                              : "default"
                          }
                          size="small"
                          sx={{ fontWeight: 600, minWidth: 120 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#333",
                            fontWeight: 500,
                            width: "100%",
                            whiteSpace: "pre-line",
                            wordBreak: "break-word",
                          }}
                          component="div"
                        >
                          {checkerTask.comment}
                        </Typography>
                      </Box>
                    )}
                </Box>
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                  {!v.isCurrent && (
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 90, borderRadius: 2 }}
                      onClick={() => onViewDiff(v.versionLabel)}
                    >
                      View Diff
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 90, borderRadius: 2 }}
                    onClick={() => onDownload(v.versionLabel)}
                  >
                    Download
                  </Button>
                  {!v.isCurrent && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      sx={{ minWidth: 120, borderRadius: 2 }}
                      onClick={() => setSendToCheckerVersion(v.versionLabel)}
                      disabled={anyPendingApproval || isPending}
                    >
                      Send To Checker
                    </Button>
                  )}
                  {/* New SUBMIT button, enabled only if checker action is Approved */}
                  {!v.isCurrent && (
                    <Button
                      variant="contained"
                      size="small"
                      color={isSubmitted ? "info" : "success"}
                      sx={{ minWidth: 100, borderRadius: 2 }}
                      disabled={
                        !(checkerTask && checkerTask.status === "Approved") ||
                        isSubmitted
                      }
                      onClick={() => handleSubmit(v.versionLabel)}
                    >
                      {isSubmitted ? "SUBMITTED" : "Submit"}
                    </Button>
                  )}
                  {/* Drop Approval button */}
                  {!v.isCurrent && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      sx={{ minWidth: 120, borderRadius: 2 }}
                      disabled={!isPending}
                      onClick={() => {
                        // Remove the checker task for this version
                        const tasks = JSON.parse(
                          localStorage.getItem("dualSignCheckerTasks") || "[]"
                        );
                        const updated = tasks.filter(
                          (t: any) =>
                            !(
                              t.file === file &&
                              t.versionLabel === v.versionLabel
                            )
                        );
                        localStorage.setItem(
                          "dualSignCheckerTasks",
                          JSON.stringify(updated)
                        );
                        setSnackbar({
                          open: true,
                          message: "Approval request dropped.",
                        });
                      }}
                    >
                      Drop Approval
                    </Button>
                  )}
                  {!v.isCurrent && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      sx={{ minWidth: 90, borderRadius: 2 }}
                      onClick={() => setConfirmDrop(v.versionLabel)}
                    >
                      Drop Version
                    </Button>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
        {/* Send To Checker comment dialog */}
        <MuiDialog
          open={!!sendToCheckerVersion}
          onClose={() => {
            setSendToCheckerVersion(null);
            setMakerComment("");
            setMakerCommentError("");
          }}
          maxWidth="xs"
          fullWidth
        >
          <MuiDialogTitle>Send To Checker</MuiDialogTitle>
          <MuiDialogContent>
            <TextField
              label="Comment (required)"
              value={makerComment}
              onChange={(e) => setMakerComment(e.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
              error={!!makerCommentError}
              helperText={
                makerCommentError || "Please provide context for the checker."
              }
              sx={{ mt: 1 }}
            />
          </MuiDialogContent>
          <MuiDialogActions>
            <Button
              onClick={() => {
                setSendToCheckerVersion(null);
                setMakerComment("");
                setMakerCommentError("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                if (!makerComment.trim()) {
                  setMakerCommentError("Comment is required.");
                  return;
                }
                setMakerCommentError("");
                const vLabel = sendToCheckerVersion;
                const tasks = JSON.parse(
                  localStorage.getItem("dualSignCheckerTasks") || "[]"
                );
                if (
                  !tasks.find(
                    (t: any) => t.file === file && t.versionLabel === vLabel
                  )
                ) {
                  const v = versions.find((ver) => ver.versionLabel === vLabel);
                  tasks.push({
                    id: `${file}__${vLabel}`,
                    file,
                    versionLabel: vLabel,
                    uploadedAt: v?.uploadedAt || "",
                    maker: "Maker",
                    status: "Pending",
                    content: null,
                    makerComment: makerComment.trim(),
                  });
                  localStorage.setItem(
                    "dualSignCheckerTasks",
                    JSON.stringify(tasks)
                  );
                  setSnackbar({ open: true, message: "Task sent to Checker." });
                } else {
                  setSnackbar({
                    open: true,
                    message: "This version is already sent to Checker.",
                  });
                }
                setSendToCheckerVersion(null);
                setMakerComment("");
              }}
            >
              Send
            </Button>
          </MuiDialogActions>
        </MuiDialog>
        {/* Drop confirmation dialog */}
        <Dialog open={!!confirmDrop} onClose={() => setConfirmDrop(null)}>
          <DialogTitle>Confirm Drop Version</DialogTitle>
          <DialogContent>
            Are you sure you want to permanently delete this version?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDrop(null)}>Cancel</Button>
            <Button
              color="error"
              onClick={() => {
                onDrop(confirmDrop!);
                setConfirmDrop(null);
              }}
            >
              Drop
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ open: false, message: "" })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Dialog>
  );
};

export default VersionListModal;
