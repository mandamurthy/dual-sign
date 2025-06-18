import fs from 'fs';
import path from 'path';
import { elasticClient, AUDIT_LOG_INDEX, ensureAuditLogIndex } from './elasticClient.js';

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
async function writeAuditLog({
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
  console.log('[AuditLog][DEBUG][BACKEND] writeAuditLog called with:', {
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
    timestamp
  });
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`; // YYYY-MM-DD
    const timeStr = getLocalTimestampForFilename(); // For filename
    const fullAuditPath = getFullAuditPath(auditPath);
    console.log('[AuditLog][DEBUG][BACKEND] Calculated fullAuditPath:', fullAuditPath);
    let folder;
    if (auditCaptureApproach === 'Date') {
      folder = path.join(fullAuditPath, 'diff-audit-log', dateStr);
    } else {
      folder = path.join(fullAuditPath, 'diff-audit-log', fileName);
    }
    console.log('[AuditLog][DEBUG][BACKEND] Calculated folder path:', folder);
    console.log('[AuditLog][DEBUG][BACKEND] Checking if folder exists:', folder);
    if (!fs.existsSync(folder)) {
      console.log('[AuditLog][DEBUG][BACKEND] Folder does not exist, will create:', folder);
      try {
        fs.mkdirSync(folder, { recursive: true });
        console.log('[AuditLog][DEBUG][BACKEND] Folder created successfully:', folder);
      } catch (err) {
        console.error('[AuditLog][DEBUG][BACKEND] Failed to create folder:', folder, err);
        throw err;
      }
    } else {
      console.log('[AuditLog][DEBUG][BACKEND] Folder exists:', folder);
    }
    let filePath;
    if (auditCaptureApproach === 'Date') {
      filePath = path.join(folder, `${fileName}.diff.json`);
    } else {
      filePath = path.join(folder, `${timeStr}.diff.json`);
    }
    console.log('[AuditLog][DEBUG][BACKEND] Calculated file path:', filePath);
    console.log('[AuditLog][DEBUG][BACKEND] Checking if file exists:', filePath);
    if (fs.existsSync(filePath)) {
      console.error('[AuditLog][DEBUG][BACKEND] File already exists:', filePath);
      throw new Error('Audit log already exists (immutability enforced)');
    } else {
      console.log('[AuditLog][DEBUG][BACKEND] File does not exist, will create:', filePath);
    }
    // Prepare auditData for file and ElasticSearch
    const nowIso = new Date().toISOString();
    const auditData = {
      project_name: projectName,
      environment,
      file_name: fileName,
      timestamp: nowIso, // ISO for ElasticSearch
      timestamp_display: timestamp, // Local string for UI
      maker,
      maker_comment: makerComment,
      checker,
      checker_comment: checkerComment,
      check_action: checkAction,
      diff_text: diffText,
    };
    console.log('[AuditLog][DEBUG][BACKEND] Attempting to write audit log file:', filePath);
    fs.writeFileSync(filePath, JSON.stringify(auditData, null, 2));
    console.log('[AuditLog][DEBUG][BACKEND] Audit log file written successfully:', filePath);
    // ElasticSearch indexing
    try {
      console.log('[AuditLog][DEBUG][BACKEND] Attempting to ensure index and index audit log in ElasticSearch:', auditData);
      await ensureAuditLogIndex();
      const esResult = await elasticClient.index({
        index: AUDIT_LOG_INDEX,
        document: auditData
      });
      console.log('[AuditLog][DEBUG][BACKEND] Audit log indexed in ElasticSearch. Result:', esResult);
    } catch (esErr) {
      console.error('[AuditLog][DEBUG][BACKEND] Failed to index audit log in ElasticSearch:', esErr);
    }
    console.log('[AuditLog][DEBUG][BACKEND] Attempting to update audit index for:', fullAuditPath);
    updateAuditIndex(fullAuditPath, {
      file: path.relative(fullAuditPath, filePath),
      project_name: projectName,
      environment,
      file_name: fileName,
      maker,
      checker,
      timestamp: timestamp, // Store as received (local string)
      check_action: checkAction,
    });
    console.log('[AuditLog][DEBUG][BACKEND] Audit index updated successfully for:', fullAuditPath);
    console.log('[AuditLog][DEBUG][BACKEND] writeAuditLog completed successfully.');
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Exception in writeAuditLog:', err);
    throw err;
  }
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

/**
 * Get a timestamp string for filenames, based on the local time.
 * Format: YYYY-MM-DDTHH-mm-ss-SSS (sortable, no forbidden chars)
 * @returns {string}
 */
function getLocalTimestampForFilename() {
  const now = new Date();
  const pad = (n, l = 2) => n.toString().padStart(l, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const min = pad(now.getMinutes());
  const sec = pad(now.getSeconds());
  const ms = pad(now.getMilliseconds(), 3);
  return `${year}-${month}-${day}T${hour}-${min}-${sec}-${ms}`;
}

export { writeAuditLog, updateAuditIndex, cleanupOldAuditLogs };
