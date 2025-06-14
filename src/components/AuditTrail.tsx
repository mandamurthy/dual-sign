import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  TextField,
  MenuItem,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ListItemButton from "@mui/material/ListItemButton";

// Utility to fetch audit index from backend or public folder
async function fetchAuditIndex() {
  const resp = await fetch(
    "/DTCC_Rewrite/Audit/diff-audit-log/audit-index.json"
  );
  if (!resp.ok) throw new Error("Failed to load audit index");
  return await resp.json();
}

// Utility to fetch audit log JSON by relative path
async function fetchAuditLog(relPath: string) {
  const resp = await fetch(
    `/DTCC_Rewrite/Audit/diff-audit-log/${relPath.replace(/\\/g, "/")}`
  );
  if (!resp.ok) throw new Error("Failed to load audit log");
  return await resp.json();
}

const AuditTrail: React.FC = () => {
  const [auditIndex, setAuditIndex] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    project: "",
    file: "",
    maker: "",
    checker: "",
    action: "",
    date: "",
  });
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [logDetails, setLogDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchAuditIndex()
      .then(setAuditIndex)
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, []);

  // Filtering logic
  const filtered = auditIndex.filter((entry) => {
    if (filter.project && entry.project_name !== filter.project) return false;
    if (filter.file && !entry.file_name.includes(filter.file)) return false;
    if (filter.maker && entry.maker !== filter.maker) return false;
    if (filter.checker && entry.checker !== filter.checker) return false;
    if (filter.action && entry.check_action !== filter.action) return false;
    if (filter.date && !entry.timestamp.startsWith(filter.date)) return false;
    return true;
  });

  // Unique values for dropdowns
  const projects = Array.from(new Set(auditIndex.map((e) => e.project_name)));
  const makers = Array.from(new Set(auditIndex.map((e) => e.maker)));
  const checkers = Array.from(new Set(auditIndex.map((e) => e.checker)));
  const actions = Array.from(new Set(auditIndex.map((e) => e.check_action)));

  // Load log details when selected
  useEffect(() => {
    if (!selectedLog) return;
    setLogDetails(null);
    fetchAuditLog(selectedLog.file)
      .then(setLogDetails)
      .catch(() => setLogDetails({ error: "Failed to load log details." }));
  }, [selectedLog]);

  return (
    <Box maxWidth={1100} mx="auto" my={6} p={3} component={Paper} elevation={3}>
      <Typography variant="h4" align="center" gutterBottom>
        Audit Trail
      </Typography>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          select
          label="Project"
          value={filter.project}
          onChange={(e) =>
            setFilter((f) => ({ ...f, project: e.target.value }))
          }
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {projects.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="File"
          value={filter.file}
          onChange={(e) => setFilter((f) => ({ ...f, file: e.target.value }))}
          size="small"
        />
        <TextField
          select
          label="Maker"
          value={filter.maker}
          onChange={(e) => setFilter((f) => ({ ...f, maker: e.target.value }))}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {makers.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Checker"
          value={filter.checker}
          onChange={(e) =>
            setFilter((f) => ({ ...f, checker: e.target.value }))
          }
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {checkers.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Action"
          value={filter.action}
          onChange={(e) => setFilter((f) => ({ ...f, action: e.target.value }))}
          size="small"
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {actions.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Date (YYYY-MM-DD)"
          value={filter.date}
          onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
          size="small"
        />
        <Button
          variant="outlined"
          onClick={() =>
            setFilter({
              project: "",
              file: "",
              maker: "",
              checker: "",
              action: "",
              date: "",
            })
          }
        >
          Clear
        </Button>
      </Stack>
      {loading ? (
        <Alert severity="info">Loading...</Alert>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">No audit events found.</Alert>
      ) : (
        <List>
          {filtered.map((entry, idx) => (
            <ListItem key={idx} divider disablePadding>
              <ListItemButton
                onClick={() => setSelectedLog(entry)}
                sx={{ cursor: "pointer" }}
              >
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  width="100%"
                >
                  <Box flex={1}>
                    <Typography fontWeight={600}>
                      {entry.file_name.split("/").pop()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {entry.timestamp} | Maker: {entry.maker} | Checker:{" "}
                      {entry.checker} | Action: {entry.check_action}
                    </Typography>
                  </Box>
                  <Chip
                    label={entry.project_name}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={entry.environment}
                    color="secondary"
                    size="small"
                  />
                </Stack>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent dividers>
          {logDetails ? (
            logDetails.error ? (
              <Alert severity="error">{logDetails.error}</Alert>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  File: {logDetails.file_name}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Project: {logDetails.project_name} | Env:{" "}
                  {logDetails.environment} | Timestamp: {logDetails.timestamp}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Maker: {logDetails.maker} ({logDetails.maker_comment})
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Checker: {logDetails.checker} ({logDetails.checker_comment})
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Action: {logDetails.check_action}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <b>Diff:</b>
                  <pre
                    style={{
                      background: "#f5f5f5",
                      padding: 8,
                      borderRadius: 4,
                      maxHeight: 300,
                      overflow: "auto",
                    }}
                  >
                    {logDetails.diff_text}
                  </pre>
                </Typography>
              </Box>
            )
          ) : (
            <Alert severity="info">Loading...</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
          {logDetails && !logDetails.error && (
            <Button
              onClick={() => {
                const blob = new Blob([JSON.stringify(logDetails, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${logDetails.file_name.split("/").pop()}_${
                  logDetails.timestamp
                }.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              variant="outlined"
            >
              Download JSON
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditTrail;
