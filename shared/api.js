// The API, written once and run in two places.
//
// `createApi` takes a storage adapter and a small environment object (ids, clock, password
// hashing, session tokens) and returns a `handle` function. The Express server calls it
// with SQLite behind the store; the static demo build calls it in the browser with
// localStorage behind the store. Routes, validation and business rules are identical.

import { getCatalog } from './catalog/index.js'
import { listOutlets, nearbyOutlets, outletView, search, suggest, SORTS } from './core/listing.js'
import { buildQuote, RULES } from './core/pricing.js'
import { assignRider, planOrder, trackOrder } from './core/tracking.js'
import { ApiError, badRequest, conflict, hash, notFound, unauthorized } from './core/util.js'

export const DEMO_ACCOUNT = { name: 'Gangadhar Singh', email: 'demo@chaska.app', password: 'chaska-demo', phone: '9876543210' }
// What the demo account was called before. Accounts created back then are renamed when the app starts.
const FORMER_DEMO_NAME = 'Aarav Sharma'

const PAYMENT_METHODS = {
  upi: 'UPI',
  card: 'Credit or debit card',
  wallet: 'Wallet',
  cod: 'Cash on delivery',
}
const ADDRESS_LABELS = ['Home', 'Work', 'Other']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function text(value, { field, min = 0, max = 200, optional = false }) {
  const clean = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
  if (!clean) {
    if (optional) return ''
    throw badRequest(`${field} is required.`, { field })
  }
  if (clean.length < min) throw badRequest(`${field} must be at least ${min} characters.`, { field })
  if (clean.length > max) throw badRequest(`${field} must be ${max} characters or fewer.`, { field })
  return clean
}

function phoneNumber(value, optional = true) {
  const digits = String(value || '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  if (!digits && optional) return ''
  if (!/^[6-9]\d{9}$/.test(digits)) throw badRequest('Enter a 10-digit mobile number.', { field: 'phone' })
  return digits
}

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone || '', createdAt: user.createdAt })

function compile(path) {
  const names = []
  const pattern = path.replace(/:[a-zA-Z]+/g, (name) => {
    names.push(name.slice(1))
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${pattern}/?$`), names }
}

export function createApi({ store, env, config = {} }) {
  const catalog = getCatalog()
  const secondsPerMinute = Number(config.secondsPerMinute) > 0 ? Number(config.secondsPerMinute) : 4
  const routes = []

  const add = (method, path, auth, handler) => routes.push({ method, path, auth, handler, ...compile(path) })
  const open = (method, path, handler) => add(method, path, false, handler)
  const secure = (method, path, handler) => add(method, path, true, handler)

  const localityOf = (id) => catalog.locality(id) || catalog.locality(catalog.defaultLocalityId)
  const placeOf = (locality) => ({ id: locality.id, name: locality.name, cityId: locality.cityId, cityName: locality.cityName })

  function requireOutlet(id) {
    const outlet = catalog.outlet(id)
    if (!outlet) throw notFound('That restaurant is not on Chaska.')
    return outlet
  }

  const orderView = (order, now) => ({ ...order, tracking: trackOrder(order, now, secondsPerMinute) })

  function addressInput(body) {
    const label = ADDRESS_LABELS.includes(body.label) ? body.label : 'Home'
    const locality = catalog.locality(body.localityId)
    if (!locality) throw badRequest('Choose the area this address is in.', { field: 'localityId' })
    return {
      label,
      line1: text(body.line1, { field: 'Flat, house or building', min: 3, max: 120 }),
      landmark: text(body.landmark, { field: 'Landmark', max: 80, optional: true }),
      localityId: locality.id,
      localityName: locality.name,
      cityName: locality.cityName,
    }
  }

  // ── Catalog ────────────────────────────────────────────────────────────────

  open('GET', '/meta', () => ({
    cities: catalog.cities.map((city) => ({
      id: city.id,
      name: city.name,
      state: city.state,
      localities: city.localities.map((l) => ({ id: l.id, name: l.name })),
    })),
    cuisines: catalog.cuisines,
    defaultLocalityId: catalog.defaultLocalityId,
    sorts: Object.keys(SORTS),
    paymentMethods: PAYMENT_METHODS,
    secondsPerMinute,
    demoAccount: { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password },
  }))

  open('GET', '/home', ({ query }) => {
    const locality = localityOf(query.locality)
    const nearby = nearbyOutlets(catalog, locality)
    const counts = new Map()
    for (const outlet of nearby) for (const tag of outlet.tags) counts.set(tag, (counts.get(tag) || 0) + 1)
    return {
      locality: placeOf(locality),
      total: nearby.length,
      cuisines: catalog.cuisines.filter((c) => counts.has(c.id)).map((c) => ({ ...c, count: counts.get(c.id) })),
      topRated: [...nearby].sort(SORTS.rating).slice(0, 8),
      quick: [...nearby].sort(SORTS.eta).slice(0, 8),
      deals: nearby.filter((o) => o.offer).sort(SORTS.relevance).slice(0, 8),
      coupons: catalog.platformCoupons,
    }
  })

  open('GET', '/restaurants', ({ query }) => {
    const locality = localityOf(query.locality)
    return { locality: placeOf(locality), ...listOutlets(catalog, locality, query) }
  })

  open('GET', '/restaurants/:id', async ({ params, query, user }) => {
    const outlet = requireOutlet(params.id)
    const requested = catalog.locality(query.locality)
    // Looking at a restaurant from another city? Measure from its own neighbourhood.
    const locality = requested && requested.cityId === outlet.cityId ? requested : catalog.locality(outlet.localityId)
    const favourites = user ? await store.listFavourites(user.id) : []
    return {
      outlet: outletView(outlet, locality),
      locality: placeOf(locality),
      menu: catalog.menuOf(outlet.brandId).sections,
      coupons: catalog.couponsFor(outlet),
      favourite: favourites.includes(outlet.id),
    }
  })

  open('GET', '/search', ({ query }) => search(catalog, localityOf(query.locality), query.q))
  open('GET', '/suggest', ({ query }) => ({ items: suggest(catalog, localityOf(query.locality), query.q) }))

  open('GET', '/coupons', ({ query }) => {
    const outlet = query.outlet ? catalog.outlet(query.outlet) : null
    return { items: outlet ? catalog.couponsFor(outlet) : catalog.platformCoupons }
  })

  // ── Cart ───────────────────────────────────────────────────────────────────

  async function quoteFor({ body, user }) {
    const outlet = requireOutlet(body.outletId)
    let locality = catalog.locality(body.localityId)
    let address = null
    if (user && body.addressId) {
      address = (await store.listAddresses(user.id)).find((a) => a.id === body.addressId) || null
      if (address) locality = catalog.locality(address.localityId)
    }
    if (!locality || locality.cityId !== outlet.cityId) {
      // An address in another city can never be served; measure from a point that fails the radius check.
      locality = locality || catalog.locality(outlet.localityId)
    }
    const view = outletView(outlet, locality)
    if (locality.cityId !== outlet.cityId) {
      view.deliverable = false
      view.distanceKm = null
    }
    const pastOrders = user ? await store.countOrders(user.id) : 0
    const quote = buildQuote({ catalog, outlet: view, lines: body.lines, couponCode: body.couponCode, tip: body.tip, pastOrders })
    if (locality.cityId !== outlet.cityId) quote.blocker = quote.lines.length ? `${outlet.name} is in ${outlet.cityName} and cannot deliver to ${locality.cityName}.` : quote.blocker
    return { outlet: view, locality, address, quote }
  }

  open('POST', '/quote', async (ctx) => {
    const { outlet, locality, quote } = await quoteFor(ctx)
    return { outlet, locality: placeOf(locality), ...quote }
  })

  // ── Accounts ───────────────────────────────────────────────────────────────

  open('POST', '/auth/register', async ({ body, now }) => {
    const name = text(body.name, { field: 'Name', min: 2, max: 60 })
    const email = text(body.email, { field: 'Email', max: 120 }).toLowerCase()
    if (!EMAIL.test(email)) throw badRequest('Enter a valid email address.', { field: 'email' })
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 8) throw badRequest('Password must be at least 8 characters.', { field: 'password' })
    if (password.length > 72) throw badRequest('Password must be 72 characters or fewer.', { field: 'password' })
    const phone = phoneNumber(body.phone)

    if (await store.findUserByEmail(email)) {
      throw conflict('EMAIL_TAKEN', 'An account with this email already exists. Try signing in.')
    }
    const user = { id: env.id(), name, email, phone, passwordHash: await env.hashPassword(password), createdAt: now }
    await store.insertUser(user)
    return { token: await env.issueToken(user.id), user: publicUser(user) }
  })

  open('POST', '/auth/login', async ({ body }) => {
    const email = String(body.email || '').trim().toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const user = email ? await store.findUserByEmail(email) : null
    // Verify even when there is no user so both outcomes take about the same time.
    const ok = await env.verifyPassword(password, user ? user.passwordHash : null)
    if (!user || !ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    return { token: await env.issueToken(user.id), user: publicUser(user) }
  })

  secure('GET', '/me', ({ user }) => ({ user: publicUser(user) }))

  secure('PATCH', '/me', async ({ user, body }) => {
    const patch = {}
    if (body.name !== undefined) patch.name = text(body.name, { field: 'Name', min: 2, max: 60 })
    if (body.phone !== undefined) patch.phone = phoneNumber(body.phone)
    const updated = await store.updateUser(user.id, patch)
    return { user: publicUser(updated) }
  })

  secure('GET', '/me/addresses', async ({ user }) => ({ items: await store.listAddresses(user.id) }))

  secure('POST', '/me/addresses', async ({ user, body, now }) => {
    const existing = await store.listAddresses(user.id)
    if (existing.length >= 10) throw conflict('TOO_MANY_ADDRESSES', 'You can save up to 10 addresses. Remove one to add another.')
    const address = { id: env.id(), userId: user.id, ...addressInput(body), createdAt: now }
    await store.insertAddress(address)
    return { address }
  })

  secure('PUT', '/me/addresses/:id', async ({ user, params, body }) => {
    const address = await store.updateAddress(user.id, params.id, addressInput(body))
    if (!address) throw notFound('That address no longer exists.')
    return { address }
  })

  secure('DELETE', '/me/addresses/:id', async ({ user, params }) => {
    const removed = await store.deleteAddress(user.id, params.id)
    if (!removed) throw notFound('That address no longer exists.')
    return { ok: true }
  })

  secure('GET', '/me/favourites', async ({ user, query }) => {
    const ids = await store.listFavourites(user.id)
    const locality = localityOf(query.locality)
    const outlets = ids
      .map((id) => catalog.outlet(id))
      .filter(Boolean)
      .map((outlet) => outletView(outlet, outlet.cityId === locality.cityId ? locality : catalog.locality(outlet.localityId)))
    return { ids, outlets }
  })

  secure('PUT', '/me/favourites/:id', async ({ user, params, body }) => {
    const outlet = requireOutlet(params.id)
    await store.setFavourite(user.id, outlet.id, Boolean(body.on))
    return { ids: await store.listFavourites(user.id) }
  })

  // ── Orders ─────────────────────────────────────────────────────────────────

  secure('GET', '/orders', async ({ user, now }) => {
    const orders = await store.listOrders(user.id)
    return { items: orders.map((order) => orderView(order, now)) }
  })

  secure('POST', '/orders', async (ctx) => {
    const { body, user, now } = ctx
    if (!body.addressId) throw badRequest('Choose a delivery address.', { field: 'addressId' })
    const method = PAYMENT_METHODS[body.paymentMethod] ? body.paymentMethod : null
    if (!method) throw badRequest('Choose how you would like to pay.', { field: 'paymentMethod' })

    const { outlet, address, quote } = await quoteFor(ctx)
    if (!address) throw notFound('That delivery address no longer exists.')
    if (quote.removed.length) throw conflict('CART_CHANGED', 'Some items in your cart are no longer available. Please review your cart.')
    if (!quote.canCheckout) throw conflict('CANNOT_CHECKOUT', quote.blocker)
    if (quote.coupon.code && !quote.coupon.applied) throw conflict('COUPON_REJECTED', quote.coupon.message)
    if (body.expectedTotal !== undefined && Number(body.expectedTotal) !== quote.bill.total) {
      throw conflict('PRICE_CHANGED', `The total is now ₹${quote.bill.total}. Please review your bill before paying.`)
    }

    const id = env.id()
    const order = {
      id,
      number: `CHK-${hash(id).toString(36).toUpperCase().padStart(7, '0').slice(0, 7)}`,
      userId: user.id,
      outlet: {
        id: outlet.id, name: outlet.name, cover: outlet.cover, localityName: outlet.localityName,
        cityName: outlet.cityName, x: outlet.x, y: outlet.y,
      },
      address: {
        id: address.id, label: address.label, line1: address.line1, landmark: address.landmark,
        localityId: address.localityId, localityName: address.localityName, cityName: address.cityName,
      },
      lines: quote.lines,
      itemCount: quote.itemCount,
      bill: quote.bill,
      couponCode: quote.coupon.applied ? quote.coupon.code : null,
      payment: { method, label: PAYMENT_METHODS[method], status: method === 'cod' ? 'due' : 'paid' },
      instructions: text(body.instructions, { field: 'Instructions', max: 200, optional: true }),
      noContact: Boolean(body.noContact),
      distanceKm: outlet.distanceKm,
      etaMinutes: outlet.etaMinutes,
      placedAt: now,
      schedule: planOrder({ placedAt: now, etaMinutes: outlet.etaMinutes, prepMinutes: outlet.prepMinutes, secondsPerMinute }),
      rider: assignRider(id),
      cancelledAt: null,
      rating: null,
    }
    await store.insertOrder(order)
    return { order: orderView(order, now) }
  })

  async function requireOrder(user, id) {
    const order = await store.findOrder(user.id, id)
    if (!order) throw notFound('We could not find that order.')
    return order
  }

  secure('GET', '/orders/:id', async ({ user, params, now }) => ({ order: orderView(await requireOrder(user, params.id), now) }))

  secure('POST', '/orders/:id/cancel', async ({ user, params, now }) => {
    const order = await requireOrder(user, params.id)
    if (!trackOrder(order, now, secondsPerMinute).cancellable) {
      throw conflict('TOO_LATE_TO_CANCEL', 'The kitchen has already started on this order, so it can no longer be cancelled.')
    }
    const payment = order.payment.status === 'paid' ? { ...order.payment, status: 'refunded' } : { ...order.payment, status: 'void' }
    const updated = await store.updateOrder(user.id, order.id, { cancelledAt: now, payment })
    return { order: orderView(updated, now) }
  })

  secure('POST', '/orders/:id/rating', async ({ user, params, body, now }) => {
    const order = await requireOrder(user, params.id)
    if (trackOrder(order, now, secondsPerMinute).status !== 'delivered') {
      throw conflict('NOT_DELIVERED', 'You can rate an order once it has been delivered.')
    }
    const stars = Math.round(Number(body.stars))
    if (!(stars >= 1 && stars <= 5)) throw badRequest('Choose between 1 and 5 stars.', { field: 'stars' })
    const rating = { stars, comment: text(body.comment, { field: 'Comment', max: 300, optional: true }), at: now }
    const updated = await store.updateOrder(user.id, order.id, { rating })
    return { order: orderView(updated, now) }
  })

  // ── Dispatch ───────────────────────────────────────────────────────────────

  /** Run one request. Resolves with the response body or rejects with an ApiError. */
  async function handle({ method, path, query = {}, body = {}, token = null }) {
    const verb = String(method).toUpperCase()
    for (const route of routes) {
      if (route.method !== verb) continue
      const found = route.regex.exec(path)
      if (!found) continue
      const params = {}
      route.names.forEach((name, index) => { params[name] = decodeURIComponent(found[index + 1]) })

      let user = null
      if (token) {
        const userId = await env.readToken(token)
        if (userId) user = await store.findUserById(userId)
      }
      if (route.auth && !user) throw unauthorized()
      const safeBody = body && typeof body === 'object' && !Array.isArray(body) ? body : {}
      return route.handler({ params, query, body: safeBody, user, now: env.now() })
    }
    throw notFound('No such endpoint.')
  }

  return { handle, routes: routes.map(({ method, path, auth }) => ({ method, path, auth })), rules: RULES }
}

/** Create the demo account with two saved addresses, if it is not there yet. */
export async function seedDemoAccount({ store, env }) {
  const existing = await store.findUserByEmail(DEMO_ACCOUNT.email)
  if (existing) {
    if (existing.name === FORMER_DEMO_NAME) await store.updateUser(existing.id, { name: DEMO_ACCOUNT.name })
    return
  }
  const catalog = getCatalog()
  const now = env.now()
  const user = {
    id: env.id(),
    name: DEMO_ACCOUNT.name,
    email: DEMO_ACCOUNT.email,
    phone: DEMO_ACCOUNT.phone,
    passwordHash: await env.hashPassword(DEMO_ACCOUNT.password),
    createdAt: now,
  }
  await store.insertUser(user)
  const places = [
    ['Home', '14, 3rd Cross, 5th Block', 'Near Jyoti Nivas College', 'blr-koramangala'],
    ['Work', '4th floor, Indigo Tech Park', '100 Feet Road', 'blr-indiranagar'],
  ]
  for (const [label, line1, landmark, localityId] of places) {
    const locality = catalog.locality(localityId)
    await store.insertAddress({
      id: env.id(), userId: user.id, label, line1, landmark,
      localityId, localityName: locality.name, cityName: locality.cityName, createdAt: now,
    })
  }
}
