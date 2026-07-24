import { authState } from './stores/auth.svelte.js';

// Base API URL config. Can fall back to relative path if proxied, or point to Bun backend.
const BASE_URL = 'http://localhost:3000/api';

/**
 * Builds the request URL by prepending the BASE_URL (if relative path is supplied) 
 * and automatically injecting id_sekolah as a Tenant Isolation query param.
 */
function buildUrl(path, params = {}) {
  const baseUrlStr = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

  const url = new URL(baseUrlStr);

  // Automatically inject id_sekolah from reactive authState
  if (authState.id_sekolah) {
    url.searchParams.set('id_sekolah', authState.id_sekolah);
  }

  // Merge other query params
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  }

  return url.toString();
}

/**
 * Custom fetch wrapper that injects Authorization headers, 
 * handles tenant isolation query params, and parses JSON responses.
 */
async function request(method, path, body = null, options = {}) {
  const url = buildUrl(path, options.params);

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add Bearer authentication token if user is logged in
  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  const fetchOptions = {
    method,
    headers,
    signal: options.signal,
    credentials: options.credentials
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  // Use custom fetch (useful for SvelteKit load functions on SSR) or fallback to global fetch
  const executeFetch = options.fetch || fetch;

  try {
    const response = await executeFetch(url, fetchOptions);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const error = new Error(errorData.message || `API request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    return await response.json();
  } catch (err) {
    console.error(`API Client Error [${method} ${path}]:`, err);
    throw err;
  }
}

export const api = {
  get: (path, options = {}) => request('GET', path, null, options),
  post: (path, body, options = {}) => request('POST', path, body, options),
  put: (path, body, options = {}) => request('PUT', path, body, options),
  delete: (path, options = {}) => request('DELETE', path, null, options)
};
