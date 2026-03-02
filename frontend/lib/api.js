const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
let memoryToken = null;

function safeGetLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch (_error) {
    return null;
  }
}

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
  const storage = safeGetLocalStorage();
  if (!storage) {
    return memoryToken;
  }
  try {
    return storage.getItem('mpx_token') || memoryToken;
  } catch (_error) {
    return memoryToken;
  }
}

export function setStoredToken(token) {
  memoryToken = token || null;
  const storage = safeGetLocalStorage();
  if (!storage) {
    return;
  }
  try {
    if (token) {
      storage.setItem('mpx_token', token);
    } else {
      storage.removeItem('mpx_token');
    }
  } catch (_error) {
    // iOS private browsing and strict settings can block localStorage writes.
  }
}

export { API_URL };
