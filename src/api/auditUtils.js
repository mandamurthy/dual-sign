import fs from 'fs';
import path from 'path';

/**
 * Write an audit log JSON file in the correct folder structure.
 * @param {Object} params - Audit log parameters
 * @param {string} params.auditPath - Base audit path
 * @param {string} params.auditCaptureApproach - 'Date' or 'ProductName'
 * @param {string} params.projectName
 * @param {string} params.environment
 * @param {string} params.fileName
 * @param {string} params.maker
 * @param {string} params.makerComment
 * @param {string} params.checker
 * @param {string} params.checkerComment
 * @param {string} params.checkAction
 * @param {string} params.diffText
 * @param {number} params.auditRetentionDays
 * @param {Date} [params.timestamp] - Optional, defaults to now
 */
function writeAuditLog({
  auditPath,
  auditCaptureApproach,
  projectName,
  environment,
  fileName,
  maker,
  makerComment,
  checker,
  checkerComment,
  checkAction,
  diffText,
  auditRetentionDays,
  timestamp = new Date(),
}) {
  const ts = new Date(timestamp);
  const dateStr = ts.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = ts.toISOString().replace(/[:.]/g, '-'); // For filename
  const fullAuditPath = getFullAuditPath(auditPath);
  let folder;
  if (auditCaptureApproach === 'Date') {
    folder = path.join(fullAuditPath, 'diff-audit-log', dateStr);
  } else {
    folder = path.join(fullAuditPath, 'diff-audit-log', fileName);
  }
  console.log('[AuditLog][DEBUG][BACKEND] Creating folder:', folder);
  if (!fs.existsSync(folder)) {
    try {
      fs.mkdirSync(folder, { recursive: true });
      console.log('[AuditLog][DEBUG][BACKEND] Folder created:', folder);
    } catch (err) {
      console.error('[AuditLog][DEBUG][BACKEND] Failed to create folder:', folder, err);
      throw err;
    }
  }
  let filePath;
  if (auditCaptureApproach === 'Date') {
    filePath = path.join(folder, `${fileName}.diff.json`);
  } else {
    filePath = path.join(folder, `${timeStr}.diff.json`);
  }
  console.log('[AuditLog][DEBUG][BACKEND] Writing audit log file:', filePath);
  const auditData = {
    project_name: projectName,
    environment,
    file_name: fileName,
    timestamp: ts.toISOString(),
    maker,
    maker_comment: makerComment,
    checker,
    checker_comment: checkerComment,
    check_action: checkAction,
    diff_text: diffText,
  };
  if (fs.existsSync(filePath)) {
    console.error('[AuditLog][DEBUG][BACKEND] Audit log already exists:', filePath);
    throw new Error('Audit log already exists (immutability enforced)');
  }
  try {
    fs.writeFileSync(filePath, JSON.stringify(auditData, null, 2));
    console.log('[AuditLog][DEBUG][BACKEND] Audit log written:', filePath);
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Failed to write audit log:', filePath, err);
    throw err;
  }
  updateAuditIndex(fullAuditPath, {
    file: path.relative(fullAuditPath, filePath),
    project_name: projectName,
    environment,
    file_name: fileName,
    maker,
    checker,
    timestamp: ts.toISOString(),
    check_action: checkAction,
  });
}

// Helper to normalize and resolve auditPath
function getFullAuditPath(auditPath) {
  const normalized = auditPath.replace(/\\/g, '/').replace(/\\/g, '/');
  const baseDir = path.resolve(process.cwd(), 'public');
  const resolved = path.resolve(baseDir, normalized);
  console.log('[AuditLog][DEBUG][BACKEND] getFullAuditPath:', { auditPath, normalized, baseDir, resolved });
  return resolved;
}

/**
 * Update the audit index file with a new entry.
 * @param {string} auditPath
 * @param {Object} entry
 */
function updateAuditIndex(auditPath, entry) {
  const fullAuditPath = getFullAuditPath(auditPath);
  const indexPath = path.join(fullAuditPath, 'diff-audit-log', 'audit-index.json');
  let index = [];
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (err) {
      console.error('[AuditLog][DEBUG][BACKEND] Failed to read audit index:', indexPath, err);
      index = [];
    }
  }
  index.push(entry);
  try {
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    console.log('[AuditLog][DEBUG][BACKEND] Audit index updated:', indexPath);
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Failed to update audit index:', indexPath, err);
    throw err;
  }
}

/**
 * Cleanup audit logs older than retention days.
 * @param {string} auditPath
 * @param {number} retentionDays
 */
function cleanupOldAuditLogs(auditPath, retentionDays) {
  const fullAuditPath = getFullAuditPath(auditPath);
  const indexPath = path.join(fullAuditPath, 'diff-audit-log', 'audit-index.json');
  if (!fs.existsSync(indexPath)) return;
  let index = [];
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Failed to read audit index for cleanup:', indexPath, err);
    return;
  }
  const now = Date.now();
  const keep = [];
  for (const entry of index) {
    const ts = new Date(entry.timestamp).getTime();
    if (now - ts > retentionDays * 24 * 60 * 60 * 1000) {
      const filePath = path.join(fullAuditPath, entry.file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('[AuditLog][DEBUG][BACKEND] Deleted old audit log:', filePath);
        } catch (err) {
          console.error('[AuditLog][DEBUG][BACKEND] Failed to delete old audit log:', filePath, err);
        }
      }
    } else {
      keep.push(entry);
    }
  }
  try {
    fs.writeFileSync(indexPath, JSON.stringify(keep, null, 2));
    console.log('[AuditLog][DEBUG][BACKEND] Audit index cleaned up:', indexPath);
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Failed to update cleaned audit index:', indexPath, err);
  }
}

export { writeAuditLog, updateAuditIndex, cleanupOldAuditLogs };
