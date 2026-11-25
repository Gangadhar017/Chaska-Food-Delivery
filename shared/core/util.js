// Small helpers shared by the catalog and the API core. No Node or browser APIs here.

/** FNV-1a hash of a string, as an unsigned 32-bit integer. */
export function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** A seeded random generator (mulberry32). Same seed, same sequence, on every machine. */
export function seededRandom(seed) {
  let a = typeof seed === 'string' ? hash(seed) : seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/** Round rupees to two decimals without floating point drift. */
export function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Menu prices end in 9 above ₹100 and in 0 or 5 below it, like real menus do. */
export function menuPrice(value) {
  if (value < 100) return Math.max(5, Math.round(value / 5) * 5)
  return Math.round(value / 10) * 10 - 1
}

/** Road distance between two grid points: straight line with a detour factor. */
export function roadDistanceKm(a, b) {
  const straight = Math.hypot(a.x - b.x, a.y - b.y)
  return Math.max(0.4, Math.round(straight * 1.3 * 10) / 10)
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    if (details) this.details = details
  }
}

export const badRequest = (message, details) => new ApiError(400, 'BAD_REQUEST', message, details)
export const unauthorized = (message = 'Please sign in to continue.') => new ApiError(401, 'UNAUTHORIZED', message)
export const notFound = (message = 'We could not find that.') => new ApiError(404, 'NOT_FOUND', message)
export const conflict = (code, message) => new ApiError(409, code, message)
