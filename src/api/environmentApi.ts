// environmentApi.ts - API utilities for environment onboarding

export async function getEnvironments() {
  const resp = await fetch('/api/environments');
  if (!resp.ok) throw new Error('Failed to fetch environments');
  return resp.json();
}

export async function addEnvironment(env: any) {
  const resp = await fetch('/api/environments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(env),
  });
  if (!resp.ok) throw new Error('Failed to add environment');
  return resp.json();
}

export async function updateEnvironment(id: string, env: any) {
  const resp = await fetch(`/api/environments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(env),
  });
  if (!resp.ok) throw new Error('Failed to update environment');
  return resp.json();
}

export async function deleteEnvironment(id: string) {
  const resp = await fetch(`/api/environments/${id}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error('Failed to delete environment');
  return resp.json();
}
