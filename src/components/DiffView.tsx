import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { readFile } from "../api/fileApi";
import { getDiffRowsForAudit, parseCsvToArray } from "./diffUtils";

interface DiffViewProps {
  v0Content: string;
  vNContent: string;
  defaultDelimiter?: string;
  fileName?: string;
}

const getAllColumns = (rowsA: string[][], rowsB: string[][]): string[] => {
  const colsA = rowsA[0] || [];
  const colsB = rowsB[0] || [];
  return Array.from(new Set([...colsA, ...colsB]));
};

const DiffView: React.FC<
  DiffViewProps & {
    versionLabel?: string;
    uploadedAt?: string;
    fileName?: string;
  }
> = ({
  v0Content,
  vNContent,
  defaultDelimiter = ",",
  versionLabel = "vN",
  uploadedAt,
  fileName,
}) => {
  const [effectiveV0Content, setEffectiveV0Content] = React.useState(v0Content);

  React.useEffect(() => {
    if (fileName) {
      readFile(fileName)
        .then(setEffectiveV0Content)
        .catch(() => setEffectiveV0Content(v0Content));
    } else {
      setEffectiveV0Content(v0Content);
    }
    // eslint-disable-next-line
  }, [fileName, v0Content]);

  const [delimiter, setDelimiter] = useState(defaultDelimiter);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showMode, setShowMode] = useState<"all" | "diff" | "diffSelected">(
    "all"
  );
  const [selectAll, setSelectAll] = useState(true);

  const rowsV0 = parseCsvToArray(effectiveV0Content);
  const rowsVN = parseCsvToArray(vNContent);
  const allColumns = getAllColumns(rowsV0, rowsVN);

  React.useEffect(() => {
    setColumns(allColumns);
    setSelectedColumns(allColumns);
    setSelectAll(true);
  }, [v0Content, vNContent, delimiter]);

  const handleColumnChange = (event: any) => {
    const value = event.target.value;
    // If user clicked the select-all option
    if (value.includes("select-all")) {
      if (selectedColumns.length === columns.length) {
        setSelectedColumns([]);
        setSelectAll(false);
      } else {
        setSelectedColumns(columns);
        setSelectAll(true);
      }
    } else {
      setSelectedColumns(value);
      setSelectAll(value.length === columns.length);
    }
  };

  // Highlight cell differences between v0 and vN
  const getCellDiffClass = (col: string, rowIdx: number) => {
    const colIdx = columns.indexOf(col);
    let v0Val = rowsV0[rowIdx + 1]?.[colIdx] || "";
    let vNVal = rowsVN[rowIdx + 1]?.[colIdx] || "";
    // Strip surrounding quotes if present
    if (v0Val.startsWith('"') && v0Val.endsWith('"'))
      v0Val = v0Val.slice(1, -1);
    if (vNVal.startsWith('"') && vNVal.endsWith('"'))
      vNVal = vNVal.slice(1, -1);
    if (v0Val !== vNVal) {
      if (v0Val.trim() !== vNVal.trim())
        return { background: "#ffe0e0", fontWeight: 600 };
      return { background: "#e0eaff", fontWeight: 500 };
    }
    return {};
  };

  // Sorting logic
  const getSortedRows = (rows: string[][]) => {
    if (!sortCol) return rows.slice(1);
    const colIdx = columns.indexOf(sortCol);
    return rows
      .slice(1)
      .slice()
      .sort((a, b) => {
        const aVal = a[colIdx] || "";
        const bVal = b[colIdx] || "";
        if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  };

  // Show only rows with any diff (all columns)
  const getDiffRowIndexes = () => {
    const maxRows = Math.max(rowsV0.length, rowsVN.length) - 1;
    const diffIndexes: number[] = [];
    for (let i = 0; i < maxRows; i++) {
      for (const col of columns) {
        const colIdx = columns.indexOf(col);
        const v0Val = rowsV0[i + 1]?.[colIdx] || "";
        const vNVal = rowsVN[i + 1]?.[colIdx] || "";
        if (v0Val !== vNVal) {
          diffIndexes.push(i);
          break;
        }
      }
    }
    return diffIndexes;
  };
  // Show only rows with any diff in selected columns
  const getDiffSelectedRowIndexes = () => {
    const maxRows = Math.max(rowsV0.length, rowsVN.length) - 1;
    const diffIndexes: number[] = [];
    for (let i = 0; i < maxRows; i++) {
      for (const col of selectedColumns) {
        const colIdx = columns.indexOf(col);
        const v0Val = rowsV0[i + 1]?.[colIdx] || "";
        const vNVal = rowsVN[i + 1]?.[colIdx] || "";
        if (v0Val !== vNVal) {
          diffIndexes.push(i);
          break;
        }
      }
    }
    return diffIndexes;
  };
  const diffIndexes = getDiffRowIndexes();
  const diffSelectedIndexes = getDiffSelectedRowIndexes();

  // Calculate record counts for display
  const totalRows = Math.max(rowsV0.length, rowsVN.length) - 1;
  let filteredRows = totalRows;
  if (showMode === "diff") {
    filteredRows = diffIndexes.length;
  } else if (showMode === "diffSelected") {
    filteredRows = diffSelectedIndexes.length;
  }

  // Determine which columns to display based on showMode
  const getDisplayColumns = () => {
    // Always show only the selected columns, in file order
    return columns.filter((col) => selectedColumns.includes(col));
  };

  const renderTable = (rows: string[][], side: "v0" | "vN") => {
    const sortedRows = getSortedRows(rows);
    let displayRows = sortedRows;
    if (showMode === "diff") {
      displayRows = sortedRows.filter((_, idx) => diffIndexes.includes(idx));
    } else if (showMode === "diffSelected") {
      displayRows = sortedRows.filter((_, idx) =>
        diffSelectedIndexes.includes(idx)
      );
    }
    const displayColumns = getDisplayColumns();
    // Map from displayRows index to original row index
    const getOriginalRowIdx = (displayIdx: number) => {
      if (showMode === "all") return displayIdx;
      if (showMode === "diff") return diffIndexes[displayIdx];
      if (showMode === "diffSelected") return diffSelectedIndexes[displayIdx];
      return displayIdx;
    };
    return (
      <Box
        component="table"
        width="100%"
        border={1}
        borderColor="#ccc"
        bgcolor={side === "vN" ? "#f9f9f9" : undefined}
      >
        <thead>
          <tr>
            {displayColumns.map((col) => (
              <th
                key={col}
                style={{
                  cursor: "pointer",
                  background: sortCol === col ? "#e0e0ff" : undefined,
                  fontSize: 15,
                }}
                onClick={() => {
                  if (sortCol === col)
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  else {
                    setSortCol(col);
                    setSortDir("asc");
                  }
                }}
              >
                {col} {sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, displayIdx) => (
            <tr key={displayIdx}>
              {displayColumns.map((col) => {
                const colIdx = columns.indexOf(col);
                // Only highlight diff for selected columns in diffSelected mode
                const highlight =
                  showMode === "diffSelected"
                    ? selectedColumns.includes(col)
                    : true;
                // Use original row index for diff calculation
                const originalRowIdx = getOriginalRowIdx(displayIdx);
                return (
                  <td
                    key={colIdx}
                    style={
                      highlight ? getCellDiffClass(col, originalRowIdx) : {}
                    }
                  >
                    {row[colIdx] || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Box>
    );
  };

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>
        File Diff View
      </Typography>
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField
          label="Delimiter"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          size="small"
          sx={{ width: 120 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Columns</InputLabel>
          <Select
            multiple
            value={selectedColumns}
            onChange={handleColumnChange}
            renderValue={(selected) =>
              `${selected.length} Column${
                selected.length !== 1 ? "s" : ""
              } Chosen`
            }
            MenuProps={{
              PaperProps: { style: { maxHeight: 300, width: 250 } },
            }}
          >
            <MenuItem value="select-all">
              <Checkbox
                checked={selectAll}
                indeterminate={
                  selectedColumns.length > 0 &&
                  selectedColumns.length < columns.length
                }
              />
              <ListItemText
                primary={selectAll ? "Deselect All" : "Select All"}
              />
            </MenuItem>
            {columns.map((col) => (
              <MenuItem key={col} value={col}>
                <Checkbox checked={selectedColumns.indexOf(col) > -1} />
                <ListItemText primary={col} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Show</InputLabel>
          <Select
            value={showMode}
            label="Show"
            onChange={(e) => setShowMode(e.target.value as any)}
            sx={{ fontSize: 15, minWidth: 120 }}
          >
            <MenuItem value="all">Show All</MenuItem>
            <MenuItem value="diff">Show Diff</MenuItem>
            <MenuItem value="diffSelected">Show Diff Selected</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mb: 1 }}>
        Showing {filteredRows} of {totalRows} records
      </Typography>
      <Box display="flex" gap={2}>
        <Box flex={1}>
          <Typography variant="subtitle1">v0 (Workspace)</Typography>
          {renderTable(rowsV0, "v0")}
        </Box>
        <Box flex={1}>
          <Typography variant="subtitle1">
            {versionLabel} {uploadedAt ? `(${uploadedAt})` : ""}
          </Typography>
          {renderTable(rowsVN, "vN")}
        </Box>
      </Box>
    </Box>
  );
};

export default DiffView;
