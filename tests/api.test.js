import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createApi, DEMO_ACCOUNT, seedDemoAccount } from '../shared/api.js'
import { createMemoryStore } from '../shared/memoryStore.js'

/** An API instance on an in-memory store, with a clock the test can move. */
function harness() {
  let now = Date.UTC(2026, 0, 15, 13, 0, 0)
  let counter = 0
  const sessions = new Map()
  const store = createMemoryStore()
  const env = {
    now: () => now,
    id: () => `id-${++counter}`,
    hashPassword: async (password) => `plain:${password}`,
    verifyPassword: async (password, stored) => stored === `plain:${password}`,
    issueToken: async (userId) => {
      const token = `token-${++counter}`
      sessions.set(token, userId)
      return token
    },
    readToken: async (token) => sessions.get(token) || null,
  }
  const api = createApi({ store, env, config: { secondsPerMinute: 4 } })
  const call = (method, path, { query, body, token } = {}) => api.handle({ method, path, query, body, token })
  return { api, store, env, call, advance: (ms) => { now += ms } }
}

async function fails(promise, status, code) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.name, 'ApiError')
    assert.equal(error.status, status)
    if (code) assert.equal(error.code, code)
    return true
  })
}

async function signedUp(h, email = 'meera@example.com') {
  const { token, user } = await h.call('POST', '/auth/register', {
    body: { name: 'Meera Iyer', email, password: 'correct-horse', phone: '98765 43210' },
  })
  const { address } = await h.call('POST', '/me/addresses', {
    token,
    body: { label: 'Home', line1: '22 Lake View Road', landmark: 'Opp. the park', localityId: 'blr-koramangala' },
  })
  return { token, user, address }
}

async function firstDish(h, outletId = 'malgudi-tiffin-room-blr') {
  const { menu } = await h.call('GET', `/restaurants/${outletId}`, { query: { locality: 'blr-koramangala' } })
  return menu[0].items.find((dish) => dish.inStock)
}

test('meta, home and restaurant pages', async () => {
  const h = harness()
  const meta = await h.call('GET', '/meta')
  assert.equal(meta.cities.length, 8)
  assert.ok(meta.cuisines.length > 10)

  const home = await h.call('GET', '/home', { query: { locality: 'mat-vrindavan' } })
  assert.equal(home.locality.cityName, 'Mathura')
  assert.ok(home.total >= 15 && home.topRated.length > 0 && home.quick.length > 0)
  assert.ok(home.cuisines.every((c) => c.count > 0))

  const fallback = await h.call('GET', '/home', { query: { locality: 'nowhere' } })
  assert.equal(fallback.locality.id, 'blr-koramangala')

  const page = await h.call('GET', '/restaurants/malgudi-tiffin-room-blr', { query: { locality: 'blr-koramangala' } })
  assert.equal(page.outlet.name, 'Malgudi Tiffin Room')
  assert.ok(page.menu.length >= 3)
  assert.ok(page.coupons.some((c) => c.code === 'MALGUDI15'))
  assert.equal(page.favourite, false)

  await fails(h.call('GET', '/restaurants/not-a-place'), 404)
  await fails(h.call('GET', '/nothing-here'), 404)
})

test('registration validates input and rejects duplicate emails', async () => {
  const h = harness()
  const body = { name: 'Meera Iyer', email: 'Meera@Example.com', password: 'correct-horse' }
  const { user, token } = await h.call('POST', '/auth/register', { body })
  assert.equal(user.email, 'meera@example.com')
  assert.equal(user.passwordHash, undefined)
  assert.ok(token)

  await fails(h.call('POST', '/auth/register', { body }), 409, 'EMAIL_TAKEN')
  await fails(h.call('POST', '/auth/register', { body: { ...body, email: 'nope' } }), 400)
  await fails(h.call('POST', '/auth/register', { body: { ...body, email: 'a@b.co', password: 'short' } }), 400)
  await fails(h.call('POST', '/auth/register', { body: { ...body, email: 'a@b.co', name: 'M' } }), 400)
  await fails(h.call('POST', '/auth/register', { body: { ...body, email: 'a@b.co', phone: '12345' } }), 400)
})

test('login, profile and protected routes', async () => {
  const h = harness()
  await signedUp(h)
  await fails(h.call('POST', '/auth/login', { body: { email: 'meera@example.com', password: 'wrong' } }), 401, 'INVALID_CREDENTIALS')
  await fails(h.call('POST', '/auth/login', { body: { email: 'ghost@example.com', password: 'correct-horse' } }), 401, 'INVALID_CREDENTIALS')

  const { token } = await h.call('POST', '/auth/login', { body: { email: ' MEERA@example.com ', password: 'correct-horse' } })
  const me = await h.call('GET', '/me', { token })
  assert.equal(me.user.name, 'Meera Iyer')
  assert.equal(me.user.phone, '9876543210')

  const updated = await h.call('PATCH', '/me', { token, body: { name: 'Meera R. Iyer' } })
  assert.equal(updated.user.name, 'Meera R. Iyer')

  await fails(h.call('GET', '/me'), 401)
  await fails(h.call('GET', '/orders', { token: 'forged' }), 401)
})

test('addresses belong to their owner', async () => {
  const h = harness()
  const meera = await signedUp(h)
  const ravi = await signedUp(h, 'ravi@example.com')

  await fails(h.call('POST', '/me/addresses', { token: meera.token, body: { line1: 'x', localityId: 'blr-koramangala' } }), 400)
  await fails(h.call('POST', '/me/addresses', { token: meera.token, body: { line1: 'Flat 2, Rose Villa', localityId: 'atlantis' } }), 400)

  const edited = await h.call('PUT', `/me/addresses/${meera.address.id}`, {
    token: meera.token,
    body: { label: 'Work', line1: '9 Residency Road', localityId: 'blr-mg-road' },
  })
  assert.equal(edited.address.localityName, 'MG Road')

  await fails(h.call('PUT', `/me/addresses/${meera.address.id}`, { token: ravi.token, body: { line1: 'Mine now', localityId: 'blr-mg-road' } }), 404)
  await fails(h.call('DELETE', `/me/addresses/${meera.address.id}`, { token: ravi.token }), 404)

  await h.call('DELETE', `/me/addresses/${meera.address.id}`, { token: meera.token })
  assert.equal((await h.call('GET', '/me/addresses', { token: meera.token })).items.length, 0)
  assert.equal((await h.call('GET', '/me/addresses', { token: ravi.token })).items.length, 1)
})

test('favourites can be switched on and off', async () => {
  const h = harness()
  const { token } = await signedUp(h)
  await h.call('PUT', '/me/favourites/scoop-theory-blr', { token, body: { on: true } })
  await h.call('PUT', '/me/favourites/deg-and-dum-blr', { token, body: { on: true } })
  const saved = await h.call('GET', '/me/favourites', { token, query: { locality: 'blr-koramangala' } })
  assert.equal(saved.outlets.length, 2)
  assert.equal((await h.call('GET', '/restaurants/scoop-theory-blr', { token })).favourite, true)

  const after = await h.call('PUT', '/me/favourites/scoop-theory-blr', { token, body: { on: false } })
  assert.deepEqual(after.ids, ['deg-and-dum-blr'])
  await fails(h.call('PUT', '/me/favourites/no-such-outlet', { token, body: { on: true } }), 404)
})

test('quotes work signed out and use the saved address when signed in', async () => {
  const h = harness()
  const dish = await firstDish(h)
  const lines = [{ dishId: dish.id, quantity: 2 }]

  const guest = await h.call('POST', '/quote', { body: { outletId: 'malgudi-tiffin-room-blr', localityId: 'blr-koramangala', lines } })
  assert.equal(guest.bill.itemTotal, guest.lines[0].unitPrice * 2)
  assert.equal(guest.canCheckout, true)

  const { token } = await signedUp(h)
  const { address: mumbai } = await h.call('POST', '/me/addresses', {
    token, body: { label: 'Other', line1: '5 Carter Road', localityId: 'mum-bandra-west' },
  })
  const far = await h.call('POST', '/quote', { token, body: { outletId: 'malgudi-tiffin-room-blr', addressId: mumbai.id, lines } })
  assert.equal(far.canCheckout, false)
  assert.match(far.blocker, /cannot deliver to Mumbai/)
})

test('placing, tracking, rating and re-reading an order', async () => {
  const h = harness()
  const { token, address } = await signedUp(h)
  const dish = await firstDish(h)
  const cart = { outletId: 'malgudi-tiffin-room-blr', addressId: address.id, lines: [{ dishId: dish.id, quantity: 3 }], couponCode: 'WELCOME50', tip: 20 }

  const quote = await h.call('POST', '/quote', { token, body: cart })
  assert.equal(quote.coupon.applied, true)

  await fails(h.call('POST', '/orders', { body: { ...cart, paymentMethod: 'upi' } }), 401)
  await fails(h.call('POST', '/orders', { token, body: cart }), 400)
  await fails(h.call('POST', '/orders', { token, body: { ...cart, paymentMethod: 'upi', expectedTotal: quote.bill.total + 1 } }), 409, 'PRICE_CHANGED')
  await fails(h.call('POST', '/orders', { token, body: { ...cart, paymentMethod: 'upi', addressId: 'someone-elses' } }), 404)

  const { order } = await h.call('POST', '/orders', {
    token,
    body: { ...cart, paymentMethod: 'upi', expectedTotal: quote.bill.total, instructions: '  Less   spicy please ', noContact: true },
  })
  assert.match(order.number, /^CHK-[0-9A-Z]{7}$/)
  assert.equal(order.bill.total, quote.bill.total)
  assert.equal(order.payment.status, 'paid')
  assert.equal(order.instructions, 'Less spicy please')
  assert.equal(order.tracking.status, 'placed')
  assert.equal(order.tracking.etaMinutes, order.etaMinutes)
  assert.ok(order.rider.name)

  await fails(h.call('POST', `/orders/${order.id}/rating`, { token, body: { stars: 5 } }), 409, 'NOT_DELIVERED')

  h.advance(order.schedule.pickedUpAt - order.placedAt + 1000)
  const riding = await h.call('GET', `/orders/${order.id}`, { token })
  assert.equal(riding.order.tracking.status, 'picked_up')
  await fails(h.call('POST', `/orders/${order.id}/cancel`, { token }), 409, 'TOO_LATE_TO_CANCEL')

  h.advance(order.etaMinutes * 4 * 1000)
  const delivered = await h.call('GET', `/orders/${order.id}`, { token })
  assert.equal(delivered.order.tracking.status, 'delivered')

  await fails(h.call('POST', `/orders/${order.id}/rating`, { token, body: { stars: 9 } }), 400)
  const rated = await h.call('POST', `/orders/${order.id}/rating`, { token, body: { stars: 4, comment: 'Crisp dosa.' } })
  assert.equal(rated.order.rating.stars, 4)

  const list = await h.call('GET', '/orders', { token })
  assert.equal(list.items.length, 1)

  // The welcome coupon is spent now.
  const again = await h.call('POST', '/quote', { token, body: cart })
  assert.equal(again.coupon.applied, false)
  await fails(h.call('POST', '/orders', { token, body: { ...cart, paymentMethod: 'cod' } }), 409, 'COUPON_REJECTED')
})

test('an order can be cancelled early and nobody else can see it', async () => {
  const h = harness()
  const meera = await signedUp(h)
  const ravi = await signedUp(h, 'ravi@example.com')
  const dish = await firstDish(h)
  const { order } = await h.call('POST', '/orders', {
    token: meera.token,
    body: { outletId: 'malgudi-tiffin-room-blr', addressId: meera.address.id, lines: [{ dishId: dish.id, quantity: 4 }], paymentMethod: 'card' },
  })

  await fails(h.call('GET', `/orders/${order.id}`, { token: ravi.token }), 404)
  await fails(h.call('POST', `/orders/${order.id}/cancel`, { token: ravi.token }), 404)

  h.advance(3000)
  const cancelled = await h.call('POST', `/orders/${order.id}/cancel`, { token: meera.token })
  assert.equal(cancelled.order.tracking.status, 'cancelled')
  assert.equal(cancelled.order.payment.status, 'refunded')
  await fails(h.call('POST', `/orders/${order.id}/cancel`, { token: meera.token }), 409)

  // A cancelled order does not use up the first-order coupon.
  const quote = await h.call('POST', '/quote', {
    token: meera.token,
    body: { outletId: 'malgudi-tiffin-room-blr', addressId: meera.address.id, lines: [{ dishId: dish.id, quantity: 4 }], couponCode: 'WELCOME50' },
  })
  assert.equal(quote.coupon.applied, true)
})

test('checkout refuses an empty cart and unknown payment methods', async () => {
  const h = harness()
  const { token, address } = await signedUp(h)
  const base = { outletId: 'malgudi-tiffin-room-blr', addressId: address.id }
  await fails(h.call('POST', '/orders', { token, body: { ...base, lines: [], paymentMethod: 'upi' } }), 409, 'CANNOT_CHECKOUT')
  await fails(h.call('POST', '/orders', { token, body: { ...base, lines: [{ dishId: 'gone', quantity: 1 }], paymentMethod: 'upi' } }), 409, 'CART_CHANGED')
  const dish = await firstDish(h)
  await fails(h.call('POST', '/orders', { token, body: { ...base, lines: [{ dishId: dish.id, quantity: 1 }], paymentMethod: 'bitcoin' } }), 400)
})

test('the demo account is seeded once, with addresses', async () => {
  const h = harness()
  await seedDemoAccount(h)
  await seedDemoAccount(h)
  const { token, user } = await h.call('POST', '/auth/login', { body: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password } })
  assert.equal(user.name, DEMO_ACCOUNT.name)
  assert.equal((await h.call('GET', '/me/addresses', { token })).items.length, 2)
})

test('a demo account created under its former name is renamed', async () => {
  const h = harness()
  await seedDemoAccount(h)
  const demo = await h.store.findUserByEmail(DEMO_ACCOUNT.email)

  await h.store.updateUser(demo.id, { name: 'Aarav Sharma' })
  await seedDemoAccount(h)
  assert.equal((await h.store.findUserByEmail(DEMO_ACCOUNT.email)).name, 'Gangadhar Singh')

  // A name someone typed into the profile themselves is left alone.
  await h.store.updateUser(demo.id, { name: 'Someone Else' })
  await seedDemoAccount(h)
  assert.equal((await h.store.findUserByEmail(DEMO_ACCOUNT.email)).name, 'Someone Else')
  assert.equal((await h.call('GET', '/me/addresses', { token: (await h.call('POST', '/auth/login', { body: DEMO_ACCOUNT })).token })).items.length, 2)
})
