// ------------------------------------------------------------------
// The ONLY place that talks to the backend with fetch().
// Every service (authService, browseService ...) calls api() from here.
//  - adds the login token (Authorization: Bearer ...) to every request
//  - turns every error into a readable ApiError (message comes from the backend)
//  - if the token is rejected (401) the session is cleared so the app shows the login page
// ------------------------------------------------------------------
import { API_URL } from '../config';

const TOKEN_KEY = 'cb_token';
const USER_KEY = 'cb_user';

/** Save / read the login session in the browser (localStorage) */
export const session = {
  token: () => localStorage.getItem(TOKEN_KEY),
  user: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
  },
  save: (auth) => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  },
  saveUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/** Error with the HTTP status (status 0 = server not reachable) */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Photos come from the backend as "/uploads/..." - put the server address in front. */
export const img = (path) => {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_URL}${path}`;
};

/** { a: 1, ids: [1,2], x: undefined } -> "a=1&ids=1&ids=2"  (arrays are repeated, empty values skipped) */
const toQuery = (obj) => {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.append(k, v);
  });
  return sp.toString();
};

/** Find a readable message in whatever the backend sent */
const messageFrom = (data, status) => {
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');   // ASP.NET validation errors
  if (data?.title) return data.title;
  if (status === 404) return 'Not found.';
  if (status === 403) return 'You are not allowed to do this.';
  if (status >= 500) return 'Server error. Please try again.';
  return `Request failed (${status})`;
};

/**
 * api('/api/dishes', { query: { q: 'pizza' } })
 * api('/api/auth/login', { method: 'POST', body: {...} })
 * api('/api/reviews/5/photos', { method: 'POST', form: formData })
 */
export async function api(path, { method = 'GET', body, form, query, signal } = {}) {
  const headers = {};
  const token = session.token();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let url = API_URL + path;
  if (query) {
    const qs = toQuery(query);
    if (qs) url += (path.includes('?') ? '&' : '?') + qs;
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined), signal });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(`Cannot reach the CityBite server (${API_URL}). Is the backend running?`, 0);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (e) { data = { message: text.slice(0, 200) }; }
  }

  if (!res.ok) {
    // token missing / expired -> clear it and tell the app (AuthContext listens)
    if (res.status === 401 && token) {
      session.clear();
      window.dispatchEvent(new Event('cb:session-expired'));
    }
    throw new ApiError(messageFrom(data, res.status), res.status, data);
  }
  return data;
}
