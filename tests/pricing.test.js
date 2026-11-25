import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCatalog } from '../shared/catalog/index.js'
import { outletView } from '../shared/core/listing.js'
import { buildQuote, deliveryFeeFor, lineKey, RULES } from '../shared/core/pricing.js'
import { planOrder, trackOrder } from '../shared/core/tracking.js'

const catalog = getCatalog()
const outlet = outletView(catalog.outlet('deg-and-dum-blr'), catalog.locality('blr-koramangala'))
const menu = catalog.menuOf('deg-and-dum').dishes
const biryani = [...menu.values()].find((dish) => dish.name === 'Hyderabadi Chicken Dum Biryani')
const naan = [...menu.values()].find((dish) => dish.name === 'Garlic Naan')

const quote = (lines, extra = {}) => buildQuote({ catalog, outlet, lines, ...extra })

test('delivery fee grows with distance and is capped', () => {
  assert.equal(deliveryFeeFor(0.5), 25)
  assert.equal(deliveryFeeFor(2), 25)
  assert.equal(deliveryFeeFor(2.1), 32)
  assert.equal(deliveryFeeFor(6), 53)
  assert.equal(deliveryFeeFor(40), RULES.delivery.max)
})

test('a plain line is priced at the menu price', () => {
  const q = quote([{ dishId: naan.id, quantity: 3 }])
  assert.equal(q.lines.length, 1)
  assert.equal(q.lines[0].unitPrice, naan.price)
  assert.equal(q.bill.itemTotal, naan.price * 3)
  assert.equal(q.itemCount, 3)
})

test('variants and add-ons are added to the unit price', () => {
  const large = biryani.custom.variant.options[1]
  const [raita, salan] = biryani.custom.addons[0].options
  const q = quote([{ dishId: biryani.id, variantId: large.id, addonIds: [salan.id, raita.id], quantity: 2 }])
  const line = q.lines[0]
  assert.equal(line.unitPrice, biryani.price + large.price + raita.price + salan.price)
  assert.equal(line.total, line.unitPrice * 2)
  assert.equal(line.variant.name, large.name)
  assert.deepEqual(line.addons.map((a) => a.id), [raita.id, salan.id])
  assert.equal(line.key, lineKey(biryani.id, large.id, [raita.id, salan.id]))
})

test('a missing variant falls back to the first option', () => {
  const q = quote([{ dishId: biryani.id, quantity: 1 }])
  assert.equal(q.lines[0].variant.id, biryani.custom.variant.options[0].id)
  assert.equal(q.lines[0].unitPrice, biryani.price)
})

test('identical lines are merged and quantity is capped', () => {
  const q = quote([
    { dishId: naan.id, quantity: 15 },
    { dishId: naan.id, quantity: 15 },
  ])
  assert.equal(q.lines.length, 1)
  assert.equal(q.lines[0].quantity, RULES.maxQuantity)
})

test('unknown dishes and add-ons are reported, not charged', () => {
  const q = quote([
    { dishId: 'nope', quantity: 1 },
    { dishId: naan.id, addonIds: ['made-up'], quantity: 1 },
  ])
  assert.equal(q.lines.length, 0)
  assert.equal(q.removed.length, 2)
  assert.equal(q.bill.total, 0)
  assert.equal(q.canCheckout, false)
})

test('too many add-ons from one group are refused', () => {
  const group = biryani.custom.addons[0]
  const limited = { ...group, max: 1 }
  const dishes = new Map([[biryani.id, { ...biryani, custom: { ...biryani.custom, addons: [limited] } }]])
  const fake = { ...catalog, menuOf: () => ({ dishes }) }
  const q = buildQuote({ catalog: fake, outlet, lines: [{ dishId: biryani.id, addonIds: group.options.slice(0, 2).map((o) => o.id), quantity: 1 }] })
  assert.equal(q.lines.length, 0)
  assert.match(q.removed[0].reason, /up to 1/)
})

test('the bill adds up and is rounded to a whole rupee', () => {
  const q = quote([{ dishId: biryani.id, quantity: 1 }], { tip: 20 })
  const b = q.bill
  const exact = b.itemTotal - b.discount + b.deliveryFee + b.packaging + b.platformFee + b.taxes + b.tip
  assert.equal(b.total, Math.round(exact))
  assert.ok(Math.abs(b.roundOff) <= 0.5)
  assert.equal(b.taxes, Math.round((b.itemTotal + b.packaging) * RULES.gstRate * 100) / 100)
  assert.equal(b.tip, 20)
  assert.equal(b.deliveryFee, outlet.deliveryFee)
})

test('delivery is free above the threshold', () => {
  const q = quote([{ dishId: biryani.id, quantity: 2 }])
  assert.ok(q.bill.itemTotal >= RULES.delivery.freeAbove)
  assert.equal(q.bill.deliveryFee, 0)
  assert.equal(q.bill.deliveryWaived, outlet.deliveryFee)
})

test('percentage coupons respect their cap and minimum', () => {
  const small = quote([{ dishId: naan.id, quantity: 1 }], { couponCode: 'tasty20' })
  assert.equal(small.coupon.applied, false)
  assert.match(small.coupon.message, /more to use TASTY20/)
  assert.equal(small.bill.discount, 0)

  const big = quote([{ dishId: biryani.id, quantity: 4 }], { couponCode: 'TASTY20' })
  assert.equal(big.coupon.applied, true)
  assert.equal(big.bill.discount, 120)
})

test('flat, delivery and restaurant coupons', () => {
  const flat = quote([{ dishId: biryani.id, quantity: 2 }], { couponCode: 'FEAST100' })
  assert.equal(flat.bill.discount, 100)

  const delivery = quote([{ dishId: biryani.id, quantity: 1 }], { couponCode: 'FREEDEL' })
  assert.equal(delivery.coupon.applied, true)
  assert.equal(delivery.bill.deliveryFee, 0)
  assert.equal(delivery.bill.discount, 0)

  const own = quote([{ dishId: biryani.id, quantity: 2 }], { couponCode: 'DEGDUM20' })
  assert.equal(own.bill.discount, 100)

  const foreign = quote([{ dishId: biryani.id, quantity: 2 }], { couponCode: 'SLICE50' })
  assert.equal(foreign.coupon.applied, false)
  assert.match(foreign.coupon.message, /cannot be used at this restaurant/)

  const unknown = quote([{ dishId: biryani.id, quantity: 2 }], { couponCode: 'FREEFOOD' })
  assert.equal(unknown.coupon.applied, false)
})

test('the welcome coupon is only for a first order', () => {
  const lines = [{ dishId: biryani.id, quantity: 1 }]
  assert.equal(quote(lines, { couponCode: 'WELCOME50', pastOrders: 0 }).bill.discount, 100)
  const second = quote(lines, { couponCode: 'WELCOME50', pastOrders: 1 })
  assert.equal(second.coupon.applied, false)
  assert.equal(second.bill.discount, 0)
})

test('sold-out items block checkout and are not charged', () => {
  const dishes = new Map(menu)
  dishes.set(naan.id, { ...naan, inStock: false })
  const fake = { ...catalog, menuOf: () => ({ dishes }) }
  const q = buildQuote({ catalog: fake, outlet, lines: [{ dishId: biryani.id, quantity: 1 }, { dishId: naan.id, quantity: 2 }] })
  assert.equal(q.bill.itemTotal, biryani.price)
  assert.equal(q.canCheckout, false)
  assert.match(q.blocker, /sold-out/)
})

test('tips are clamped', () => {
  assert.equal(quote([{ dishId: naan.id, quantity: 1 }], { tip: 99999 }).bill.tip, RULES.maxTip)
  assert.equal(quote([{ dishId: naan.id, quantity: 1 }], { tip: -50 }).bill.tip, 0)
})

test('an order moves through its stages on the clock', () => {
  const placedAt = 1_000_000
  const secondsPerMinute = 4
  const schedule = planOrder({ placedAt, etaMinutes: 30, prepMinutes: 18, secondsPerMinute })
  const order = { placedAt, schedule, outlet: { name: 'Deg & Dum' }, rider: { name: 'Ramesh K.' }, cancelledAt: null }
  const at = (ms) => trackOrder(order, ms, secondsPerMinute)

  assert.equal(at(placedAt).status, 'placed')
  assert.equal(at(placedAt).etaMinutes, 30)
  assert.equal(at(placedAt).cancellable, true)
  assert.equal(at(schedule.confirmedAt).status, 'confirmed')
  assert.equal(at(schedule.preparingAt).status, 'preparing')
  assert.equal(at(schedule.preparingAt).cancellable, false)
  assert.equal(at(schedule.pickedUpAt).status, 'picked_up')
  assert.equal(at(schedule.pickedUpAt).riderProgress, 0)
  assert.equal(at(schedule.arrivingAt).status, 'arriving')
  assert.ok(at(schedule.arrivingAt).riderProgress > 0.5)

  const done = at(schedule.deliveredAt + 5000)
  assert.equal(done.status, 'delivered')
  assert.equal(done.etaMinutes, 0)
  assert.equal(done.active, false)
  assert.ok(done.steps.every((step) => step.done))

  // The whole delivery lasts eta * secondsPerMinute seconds.
  assert.equal(schedule.deliveredAt - placedAt, 30 * 4 * 1000)
})

test('a cancelled order stops where it was', () => {
  const placedAt = 5_000_000
  const schedule = planOrder({ placedAt, etaMinutes: 25, prepMinutes: 12, secondsPerMinute: 4 })
  const order = { placedAt, schedule, outlet: { name: 'X' }, rider: { name: 'Y' }, cancelledAt: schedule.confirmedAt + 10 }
  const later = trackOrder(order, schedule.deliveredAt + 60_000, 4)
  assert.equal(later.status, 'cancelled')
  assert.equal(later.active, false)
  assert.equal(later.cancellable, false)
  assert.deepEqual(later.steps.filter((s) => s.done).map((s) => s.key), ['placed', 'confirmed'])
})
