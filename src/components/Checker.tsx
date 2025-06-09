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
  const handleApprove = (task: CheckerTask, comment: string) => {
    try {
      const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
      const data = JSON.parse(localStorage.getItem(key) || "{}");
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
  const handleApproveSubmit = (task: CheckerTask, comment: string) => {
    try {
      const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
      const data = JSON.parse(localStorage.getItem(key) || "{}");
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
