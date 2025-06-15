import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { writeAuditLog, cleanupOldAuditLogs } from './src/api/auditUtils.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BASE_DIR = path.join(process.cwd(), 'public'); // restrict to public folder

// Read file
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).send('Missing path');
  const absPath = path.join(BASE_DIR, relPath);
  if (!absPath.startsWith(BASE_DIR)) return res.status(403).send('Forbidden');
  fs.readFile(absPath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('File not found');
    res.send(data);
  });
});

// Overwrite file
app.post('/api/file', (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath || typeof content !== 'string') return res.status(400).send('Missing path or content');
  const absPath = path.join(BASE_DIR, relPath);
  if (!absPath.startsWith(BASE_DIR)) return res.status(403).send('Forbidden');
  fs.writeFile(absPath, content, 'utf8', (err) => {
    if (err) return res.status(500).send('Write failed');
    res.send('OK');
  });
});

// File stat (mtime)
app.get('/api/stat', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).send('Missing path');
  const absPath = path.join(BASE_DIR, relPath);
  if (!absPath.startsWith(BASE_DIR)) return res.status(403).send('Forbidden');
  fs.stat(absPath, (err, stats) => {
    if (err) return res.status(404).send('File not found');
    res.json({ mtime: stats.mtime });
  });
});

// API to write audit log (called after checker approves)
app.post('/api/audit-log', (req, res) => {
  console.log('[AuditLog][DEBUG][BACKEND] /api/audit-log called. req.body:', req.body);
  try {
    const {
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
    } = req.body;
    if (!auditPath || !auditCaptureApproach || !projectName || !environment || !fileName || !maker || !checker || !checkAction || !diffText) {
      console.error('[AuditLog][DEBUG][BACKEND] Missing required fields:', req.body);
      return res.status(400).send('Missing required fields');
    }
    writeAuditLog({
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
    res.send('Audit log written');
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] Exception:', err);
    res.status(500).send('Failed to write audit log: ' + err.message);
  }
});

// API to cleanup old audit logs (can be called on schedule or manually)
app.post('/api/audit-log/cleanup', (req, res) => {
  try {
    const { auditPath, auditRetentionDays } = req.body;
    if (!auditPath || !auditRetentionDays) return res.status(400).send('Missing auditPath or auditRetentionDays');
    cleanupOldAuditLogs(auditPath, auditRetentionDays);
    res.send('Cleanup complete');
  } catch (err) {
    res.status(500).send('Cleanup failed: ' + err.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`File API running on http://localhost:${PORT}`));