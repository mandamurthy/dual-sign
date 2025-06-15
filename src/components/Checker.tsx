import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Button,
  Stack,
  Chip,
  Snackbar,
} from "@mui/material";
import CheckerTaskModal from "./CheckerTaskModal";
import type { CheckerTask } from "./CheckerTaskModal";
import { writeFile } from "../api/fileApi";
import { postAuditLog } from "../api/auditLogApi";
import { readFile } from "../api/fileApi";
import {
  formatAuditDiffFromViewer,
  parseCsvToArray,
  getVersionedContentsForDiff,
  getDiffRowsForLines,
  formatAuditDiffLines,
} from "./diffUtils";

const getCheckerTasks = (): CheckerTask[] => {
  try {
    return JSON.parse(localStorage.getItem("dualSignCheckerTasks") || "[]");
  } catch {
    return [];
  }
};

const Checker: React.FC = () => {
  const [tasks, setTasks] = useState<CheckerTask[]>(getCheckerTasks());
  const [selectedTask, setSelectedTask] = useState<CheckerTask | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  useEffect(() => {
    const sync = () => setTasks(getCheckerTasks());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const handleViewDiff = (task: CheckerTask) => {
    window.open(
      `/diff?v0=${encodeURIComponent(task.file)}&vN=${encodeURIComponent(
        `dualSignUpload_${task.file}_${task.versionLabel}`
      )}&versionLabel=${encodeURIComponent(
        task.versionLabel
      )}&uploadedAt=${encodeURIComponent(task.uploadedAt)}`,
      "_blank"
    );
    setSnackbar({ open: true, message: "Diff view opened in new tab." });
  };
  const handleApprove = async (task: CheckerTask, comment: string) => {
    console.debug("[AuditLog][DEBUG] handleApprove called", { task, comment });
    try {
      const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      let uploadedContent = data && data.content ? data.content : task.content;
      // --- Audit log integration: log BEFORE replacing file ---
      await logAuditEvent(task, comment, "Approved", uploadedContent);
      // Now replace the file
      if (data && data.content) {
        writeFile(task.file, data.content);
      }
      updateTaskStatus(task, "Approved", comment);
      setSnackbar({
        open: true,
        message: "Version approved and file replaced.",
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Error during approve: " + (e as Error).message,
      });
    }
  };
  const handleReject = (task: CheckerTask, comment: string) => {
    updateTaskStatus(task, "Rejected", comment);
    setSnackbar({ open: true, message: "Version rejected." });
  };
  const handleApproveSubmit = async (task: CheckerTask, comment: string) => {
    try {
      const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
      const data = JSON.parse(localStorage.getItem(key) || "{}");
      let uploadedContent = data && data.content ? data.content : task.content;
      if (data && data.content) {
        writeFile(task.file, data.content);
      }
      updateTaskStatus(task, "Approved & Submitted", comment);
      const products = JSON.parse(
        localStorage.getItem("dualSignProducts") || "[]"
      );
      const product = products.find((p: any) => task.file.startsWith(p.path));
      if (product) {
        const submitFileName = `${product.name}${product.submitPrefix}.txt`;
        const submitFilePath = `${product.path}/${submitFileName}`.replace(
          /\\/g,
          "/"
        );
        writeFile(
          submitFilePath,
          `Submitted by Checker at ${new Date().toLocaleString()}`
        );
        setSnackbar({
          open: true,
          message: `Approved, file replaced, and submit file created: ${submitFileName}`,
        });
      } else {
        setSnackbar({
          open: true,
          message:
            "Approved, file replaced, but product info not found for submit file.",
        });
      }
      // --- Audit log integration ---
      await logAuditEvent(
        task,
        comment,
        "Approved & Submitted",
        uploadedContent
      );
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Error during approve & submit: " + (e as Error).message,
      });
    }
  };
  const updateTaskStatus = (
    task: CheckerTask,
    status: string,
    comment: string
  ) => {
    const updated = tasks.map((t) =>
      t.id === task.id ? { ...t, status, comment } : t
    );
    localStorage.setItem("dualSignCheckerTasks", JSON.stringify(updated));
    setTasks(updated);
    setSelectedTask(null);
  };

  // Helper to log audit event after approval
  async function logAuditEvent(
    task: CheckerTask,
    checkerComment: string,
    checkAction: string,
    uploadedContent?: string
  ) {
    console.debug("[AuditLog][DEBUG] logAuditEvent called", {
      task,
      checkerComment,
      checkAction,
    });
    try {
      // Get product and project info
      const products = JSON.parse(
        localStorage.getItem("dualSignProducts") || "[]"
      );
      // Normalize slashes for comparison
      const normalize = (p: string) => p.replace(/\\/g, "/");
      const productIndex = products.findIndex((p: any) =>
        normalize(task.file).startsWith(normalize(p.path))
      );
      const product = products.find((p: any) =>
        normalize(task.file).startsWith(normalize(p.path))
      );
      if (!product) {
        setSnackbar({
          open: true,
          message: "No product found for file. Please contact support.",
        });
        return;
      }
      if (!("project" in product)) {
        setSnackbar({
          open: true,
          message:
            "Product info missing 'project' property. Please contact support.",
        });
        return;
      }
      if (product.project == null) {
        setSnackbar({
          open: true,
          message:
            "Product 'project' property is missing. Please contact support.",
        });
        return;
      }
      if (
        typeof product.project !== "string" ||
        !product.project.includes("|")
      ) {
        setSnackbar({
          open: true,
          message:
            "Product 'project' property is invalid. Please contact support.",
        });
        return;
      }
      let projectName = "";
      let environment = "";
      try {
        [projectName, environment] = product.project
          .split("|")
          .map((s: string) => s.trim());
      } catch (splitErr) {
        setSnackbar({
          open: true,
          message: "Error processing product info. Please contact support.",
        });
        return;
      }
      const projectsRaw = localStorage.getItem("dualSignProjects");
      let projects: any[] = [];
      try {
        projects = JSON.parse(projectsRaw || "[]");
        if (!Array.isArray(projects)) {
          setSnackbar({
            open: true,
            message: "Project info is invalid. Please contact support.",
          });
          return;
        }
      } catch (parseErr) {
        setSnackbar({
          open: true,
          message: "Error loading project info. Please contact support.",
        });
        return;
      }
      const project = projects.find(
        (p: any) => p.name === projectName && p.environment === environment
      );
      if (!project) {
        setSnackbar({
          open: true,
          message: "No project found for this file. Please contact support.",
        });
        return;
      }
      // Get previous (current) and new (uploaded) file content for diff using shared utility
      let v0Content = "";
      let vNContent = "";
      try {
        const versioned = await getVersionedContentsForDiff(task);
        v0Content = versioned.v0Content;
        vNContent = versioned.vNContent;
        console.debug("[AuditLog][DEBUG] v0Content before parsing:", v0Content);
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Could not load file versions for diff.",
        });
        return;
      }
      if (!v0Content) {
        console.warn(
          "[AuditLog][WARN] v0Content is empty. No previous version found."
        );
      }
      // --- Enhanced diff logic based on Audit Log Granularity and Must Columns ---
      let diffText = "NO_DIFF";
      const auditLogGranularity = project?.auditLogGranularity || "Diff Lines";
      const mustColumns = (product?.auditMustColumns || "")
        .split("|")
        .map((s: string) => s.trim())
        .filter(Boolean);
      console.debug("[AuditLog][DEBUG] Before Diff Columns branch", {
        auditLogGranularity,
      });
      if (auditLogGranularity === "Diff Columns") {
        console.debug("[AuditLog][DEBUG] Inside Diff Columns branch");
        let diffRows: any[] = [];
        if (
          typeof window !== "undefined" &&
          (window as any).getDiffRowsForAudit
        ) {
          console.debug(
            "[AuditLog][DEBUG] getDiffRowsForAudit is available on window"
          );
          const v0Arr = parseCsvToArray(v0Content);
          const vnArr = parseCsvToArray(vNContent);
          const header = v0Arr[0] || vnArr[0] || [];
          const mustCols = mustColumns;
          // Step 2 Debug: Log raw inputs to getDiffRowsForAudit
          console.debug(
            "[AuditLog][STEP2][DEBUG] getDiffRowsForAudit inputs:",
            { v0Arr, vnArr, header, mustCols }
          );
          diffRows = (window as any).getDiffRowsForAudit(
            v0Arr,
            vnArr,
            header,
            mustCols
          );
        } else {
          console.debug(
            "[AuditLog][DEBUG] getDiffRowsForAudit is NOT available on window"
          );
        }
        // Step 1 Debug: Log captured Diff Viewer data
        console.debug(
          "[AuditLog][STEP1][DEBUG] Captured diffRows from Diff Viewer:",
          diffRows
        );
        diffText = formatAuditDiffFromViewer(diffRows, mustColumns);
      } else {
        // Diff Lines: show full row from both sides for changed rows using modular logic
        const v0Arr = parseCsvToArray(v0Content);
        const vnArr = parseCsvToArray(vNContent);
        const columns = v0Arr[0] || vnArr[0] || [];
        const diffRows = getDiffRowsForLines(
          v0Arr,
          vnArr,
          columns,
          mustColumns
        );
        diffText = formatAuditDiffLines(diffRows, columns);
      }
      const payload = {
        auditPath: project.auditPath,
        auditCaptureApproach: project.auditCaptureApproach,
        projectName,
        environment,
        fileName: task.file,
        maker: task.maker,
        makerComment: task.makerComment || "",
        checker: "Checker", // TODO: Replace with real user/session
        checkerComment,
        checkAction,
        diffText,
        auditRetentionDays: project.auditRetentionDays,
        timestamp: new Date().toISOString(),
      };
      try {
        await postAuditLog(payload);
        setSnackbar({
          open: true,
          message: "Audit log recorded.",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Audit log failed. Please contact support.",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Audit log failed: " + (err as Error).message,
      });
      // Removed debug output for production
    }
  }

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
          Checker Tasks
        </Typography>
        {tasks.filter((t) => t.status === "Pending").length === 0 ? (
          <Typography color="text.secondary">
            No Pending tasks in queue.
          </Typography>
        ) : (
          <List>
            {tasks
              .filter((t) => t.status === "Pending")
              .map((task) => (
                <ListItem
                  key={task.id}
                  divider
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#f9f9f9",
                    borderRadius: 2,
                    mb: 1,
                  }}
                  secondaryAction={null}
                >
                  <Box>
                    <Typography fontWeight={600}>
                      {task.file.split("/").pop()} ({task.versionLabel})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uploaded: {task.uploadedAt} | Maker: {task.maker}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={task.status} color="warning" />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setSelectedTask(task)}
                    >
                      Review
                    </Button>
                  </Stack>
                </ListItem>
              ))}
          </List>
        )}
        <CheckerTaskModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onViewDiff={handleViewDiff}
          onDownload={() => {}}
          onApprove={handleApprove}
          onReject={handleReject}
          onApproveSubmit={handleApproveSubmit}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={2500}
          onClose={() => setSnackbar({ open: false, message: "" })}
          message={snackbar.message}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Box>
    </Box>
  );
};

export default Checker;
