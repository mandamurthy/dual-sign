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

// --- User API ---

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const ENVS_FILE = path.join(process.cwd(), 'data', 'environments.json');

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read users' });
  }
});

// Add a user
app.post('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const newUser = req.body;
    users.push(newUser);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(201).json({ message: 'User added' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Update a user
app.put('/api/users/:id', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users[idx] = { ...users[idx], ...req.body };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ message: 'User updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
  try {
    let users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const idx = users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    users.splice(idx, 1);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- Environment API ---
// Get all environments
app.get('/api/environments', (req, res) => {
  try {
    const envs = JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8'));
    res.json(envs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read environments' });
  }
});

// Add an environment
app.post('/api/environments', (req, res) => {
  try {
    const envs = JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8'));
    const newEnv = req.body;
    envs.push(newEnv);
    fs.writeFileSync(ENVS_FILE, JSON.stringify(envs, null, 2));
    res.status(201).json({ message: 'Environment added' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add environment' });
  }
});

// Update an environment
app.put('/api/environments/:id', (req, res) => {
  try {
    const envs = JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8'));
    const idx = envs.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Environment not found' });
    envs[idx] = { ...envs[idx], ...req.body };
    fs.writeFileSync(ENVS_FILE, JSON.stringify(envs, null, 2));
    res.json({ message: 'Environment updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update environment' });
  }
});

// Delete an environment
app.delete('/api/environments/:id', (req, res) => {
  try {
    let envs = JSON.parse(fs.readFileSync(ENVS_FILE, 'utf8'));
    const idx = envs.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Environment not found' });
    envs.splice(idx, 1);
    fs.writeFileSync(ENVS_FILE, JSON.stringify(envs, null, 2));
    res.json({ message: 'Environment deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete environment' });
  }
});

// --- Project API ---
const PROJECTS_FILE = path.join(process.cwd(), 'data', 'projects.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'data', 'products.json');

// Get all projects
app.get('/api/projects', (req, res) => {
  try {
    const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

// Add a project
app.post('/api/projects', (req, res) => {
  try {
    const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    const newProject = req.body;
    projects.push(newProject);
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    res.status(201).json({ message: 'Project added' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add project' });
  }
});

// Update a project
app.put('/api/projects/:id', (req, res) => {
  try {
    const projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    projects[idx] = { ...projects[idx], ...req.body };
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    res.json({ message: 'Project updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', (req, res) => {
  try {
    let projects = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    projects.splice(idx, 1);
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
    res.json({ message: 'Project deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// --- Product API ---
// Get all products
app.get('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read products' });
  }
});

// Add a product
app.post('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const newProduct = req.body;
    products.push(newProduct);
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    res.status(201).json({ message: 'Product added' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Update a product
app.put('/api/products/:id', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products[idx] = { ...products[idx], ...req.body };
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    res.json({ message: 'Product updated' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  try {
    let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });
    products.splice(idx, 1);
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    res.json({ message: 'Product deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// List files in a directory (non-recursive)
app.get('/api/list-files', (req, res) => {
  const relDir = req.query.dir;
  if (!relDir) return res.status(400).send('Missing dir');
  const absDir = path.join(BASE_DIR, relDir);
  if (!absDir.startsWith(BASE_DIR)) return res.status(403).send('Forbidden');
  fs.readdir(absDir, (err, files) => {
    if (err) return res.status(404).send('Directory not found');
    // Only return files, not directories
    const fileList = files.filter(f => {
      try {
        return fs.statSync(path.join(absDir, f)).isFile();
      } catch {
        return false;
      }
    });
    res.json(fileList);
  });
});

// List all versions of a file (v0 and versioned files)
app.get('/api/list-versions', (req, res) => {
  const relFile = req.query.file;
  if (!relFile) return res.status(400).send('Missing file');
  const absFile = path.join(BASE_DIR, relFile);
  if (!absFile.startsWith(BASE_DIR)) return res.status(403).send('Forbidden');
  const dir = path.dirname(absFile);
  const base = path.basename(relFile);
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(404).send('Directory not found');
    // v0 (workspace file)
    const versions = [];
    if (fs.existsSync(absFile)) {
      const stat = fs.statSync(absFile);
      versions.push({
        versionLabel: 'V0 (Workspace)',
        uploadedAt: stat.mtime,
        status: 'Current',
        isCurrent: true,
        file: relFile
      });
    }
    // Find all versioned files (e.g., base.20240615T123456.diff.json)
    const versionRegex = new RegExp(`^${base.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")}\\.(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z)\\.diff\\.json$`);
    files.forEach(f => {
      const m = f.match(versionRegex);
      if (m) {
        const stat = fs.statSync(path.join(dir, f));
        versions.push({
          versionLabel: `V${m[1]}`,
          uploadedAt: stat.mtime,
          status: 'Pending',
          isCurrent: false,
          file: path.join(path.dirname(relFile), f).replace(/\\/g, '/')
        });
      }
    });
    // Sort by versionLabel descending (latest first)
    versions.sort((a, b) => (b.versionLabel || '').localeCompare(a.versionLabel || ''));
    res.json(versions);
  });
});

// Catch-all unmatched route debug logger
app.use((req, res) => {
  console.log('[DEBUG] Unmatched route:', req.method, req.url);
  res.status(404).send('Not found');
});

const PORT = 3001;
app.listen(PORT, () => console.log(`File API running on http://localhost:${PORT}`));