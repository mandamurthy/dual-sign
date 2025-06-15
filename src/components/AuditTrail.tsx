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
import * as XLSX from "xlsx";

// TypeScript: declare a global property for the audit log existence cache
// @ts-ignore
if (typeof window !== "undefined" && !("auditLogExistenceCache" in window)) {
  // @ts-ignore
  window.auditLogExistenceCache = {};
}

// Utility to fetch audit index from backend or public folder
async function fetchAuditIndex() {
  const resp = await fetch(
    "/DTCC_Rewrite/Audit/diff-audit-log/audit-index.json"
  );
  if (!resp.ok) throw new Error("Failed to load audit index");
  return await resp.json();
}

// Helper to get projects from localStorage
function getProjects() {
  try {
    return JSON.parse(localStorage.getItem("dualSignProjects") || "[]");
  } catch {
    return [];
  }
}

const AuditTrail: React.FC = () => {
  const [auditIndex, setAuditIndex] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>(getProjects());
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
  const [cacheVersion, setCacheVersion] = useState(0);

  useEffect(() => {
    // Force clear cache and re-render on mount
    if (
      typeof window !== "undefined" &&
      (window as any).auditLogExistenceCache
    ) {
      (window as any).auditLogExistenceCache = {};
    }
    setLoading(true);
    fetchAuditIndex()
      .then(setAuditIndex)
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
    setProjects(getProjects());
  }, []);

  // Refresh handler to reload audit index and clear cache
  const handleRefresh = () => {
    setLoading(true);
    // @ts-ignore
    if (typeof window !== "undefined" && window.auditLogExistenceCache) {
      // @ts-ignore
      window.auditLogExistenceCache = {};
    }
    fetchAuditIndex()
      .then(setAuditIndex)
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
    setProjects(getProjects());
  };

  // Helper to get audit log file path for an entry
  function getAuditLogPath(entry: any) {
    const project = projects.find(
      (p: any) =>
        p.name === entry.project_name && p.environment === entry.environment
    );
    if (!project) return null;
    let base = project.auditPath.replace(/\\/g, "/");
    if (!base.endsWith("/")) base += "/";
    let relPath = "";
    if (project.auditCaptureApproach === "Date") {
      // Date-based folder: diff-audit-log/YYYY-MM-DD/file_name.diff.json
      const date = entry.timestamp.slice(0, 10);
      relPath = `diff-audit-log/${date}/${entry.file_name}.diff.json`;
    } else {
      // ProductName-based folder: diff-audit-log/file_name/timestamp.diff.json
      relPath = `diff-audit-log/${entry.file_name}/${entry.timestamp.replace(
        /[:.]/g,
        "-"
      )}.diff.json`;
    }
    return base + relPath;
  }

  // Filtering logic
  const filtered = auditIndex.filter((entry) => {
    const logPath = getAuditLogPath(entry);
    if (!logPath) return false;
    // @ts-ignore
    const cache = (window as any).auditLogExistenceCache;
    if (cache[logPath] === false) {
      console.debug("[AuditTrail][DEBUG] File missing:", logPath);
      return false;
    }
    if (cache[logPath] === true) {
      // continue
    } else {
      // Use API endpoint for file existence check
      fetch(`/api/file?path=${encodeURIComponent(logPath)}`, { method: "GET" })
        .then((resp) => {
          cache[logPath] = resp.ok;
          console.debug(
            "[AuditTrail][DEBUG] API file existence checked:",
            logPath,
            resp.ok
          );
          setCacheVersion((v) => v + 1); // force re-render
        })
        .catch(() => {
          cache[logPath] = false;
          console.debug(
            "[AuditTrail][DEBUG] API file existence checked (error):",
            logPath
          );
          setCacheVersion((v) => v + 1); // force re-render
        });
    }
    if (filter.project && entry.project_name !== filter.project) return false;
    if (
      filter.file &&
      !entry.file_name.toLowerCase().includes(filter.file.toLowerCase())
    )
      return false;
    if (filter.action && entry.check_action !== filter.action) return false;
    if (filter.date && !entry.timestamp.startsWith(filter.date)) return false;
    return true;
  });

  // Unique values for dropdowns
  const actions = Array.from(new Set(auditIndex.map((e) => e.check_action)));

  // Load log details when selected
  useEffect(() => {
    if (!selectedLog) return;
    setLogDetails(null);
    const logPath = getAuditLogPath(selectedLog);
    if (!logPath) {
      setLogDetails({ error: "Project config not found for this log." });
      return;
    }
    fetch(logPath)
      .then((resp) => resp.json())
      .then(setLogDetails)
      .catch(() => setLogDetails({ error: "Failed to load log details." }));
  }, [selectedLog, projects]);

  return (
    <Box maxWidth={1100} mx="auto" my={6} p={3} component={Paper} elevation={3}>
      <Typography variant="h4" align="center" gutterBottom>
        Audit Trail
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
          inputProps={{ style: { textTransform: "none" } }}
        />
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
          label="Date"
          type="date"
          value={filter.date}
          onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
          size="small"
          InputLabelProps={{ shrink: true }}
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
        <Button variant="contained" color="primary" onClick={handleRefresh}>
          Refresh
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
                  <b>Maker:</b>
                  <Box
                    component="pre"
                    sx={{
                      background: "#f5f5f5",
                      p: 1,
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: 120,
                      overflow: "auto",
                      mt: 0.5,
                      mb: 1,
                    }}
                  >
                    {logDetails.maker_comment || "-"}
                  </Box>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <b>Checker:</b>
                  <Box
                    component="pre"
                    sx={{
                      background: "#f5f5f5",
                      p: 1,
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: 120,
                      overflow: "auto",
                      mt: 0.5,
                      mb: 1,
                    }}
                  >
                    {logDetails.checker_comment || "-"}
                  </Box>
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
            <>
              <Button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(logDetails, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${logDetails.file_name || "audit-log"}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download JSON
              </Button>
              <Button
                onClick={() => {
                  // Prepare CSV content
                  const rows = [
                    ["Field", "Value"],
                    ["Project", logDetails.project_name],
                    ["Environment", logDetails.environment],
                    ["File", logDetails.file_name],
                    ["Timestamp", logDetails.timestamp],
                    ["Maker", logDetails.maker],
                    ["Maker Comment", logDetails.maker_comment],
                    ["Checker", logDetails.checker],
                    ["Checker Comment", logDetails.checker_comment],
                    ["Action", logDetails.check_action],
                    ["Diff", logDetails.diff_text],
                  ];
                  const csv = rows
                    .map((r) =>
                      r
                        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
                        .join(",")
                    )
                    .join("\r\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${logDetails.file_name || "audit-log"}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download CSV
              </Button>
              <Button
                onClick={() => {
                  // Sheet 1: metadata except diff_text
                  const metaRows = [
                    ["Field", "Value"],
                    ["Project", logDetails.project_name],
                    ["Environment", logDetails.environment],
                    ["File", logDetails.file_name],
                    ["Timestamp", logDetails.timestamp],
                    ["Maker", logDetails.maker],
                    ["Maker Comment", logDetails.maker_comment],
                    ["Checker", logDetails.checker],
                    ["Checker Comment", logDetails.checker_comment],
                    ["Action", logDetails.check_action],
                  ];
                  // Sheet 2: split diff text into lines
                  const diffLines = (logDetails.diff_text || "").split(/\r?\n/);
                  const diffRows = diffLines.map((line) => [line]);
                  const wb = XLSX.utils.book_new();
                  const ws1 = XLSX.utils.aoa_to_sheet(metaRows);
                  const ws2 = XLSX.utils.aoa_to_sheet(diffRows);
                  XLSX.utils.book_append_sheet(wb, ws1, "Metadata");
                  XLSX.utils.book_append_sheet(wb, ws2, "DiffText");
                  XLSX.writeFile(
                    wb,
                    `${logDetails.file_name || "audit-log"}.xlsx`
                  );
                }}
              >
                Download Excel
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditTrail;
