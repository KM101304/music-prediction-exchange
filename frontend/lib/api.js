const API_URL = '/api';
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

export async function request(path, { method = 'GET', token, body, headers: extraHeaders } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (_error) {
    throw new Error('Network connection failed. Please try again.');
  }

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
