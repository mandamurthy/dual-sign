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
  TextField,
  Stack,
} from "@mui/material";

export interface CheckerTask {
  id: string;
  file: string;
  versionLabel: string;
  uploadedAt: string;
  maker: string;
  status: string;
  content: string;
  comment?: string;
  makerComment?: string; // Add makerComment to CheckerTask interface
}

interface CheckerTaskModalProps {
  open: boolean;
  onClose: () => void;
  task: CheckerTask | null;
  onViewDiff: (task: CheckerTask) => void;
  onDownload: (task: CheckerTask) => void;
  onApprove: (task: CheckerTask, comment: string) => void;
  onReject: (task: CheckerTask, comment: string) => void;
  onApproveSubmit: (task: CheckerTask, comment: string) => void;
}

const CheckerTaskModal: React.FC<CheckerTaskModalProps> = ({
  open,
  onClose,
  task,
  onViewDiff,
  onDownload,
  onApprove,
  onReject,
  onApproveSubmit,
}) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  if (!task) return null;
  const handleAction = (
    action: (task: CheckerTask, comment: string) => void
  ) => {
    if (!comment.trim()) {
      setError("Comment is required.");
      return;
    }
    setError("");
    action(task, comment);
    setComment("");
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Review Task: {task.file.split("/").pop()} ({task.versionLabel})
      </DialogTitle>
      <DialogContent>
        {task.makerComment && (
          <Typography variant="body2" color="primary" mb={2}>
            Maker Comment: {task.makerComment}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" mb={2}>
          Uploaded: {task.uploadedAt} | Maker: {task.maker}
        </Typography>
        <Stack direction="row" spacing={1} mb={2}>
          <Button variant="outlined" onClick={() => onViewDiff(task)}>
            View Diff
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              // Download the file content for this version, with timestamp in filename
              const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
              const data = JSON.parse(localStorage.getItem(key) || "{}");
              const blob = new Blob([data.content || ""], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              // Format uploadedAt as YYYYMMDDHHmmss
              let ts = "";
              if (task.uploadedAt) {
                const d = new Date(task.uploadedAt);
                const pad = (n: number) => n.toString().padStart(2, "0");
                ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
                  d.getDate()
                )}${pad(d.getHours())}${pad(d.getMinutes())}${pad(
                  d.getSeconds()
                )}`;
              }
              const base = task.file.split("/").pop() || "file";
              const filename = `${base}_${task.versionLabel}${
                ts ? `_${ts}` : ""
              }.csv`;
              const a = document.createElement("a");
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }}
          >
            Download
          </Button>
        </Stack>
        <TextField
          label="Comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          fullWidth
          required
          multiline
          minRows={2}
          error={!!error}
          helperText={error}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          color="success"
          variant="contained"
          onClick={() => handleAction(onApprove)}
        >
          Approve
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => handleAction(onReject)}
        >
          Reject
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => handleAction(onApproveSubmit)}
        >
          Approve & Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckerTaskModal;
