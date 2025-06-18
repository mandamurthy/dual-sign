import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { writeAuditLog, cleanupOldAuditLogs } from './src/api/auditUtils.js';
import { elasticClient, AUDIT_LOG_INDEX } from './src/api/elasticClient.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BASE_DIR = path.join(process.cwd(), 'public'); // restrict to public folder

// Debug logging
console.log('[AuditLog][DEBUG][BACKEND] Starting server.mjs');
console.log('[DEBUG] AUDIT_LOG_INDEX:', AUDIT_LOG_INDEX);

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
  console.log('[AuditLog][DEBUG][BACKEND] Received payload:', req.body);
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
      console.error('[AuditLog][DEBUG][BACKEND] Missing required fields:', {
        auditPath,
        auditCaptureApproach,
        projectName,
        environment,
        fileName,
        maker,
        checker,
        checkAction,
        diffText
      });
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

// Registering /api/audit-logs route
console.log('[AuditLog][DEBUG][BACKEND] Registering /api/audit-logs route');
app.get('/api/audit-logs', async (req, res) => {
  console.log('[AuditLog][DEBUG][BACKEND] Received request for /api/audit-logs', req.method, req.url, req.query);
  try {
    const {
      page = 1,
      pageSize = 20,
      project,
      file,
      maker,
      checker,
      action,
      date
    } = req.query;
    const must = [];
    if (project) must.push({ term: { project_name: project } });
    if (file) must.push({ wildcard: { file_name: `*${file}*` } });
    if (maker) must.push({ term: { maker } });
    if (checker) must.push({ term: { checker } });
    if (action) must.push({ term: { check_action: action } });
    // Use range query for date filtering on timestamp (date field)
    if (date) {
      // date is expected as 'YYYY-MM-DD'
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      must.push({ range: { timestamp: { gte: start, lte: end } } });
    }
    const esQuery = {
      index: AUDIT_LOG_INDEX,
      from: (parseInt(page) - 1) * parseInt(pageSize),
      size: parseInt(pageSize),
      sort: [{ timestamp: { order: 'desc' } }],
      query: must.length ? { bool: { must } } : { match_all: {} }
    };
    console.log('[AuditLog][DEBUG][BACKEND] ElasticSearch query:', JSON.stringify(esQuery));
    const result = await elasticClient.search(esQuery);
    const hits = result.hits.hits.map(h => h._source);
    console.log('[AuditLog][DEBUG][BACKEND] ElasticSearch result count:', hits.length);
    res.json({ total: result.hits.total.value, results: hits });
  } catch (err) {
    console.error('[AuditLog][DEBUG][BACKEND] /api/audit-logs error:', err);
    res.status(500).send('ElasticSearch query failed: ' + err.message);
  }
});

// Catch-all unmatched route debug logger
app.use((req, res) => {
  console.log('[DEBUG] Unmatched route:', req.method, req.url);
  res.status(404).send('Not found');
});

const PORT = 3001;
app.listen(PORT, () => console.log(`File API running on http://localhost:${PORT}`));