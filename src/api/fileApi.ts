// fileApi.ts - Secure file API client for Maker-Checker React app
// All requests are sent to the backend API (see server.js)
// All file paths are always relative to the public/ folder (never absolute)

const API_BASE = 'http://localhost:3001/api';

// Helper to sanitize/validate file paths (prevent path traversal)
export function sanitizePath(relPath: string): string {
  // Remove any .. or absolute path attempts
  return relPath.replace(/\\/g, '/').replace(/\.\.+/g, '').replace(/^\//, '');
}

export async function readFile(relPath: string): Promise<string> {
  const safePath = sanitizePath(relPath);
  const resp = await fetch(`${API_BASE}/file?path=${encodeURIComponent(safePath)}`);
  if (!resp.ok) throw new Error('File read failed: ' + (await resp.text()));
  return await resp.text();
}

export async function writeFile(relPath: string, content: string): Promise<void> {
  const safePath = sanitizePath(relPath);
  const resp = await fetch(`${API_BASE}/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: safePath, content }),
  });
  if (!resp.ok) throw new Error('File write failed: ' + (await resp.text()));
}
