// userApi.ts - API utilities for user onboarding

export async function getUsers() {
  const resp = await fetch('/api/users');
  if (!resp.ok) throw new Error('Failed to fetch users');
  return resp.json();
}

export async function addUser(user: any) {
  const resp = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!resp.ok) throw new Error('Failed to add user');
  return resp.json();
}

export async function updateUser(id: string, user: any) {
  const resp = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!resp.ok) throw new Error('Failed to update user');
  return resp.json();
}

export async function deleteUser(id: string) {
  const resp = await fetch(`/api/users/${id}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error('Failed to delete user');
  return resp.json();
}
