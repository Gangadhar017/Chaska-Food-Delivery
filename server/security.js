// Password hashing and session tokens for the server, built on node:crypto.

import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

// Checked against when the account does not exist, so a wrong email costs as much as a wrong password.
const DUMMY_HASH = `scrypt:${'00'.repeat(16)}:${'00'.repeat(KEY_LENGTH)}`

async function verifyPassword(password, stored) {
  const [scheme, saltHex, keyHex] = String(stored || DUMMY_HASH).split(':')
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'), expected.length)
  return timingSafeEqual(actual, expected) && Boolean(stored)
}

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** Build the environment object the API core needs, signing tokens with `secret`. */
export function createServerEnv(secret, now = () => Date.now()) {
  const sign = (payload) => createHmac('sha256', secret).update(payload).digest('base64url')

  return {
    now,
    id: () => randomUUID(),
    hashPassword,
    verifyPassword,
    async issueToken(userId) {
      const payload = encode({ sub: userId, exp: now() + TOKEN_TTL_MS })
      return `${payload}.${sign(payload)}`
    },
    async readToken(token) {
      const [payload, signature] = String(token || '').split('.')
      if (!payload || !signature) return null
      const expected = Buffer.from(sign(payload))
      const given = Buffer.from(signature)
      if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
      try {
        const { sub, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
        return typeof sub === 'string' && exp > now() ? sub : null
      } catch {
        return null
      }
    },
  }
}
