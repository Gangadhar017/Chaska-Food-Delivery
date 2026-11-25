// One request function, two transports.
// With VITE_API_URL set the app talks to the Express server over HTTP. Without it, the
// same API core runs inside the browser (see localBackend.js), so the static build works
// on its own. Callers cannot tell the difference.

import { ApiError } from '../../shared/core/util.js'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'chaska.token'

export const backendMode = API_URL ? 'server' : 'browser'

let token = null
try {
  token = localStorage.getItem(TOKEN_KEY)
} catch {
  token = null
}

const sessionListeners = new Set()

export function getToken() {
  return token
}

export function setToken(next) {
  token = next || null
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage can be unavailable in private windows; the session then lasts for this tab only.
  }
}

/** Called when the server says our token is no longer good. */
export function onSessionExpired(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

function cleanQuery(query) {
  const out = {}
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '' || value === false) continue
    out[key] = value === true ? '1' : String(value)
  }
  return out
}

async function overHttp(method, path, query, body) {
  const search = new URLSearchParams(query).toString()
  let response
  try {
    response = await fetch(`${API_URL}${path}${search ? `?${search}` : ''}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'We could not reach Chaska. Check your connection and try again.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const error = data?.error || {}
    throw new ApiError(response.status, error.code || 'ERROR', error.message || 'Something went wrong. Please try again.', error.details)
  }
  return data
}

let local = null
async function inBrowser(method, path, query, body) {
  if (!local) local = import('./localBackend.js')
  const { dispatch } = await local
  return dispatch({ method, path, query, body, token })
}

export async function request(method, path, { query, body } = {}) {
  const transport = API_URL ? overHttp : inBrowser
  try {
    return await transport(method, path, cleanQuery(query), body)
  } catch (error) {
    if (error?.status === 401 && token && error.code !== 'INVALID_CREDENTIALS') {
      setToken(null)
      sessionListeners.forEach((listener) => listener())
    }
    throw error
  }
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body, query) => request('POST', path, { body: body || {}, query }),
  put: (path, body) => request('PUT', path, { body: body || {} }),
  patch: (path, body) => request('PATCH', path, { body: body || {} }),
  delete: (path) => request('DELETE', path),
}
