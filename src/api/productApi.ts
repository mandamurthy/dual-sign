// productApi.ts - API utilities for product onboarding

export async function getProducts() {
  const resp = await fetch('/api/products');
  if (!resp.ok) throw new Error('Failed to fetch products');
  return resp.json();
}

export async function addProduct(product: any) {
  const resp = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!resp.ok) throw new Error('Failed to add product');
  return resp.json();
}

export async function updateProduct(id: string, product: any) {
  const resp = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!resp.ok) throw new Error('Failed to update product');
  return resp.json();
}

export async function deleteProduct(id: string) {
  const resp = await fetch(`/api/products/${id}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error('Failed to delete product');
  return resp.json();
}
