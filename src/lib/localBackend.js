// Runs the API core inside the browser, with localStorage as the database.
// This is what the static demo deployment uses: accounts, addresses and orders are real
// to the app, but they never leave this browser.

import { createApi, seedDemoAccount } from '../../shared/api.js'
import { hash } from '../../shared/core/util.js'
import { createMemoryStore } from '../../shared/memoryStore.js'

const DB_KEY = 'chaska.db.v1'
const SESSIONS_KEY = 'chaska.sessions.v1'

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Out of space or storage disabled: carry on in memory for this visit.
  }
}

const hex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

async function derive(password, salt) {
  if (globalThis.crypto?.subtle) {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 60_000 }, key, 256)
    return hex(bits)
  }
  // Web Crypto needs a secure context. On plain http fall back to a simple stretch;
  // nothing leaves the browser in this mode either way.
  let value = `${salt}:${password}`
  for (let i = 0; i < 2000; i++) value = hash(value + i).toString(16) + value.slice(0, 48)
  return value
}

const randomId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`)

const env = {
  now: () => Date.now(),
  id: randomId,
  async hashPassword(password) {
    const salt = randomId()
    return `pbkdf2:${salt}:${await derive(password, salt)}`
  },
  async verifyPassword(password, stored) {
    if (!stored) return false
    const [, salt, expected] = stored.split(':')
    return (await derive(String(password), salt)) === expected
  },
  async issueToken(userId) {
    const sessions = read(SESSIONS_KEY) || {}
    const token = `local.${randomId()}`
    sessions[token] = userId
    write(SESSIONS_KEY, sessions)
    return token
  },
  async readToken(token) {
    return (read(SESSIONS_KEY) || {})[token] || null
  },
}

const store = createMemoryStore({ load: () => read(DB_KEY), save: (state) => write(DB_KEY, state) })
const api = createApi({ store, env })
const ready = seedDemoAccount({ store, env })

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function dispatch({ method, path, query, body, token }) {
  await ready
  // A short, uneven delay so loading states behave the way they would against a server.
  await pause(method === 'GET' ? 110 + Math.random() * 180 : 260 + Math.random() * 240)
  // Copy in and out so callers cannot hold references into the store.
  const result = await api.handle({ method, path, query, body: body ? structuredClone(body) : {}, token })
  return structuredClone(result)
}
