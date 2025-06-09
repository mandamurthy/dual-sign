const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const BASE_DIR = path.join(__dirname, 'public'); // restrict to public folder

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

const PORT = 3001;
app.listen(PORT, () => console.log(`File API running on http://localhost:${PORT}`));