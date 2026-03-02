const DIRECT_API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
const API_URL = DIRECT_API_URL || '/api';
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

  async function doFetch(baseUrl) {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  }

  let response = null;
  try {
    response = await doFetch(API_URL);
  } catch (_error) {
    if (!DIRECT_API_URL || API_URL === DIRECT_API_URL) {
      throw new Error('Network connection failed. Please try again.');
    }
    try {
      response = await doFetch(DIRECT_API_URL);
    } catch (_error2) {
      throw new Error('Network connection failed. Please try again.');
    }
  }

  if ((!response || response.status >= 500) && DIRECT_API_URL && API_URL !== DIRECT_API_URL) {
    try {
      const retryResponse = await doFetch(DIRECT_API_URL);
      if (retryResponse.ok || retryResponse.status < 500) {
        response = retryResponse;
      }
    } catch (_error) {
      // Keep original response path.
    }
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
