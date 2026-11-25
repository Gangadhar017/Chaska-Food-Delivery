import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { DEMO_ACCOUNT } from '../shared/api.js'
import { createApp } from '../server/app.js'
import { createServerEnv } from '../server/security.js'

const dir = mkdtempSync(path.join(tmpdir(), 'chaska-test-'))
const dbFile = path.join(dir, 'test.sqlite')
let base
let server
let closeStore

async function boot() {
  const { app, close } = await createApp({ dbFile, secret: 'test-secret', secondsPerMinute: 4 })
  closeStore = close
  server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening))
  })
  base = `http://127.0.0.1:${server.address().port}/api`
}

async function shutdown() {
  await new Promise((resolve) => server.close(resolve))
  closeStore()
}

before(boot)
after(async () => {
  await shutdown()
  rmSync(dir, { recursive: true, force: true })
})

async function http(method, url, { body, token } = {}) {
  const response = await fetch(base + url, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: response.status, headers: response.headers, data: await response.json() }
}

test('health check and security headers', async () => {
  const { status, headers, data } = await http('GET', '/health')
  assert.equal(status, 200)
  assert.equal(data.ok, true)
  assert.equal(headers.get('x-content-type-options'), 'nosniff')
  assert.equal(headers.get('x-powered-by'), null)
})

test('errors come back as JSON with a code', async () => {
  const missing = await http('GET', '/restaurants/unknown')
  assert.equal(missing.status, 404)
  assert.equal(missing.data.error.code, 'NOT_FOUND')

  const locked = await http('GET', '/orders')
  assert.equal(locked.status, 401)

  const garbage = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{not json' })
  assert.equal(garbage.status, 400)
})

test('query string filters reach the listing', async () => {
  const { data } = await http('GET', '/restaurants?locality=del-saket&veg=1&sort=rating&limit=5')
  assert.equal(data.locality.cityName, 'Delhi NCR')
  assert.ok(data.items.length > 0 && data.items.length <= 5)
  assert.ok(data.items.every((outlet) => outlet.veg))
})

test('a full order over HTTP survives a restart', async () => {
  const login = await http('POST', '/auth/login', { body: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password } })
  assert.equal(login.status, 200)
  const token = login.data.token

  const addresses = await http('GET', '/me/addresses', { token })
  const address = addresses.data.items[0]
  const page = await http('GET', '/restaurants/smash-and-bun-blr?locality=blr-koramangala')
  const dish = page.data.menu[0].items.find((item) => item.inStock)

  const placed = await http('POST', '/orders', {
    token,
    body: { outletId: 'smash-and-bun-blr', addressId: address.id, lines: [{ dishId: dish.id, quantity: 2 }], paymentMethod: 'cod' },
  })
  assert.equal(placed.status, 200)
  assert.equal(placed.data.order.payment.status, 'due')
  const orderId = placed.data.order.id

  await shutdown()
  await boot()

  const again = await http('GET', `/orders/${orderId}`, { token })
  assert.equal(again.status, 200)
  assert.equal(again.data.order.lines[0].dishId, dish.id)
  assert.equal(again.data.order.bill.total, placed.data.order.bill.total)
})

test('passwords are hashed and tokens cannot be forged', async () => {
  const env = createServerEnv('secret-a')
  const stored = await env.hashPassword('open-sesame')
  assert.ok(!stored.includes('open-sesame'))
  assert.equal(await env.verifyPassword('open-sesame', stored), true)
  assert.equal(await env.verifyPassword('open-sesame!', stored), false)
  assert.equal(await env.verifyPassword('anything', null), false)

  const token = await env.issueToken('user-1')
  assert.equal(await env.readToken(token), 'user-1')
  assert.equal(await env.readToken(`${token}x`), null)
  assert.equal(await createServerEnv('secret-b').readToken(token), null)

  const [payload, signature] = token.split('.')
  const tampered = Buffer.from(JSON.stringify({ sub: 'user-2', exp: Date.now() + 1e9 })).toString('base64url')
  assert.equal(await env.readToken(`${tampered}.${signature}`), null)
  assert.ok(payload)

  let clock = 1_000
  const timed = createServerEnv('secret-a', () => clock)
  const old = await timed.issueToken('user-1')
  clock += 31 * 24 * 60 * 60 * 1000
  assert.equal(await timed.readToken(old), null)
})
