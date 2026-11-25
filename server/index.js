// Entry point for the API server. In production it also serves the built web app.

import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.resolve(root, process.env.DATA_DIR || 'data')
mkdirSync(dataDir, { recursive: true })

/** Use AUTH_SECRET when it is set; otherwise keep a generated one beside the database. */
function loadSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET
  const file = path.join(dataDir, 'auth-secret')
  if (!existsSync(file)) writeFileSync(file, randomBytes(48).toString('hex'), { mode: 0o600 })
  return readFileSync(file, 'utf8').trim()
}

const port = Number(process.env.PORT) || 4000
const { app } = await createApp({
  dbFile: path.join(dataDir, 'chaska.sqlite'),
  secret: loadSecret(),
  secondsPerMinute: process.env.ORDER_SECONDS_PER_MINUTE,
  staticDir: path.join(root, 'dist'),
  corsOrigin: process.env.CORS_ORIGIN,
})

app.listen(port, () => {
  console.log(`Chaska API listening on http://localhost:${port}`)
})
