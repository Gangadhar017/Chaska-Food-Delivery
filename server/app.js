// The Express application: a thin HTTP shell around the shared API core.

import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createApi, seedDemoAccount } from '../shared/api.js'
import { ApiError } from '../shared/core/util.js'
import { createServerEnv } from './security.js'
import { createSqliteStore } from './sqliteStore.js'

/** A fixed-window request limiter, kept in memory. Enough for a single-process deployment. */
function rateLimit({ windowMs, max }) {
  const hits = new Map()
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key)
  }, windowMs)
  sweep.unref()

  return (req, res, next) => {
    const now = Date.now()
    const key = req.ip || 'unknown'
    let entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }
    entry.count += 1
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return next(new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many attempts. Please wait a few minutes and try again.'))
    }
    next()
  }
}

export async function createApp({ dbFile = ':memory:', secret, secondsPerMinute, staticDir, corsOrigin, now } = {}) {
  const store = createSqliteStore(dbFile)
  const env = createServerEnv(secret, now)
  const api = createApi({ store, env, config: { secondsPerMinute } })
  await seedDemoAccount({ store, env })

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    if (corsOrigin && req.headers.origin === corsOrigin) {
      res.set({
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
        Vary: 'Origin',
      })
      if (req.method === 'OPTIONS') return res.sendStatus(204)
    }
    next()
  })

  app.use('/api', express.json({ limit: '64kb' }))
  app.use('/api', rateLimit({ windowMs: 60_000, max: 600 }))
  app.use('/api/auth', rateLimit({ windowMs: 10 * 60_000, max: 40 }))

  app.get('/api/health', (req, res) => res.json({ ok: true, uptime: Math.round(process.uptime()) }))

  app.use('/api', async (req, res, next) => {
    try {
      const header = req.headers.authorization || ''
      const data = await api.handle({
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        token: header.startsWith('Bearer ') ? header.slice(7) : null,
      })
      res.set('Cache-Control', 'no-store').json(data)
    } catch (error) {
      next(error)
    }
  })

  if (staticDir && existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }))
    // Client-side routes: anything that is not a file gets the app shell.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || path.extname(req.path)) return next()
      res.sendFile(path.join(staticDir, 'index.html'))
    })
  }

  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } }))

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error instanceof ApiError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details } })
    }
    if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'The request body could not be read.' } })
    }
    console.error(error)
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' } })
  })

  return { app, store, close: () => store.close() }
}
