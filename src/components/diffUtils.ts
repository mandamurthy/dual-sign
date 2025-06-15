import Papa from 'papaparse';
import { readFile } from "../api/fileApi";

// Utility to format audit log diff from Diff Viewer data
export function formatAuditDiffFromViewer(
  diffRows: {
    rowIndex: number;
    v0: Record<string, string>;
    vn: Record<string, string>;
    changedCols: string[];
  }[],
  mustColumns: string[]
): string {
  if (!diffRows.length) return "NO_DIFF";

  // Collect all columns that are changed in any row
  const changedColumns = Array.from(
    new Set(diffRows.flatMap(r => r.changedCols))
  );
  // Final columns to include: must columns + changed columns (no duplicates)
  const allColumns = Array.from(new Set([...mustColumns, ...changedColumns]));

  // Header
  const header = `Header,${allColumns.join(",")}^^${allColumns.join(",")}`;

  // Rows
  const rows = diffRows.map((row) => {
    const v0Vals = allColumns.map(
      col => mustColumns.includes(col)
        ? row.v0[col] ?? ""
        : row.changedCols.includes(col)
          ? row.v0[col] ?? ""
          : "NoChange"
    );
    const vnVals = allColumns.map(
      col => mustColumns.includes(col)
        ? row.vn[col] ?? ""
        : row.changedCols.includes(col)
          ? row.vn[col] ?? ""
          : "NoChange"
    );
    return `Row ${row.rowIndex + 1},${v0Vals.join(",")}^^${vnVals.join(",")}`;
  });

  return [header, ...rows].join("\n");
}

// Ensure getDiffRowsForAudit is always attached to window for global access
if (typeof window !== "undefined") {
  window.getDiffRowsForAudit = getDiffRowsForAudit;
}

// Utility to clean and align CSV rows
function cleanAndAlignRows(rows: string[][], headerLen: number, label: string): string[][] {
  return rows.map((row, idx) => {
    const cleaned = row.map(cell => cell.replace(/[\r\n]+/g, '').trim());
    if (cleaned.length > headerLen) {
      console.warn(`[${label}] Row ${idx} has extra columns:`, cleaned);
      return cleaned.slice(0, headerLen);
    } else if (cleaned.length < headerLen) {
      console.warn(`[${label}] Row ${idx} has missing columns:`, cleaned);
      return cleaned.concat(Array(headerLen - cleaned.length).fill(''));
    }
    return cleaned;
  });
}

// Calculate diff rows for audit between two sets of rows
export function getDiffRowsForAudit(
  rowsV0: string[][],
  rowsVN: string[][],
  columns: string[],
  mustColumns: string[]
) {
  // Clean header and all data rows
  const headerLen = columns.length;
  const cleanRowsV0 = cleanAndAlignRows(rowsV0, headerLen, 'V0');
  const cleanRowsVN = cleanAndAlignRows(rowsVN, headerLen, 'VN');

  const maxRows = Math.max(cleanRowsV0.length, cleanRowsVN.length) - 1;
  const diffRows: {
    rowIndex: number;
    v0: Record<string, string>;
    vn: Record<string, string>;
    changedCols: string[];
  }[] = [];
  for (let i = 0; i < maxRows; i++) {
    const v0Row = cleanRowsV0[i + 1] || [];
    const vnRow = cleanRowsVN[i + 1] || [];
    const changedCols: string[] = [];
    columns.forEach((col, idx) => {
      const v0Val = v0Row[idx] || "";
      const vnVal = vnRow[idx] || "";
      if (v0Val !== vnVal) changedCols.push(col);
    });
    if (changedCols.length > 0) {
      const v0Obj: Record<string, string> = {};
      const vnObj: Record<string, string> = {};
      columns.forEach((col, idx) => {
        v0Obj[col] = v0Row[idx] || "";
        vnObj[col] = vnRow[idx] || "";
      });
      diffRows.push({ rowIndex: i, v0: v0Obj, vn: vnObj, changedCols });
    }
  }
  return diffRows;
}

// Modular diff extraction for 'Diff Lines' granularity
export function getDiffRowsForLines(
  rowsV0: string[][],
  rowsVN: string[][],
  columns: string[],
  mustColumns: string[]
) {
  // Clean and align rows
  const headerLen = columns.length;
  const cleanRowsV0 = cleanAndAlignRows(rowsV0, headerLen, 'V0');
  const cleanRowsVN = cleanAndAlignRows(rowsVN, headerLen, 'VN');
  // Build row maps by must column key (e.g., ID)
  const mustIdxs = mustColumns.map(col => columns.indexOf(col)).filter(i => i >= 0);
  function rowKey(row: string[]) {
    return mustIdxs.map(idx => row[idx] || '').join('|');
  }
  const prevMap = new Map<string, string[]>();
  const newMap = new Map<string, string[]>();
  for (let i = 1; i < cleanRowsV0.length; i++) prevMap.set(rowKey(cleanRowsV0[i]), cleanRowsV0[i]);
  for (let i = 1; i < cleanRowsVN.length; i++) newMap.set(rowKey(cleanRowsVN[i]), cleanRowsVN[i]);
  // Union of all keys
  const allKeys = Array.from(new Set([...prevMap.keys(), ...newMap.keys()]));
  // Collect changed rows
  const diffRows: {
    rowIndex: number;
    v0: string[] | null;
    vn: string[] | null;
  }[] = [];
  allKeys.forEach((key, i) => {
    const r0 = prevMap.get(key);
    const rn = newMap.get(key);
    if (!r0 && rn) {
      diffRows.push({ rowIndex: i, v0: null, vn: rn });
    } else if (r0 && !rn) {
      diffRows.push({ rowIndex: i, v0: r0, vn: null });
    } else if (r0 && rn && r0.join(',') !== rn.join(',')) {
      diffRows.push({ rowIndex: i, v0: r0, vn: rn });
    }
  });
  return diffRows;
}

// Format audit log diff for 'Diff Lines' granularity
export function formatAuditDiffLines(
  diffRows: { rowIndex: number; v0: string[] | null; vn: string[] | null }[],
  columns: string[]
): string {
  if (!diffRows.length) return 'NO_DIFF';
  const header = `Header,${columns.join(',')}^^${columns.join(',')}`;
  const rows = diffRows.map(row => {
    const v0Vals = row.v0 ? row.v0.join(',') : Array(columns.length).fill('NoPrev').join(',');
    const vnVals = row.vn ? row.vn.join(',') : Array(columns.length).fill('NoNew').join(',');
    return `Row ${row.rowIndex + 1},${v0Vals}^^${vnVals}`;
  });
  return [header, ...rows].join('\n');
}

// Utility to robustly parse CSV content into array of arrays using PapaParse
export function parseCsvToArray(csvContent: string): string[][] {
  const result = Papa.parse<string[]>(csvContent, {
    skipEmptyLines: true,
  });
  if (result.errors && result.errors.length > 0) {
    console.warn('PapaParse CSV parse errors:', result.errors);
  }
  return result.data as string[][];
}

// Utility to get both v0 and vN content for a file, matching Diff Viewer logic
export async function getVersionedContentsForDiff(task: any): Promise<{ v0Content: string, vNContent: string }> {
  // v0: current workspace file
  let v0Content = "";
  try {
    v0Content = await readFile(task.file);
  } catch {
    v0Content = ""; // Do not fall back to vNContent
  }
  // vN: uploaded (pending) version from localStorage
  let vNContent = "";
  const key = `dualSignUpload_${task.file}_${task.versionLabel}`;
  const data = JSON.parse(localStorage.getItem(key) || "{}");
  vNContent = data && data.content ? data.content : "";
  return { v0Content, vNContent };
}
