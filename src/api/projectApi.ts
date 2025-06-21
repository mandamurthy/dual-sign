// projectApi.ts - API utilities for project onboarding

export async function getProjects() {
  const resp = await fetch('/api/projects');
  if (!resp.ok) throw new Error('Failed to fetch projects');
  return resp.json();
}

export async function addProject(project: any) {
  const resp = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!resp.ok) throw new Error('Failed to add project');
  return resp.json();
}

export async function updateProject(id: string, project: any) {
  const resp = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!resp.ok) throw new Error('Failed to update project');
  return resp.json();
}

export async function deleteProject(id: string) {
  const resp = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error('Failed to delete project');
  return resp.json();
}
