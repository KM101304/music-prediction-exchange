const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('mpx_token');
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem('mpx_token', token);
  } else {
    localStorage.removeItem('mpx_token');
  }
}

export { API_URL };
