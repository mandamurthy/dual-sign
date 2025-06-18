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

const AuditTrail: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [filter, setFilter] = useState({
    project: "",
    file: "",
    maker: "",
    checker: "",
    action: "",
    date: today, // Default to today's date
  });
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [logDetails, setLogDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [serverResults, setServerResults] = useState<any[]>([]);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Fetch paginated/filterable audit logs from backend (ElasticSearch)
  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: pageSize.toString(),
    });
    if (filter.project) params.append("project", filter.project);
    if (filter.file) params.append("file", filter.file);
    if (filter.maker) params.append("maker", filter.maker);
    if (filter.checker) params.append("checker", filter.checker);
    if (filter.action) params.append("action", filter.action);
    if (filter.date) params.append("date", filter.date);
    fetch(`/api/audit-logs?${params.toString()}`)
      .then((resp) => {
        if (!resp.ok) throw new Error("Failed to fetch audit logs");
        return resp.json();
      })
      .then((data) => {
        setServerResults(data.results);
        setTotalCount(data.total);
      })
      .catch(() => setError("Failed to load audit logs."))
      .finally(() => setLoading(false));
  }, [currentPage, pageSize, filter]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Unique values for dropdowns
  const actions = Array.from(new Set(serverResults.map((e) => e.check_action)));
  const projects = Array.from(
    new Set(serverResults.map((e) => e.project_name))
  );

  // Load log details when selected
  useEffect(() => {
    if (!selectedLog) return;
    setLogDetails(selectedLog);
  }, [selectedLog]);

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
      </Stack>
      {loading ? (
        <Alert severity="info">Loading...</Alert>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : serverResults.length === 0 ? (
        <Alert severity="info">No audit events found.</Alert>
      ) : (
        <>
          <List>
            {serverResults
              .slice() // copy to avoid mutating state
              .sort((a, b) => {
                // Sort descending by timestamp (ISO string)
                return (b.timestamp || "").localeCompare(a.timestamp || "");
              })
              .map((entry, idx) => (
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
                          {entry.timestamp_display || entry.timestamp} | Maker:{" "}
                          {entry.maker} | Checker: {entry.checker} | Action:{" "}
                          {entry.check_action}
                        </Typography>
                        {/* Display Maker and Checker comments */}
                        {entry.maker_comment && (
                          <Typography
                            variant="body2"
                            color="#1976d2"
                            sx={{ mt: 0.5 }}
                          >
                            Maker Comment: {entry.maker_comment}
                          </Typography>
                        )}
                        {entry.checker_comment && (
                          <Typography
                            variant="body2"
                            color="#388e3c"
                            sx={{ mt: 0.5 }}
                          >
                            Checker Comment: {entry.checker_comment}
                          </Typography>
                        )}
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
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <Button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            <Typography>
              Page {currentPage} of {totalPages} (Total: {totalCount})
            </Typography>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
            <TextField
              select
              label="Page Size"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              size="small"
              sx={{ width: 100 }}
            >
              {[10, 20, 50, 100].map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </>
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
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {JSON.stringify(logDetails, null, 2)}
            </pre>
          ) : (
            <Alert severity="info">Loading log details...</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditTrail;
