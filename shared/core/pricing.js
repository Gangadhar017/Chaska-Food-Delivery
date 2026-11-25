// Pricing rules: what a cart line costs, what a coupon takes off, and the final bill.
// The API calls this for every quote and again when the order is placed, so the browser
// never decides a price on its own.

import { clamp, money } from './util.js'

export const RULES = {
  platformFee: 6,
  gstRate: 0.05,
  delivery: { base: 25, includedKm: 2, perKm: 7, max: 79, freeAbove: 499 },
  maxQuantity: 20,
  maxLines: 40,
  maxTip: 500,
  radiusKm: 10,
}

export function deliveryFeeFor(distanceKm) {
  const { base, includedKm, perKm, max } = RULES.delivery
  const extraKm = Math.max(0, Math.ceil(distanceKm - includedKm))
  return Math.min(max, base + extraKm * perKm)
}

/** A stable identity for a cart line: the dish plus the exact customisation. */
export function lineKey(dishId, variantId, addonIds) {
  return [dishId, variantId || '', [...(addonIds || [])].sort().join('+')].join('|')
}

/**
 * Resolve one requested line against the menu.
 * Returns the priced line, or `{ problem }` when the dish or its options are no longer valid.
 */
export function priceLine(dishes, request) {
  const dish = dishes.get(request.dishId)
  if (!dish) return { problem: 'This item is no longer on the menu.' }

  const quantity = clamp(Math.floor(Number(request.quantity) || 0), 1, RULES.maxQuantity)
  let unit = dish.price
  let variant = null
  const addons = []

  if (dish.custom?.variant) {
    const options = dish.custom.variant.options
    variant = options.find((option) => option.id === request.variantId) || options[0]
    unit += variant.price
  }

  const wanted = new Set(Array.isArray(request.addonIds) ? request.addonIds : [])
  for (const group of dish.custom?.addons || []) {
    const chosen = group.options.filter((option) => wanted.has(option.id))
    if (chosen.length > group.max) {
      return { problem: `Pick up to ${group.max} from "${group.title}".` }
    }
    for (const option of chosen) {
      addons.push({ id: option.id, name: option.name, price: option.price })
      unit += option.price
      wanted.delete(option.id)
    }
  }
  if (wanted.size) return { problem: 'One of the add-ons is no longer available.' }

  return {
    line: {
      key: lineKey(dish.id, variant?.id, addons.map((addon) => addon.id)),
      dishId: dish.id,
      name: dish.name,
      diet: dish.diet,
      photo: dish.photo,
      variant: variant ? { id: variant.id, name: variant.name } : null,
      addons,
      unitPrice: unit,
      quantity,
      total: unit * quantity,
      available: dish.inStock,
    },
  }
}

/** Work out what a coupon is worth on this cart, or why it cannot be used. */
export function evaluateCoupon(coupon, { code, itemTotal, outlet, pastOrders }) {
  if (!code) return { code: null, applied: false, discount: 0, freeDelivery: false, message: null }
  const reject = (message) => ({ code, applied: false, discount: 0, freeDelivery: false, message })

  if (!coupon) return reject('That code is not valid.')
  if (coupon.brandId && coupon.brandId !== outlet.brandId) {
    return reject(`${coupon.code} cannot be used at this restaurant.`)
  }
  if (coupon.firstOrderOnly && pastOrders > 0) {
    return reject(`${coupon.code} is only for your first order.`)
  }
  if (itemTotal < coupon.min) {
    return reject(`Add items worth ₹${coupon.min - itemTotal} more to use ${coupon.code}.`)
  }

  let discount = 0
  if (coupon.type === 'percent') {
    discount = Math.round((itemTotal * coupon.value) / 100)
    if (coupon.cap) discount = Math.min(discount, coupon.cap)
  } else if (coupon.type === 'flat') {
    discount = Math.min(coupon.value, itemTotal)
  }
  return {
    code: coupon.code,
    applied: true,
    discount,
    freeDelivery: coupon.type === 'delivery',
    title: coupon.title,
    message: coupon.type === 'delivery' ? 'Delivery fee waived.' : `You save ₹${discount} with ${coupon.code}.`,
  }
}

/**
 * Build the full quote for a cart.
 * `outlet` is an outlet view (it already carries distance and ETA for the delivery point).
 */
export function buildQuote({ catalog, outlet, lines: requested, couponCode, tip, pastOrders = 0 }) {
  const { dishes } = catalog.menuOf(outlet.brandId)
  const lines = []
  const removed = []

  const requests = Array.isArray(requested) ? requested.slice(0, RULES.maxLines) : []
  const merged = new Map()
  for (const request of requests) {
    const { line, problem } = priceLine(dishes, request || {})
    if (problem) {
      removed.push({ dishId: request?.dishId || null, reason: problem })
      continue
    }
    const existing = merged.get(line.key)
    if (existing) {
      existing.quantity = Math.min(RULES.maxQuantity, existing.quantity + line.quantity)
      existing.total = existing.unitPrice * existing.quantity
    } else {
      merged.set(line.key, line)
      lines.push(line)
    }
  }

  const payable = lines.filter((line) => line.available)
  const itemTotal = payable.reduce((sum, line) => sum + line.total, 0)
  const itemCount = payable.reduce((sum, line) => sum + line.quantity, 0)

  const code = String(couponCode || '').trim().toUpperCase() || null
  const coupon = evaluateCoupon(catalog.coupon(code), { code, itemTotal, outlet, pastOrders })

  const baseDelivery = deliveryFeeFor(outlet.distanceKm)
  const freeDelivery = itemTotal >= RULES.delivery.freeAbove || coupon.freeDelivery
  const deliveryFee = itemTotal === 0 || freeDelivery ? 0 : baseDelivery
  const packaging = itemTotal === 0 ? 0 : outlet.packagingCharge
  const platformFee = itemTotal === 0 ? 0 : RULES.platformFee
  const taxes = money((itemTotal - coupon.discount + packaging) * RULES.gstRate)
  const tipAmount = itemTotal === 0 ? 0 : clamp(Math.round(Number(tip) || 0), 0, RULES.maxTip)

  const exact = money(itemTotal - coupon.discount + deliveryFee + packaging + platformFee + taxes + tipAmount)
  const total = Math.round(exact)

  let blocker = null
  if (lines.length === 0) blocker = 'Your cart is empty.'
  else if (payable.length === 0) blocker = 'Everything in your cart is sold out right now.'
  else if (lines.length !== payable.length) blocker = 'Remove the sold-out items to continue.'
  else if (!outlet.deliverable) blocker = `${outlet.name} does not deliver to this address. It is ${outlet.distanceKm} km away.`

  return {
    lines,
    removed,
    itemCount,
    coupon: { code: coupon.code, applied: coupon.applied, title: coupon.title || null, message: coupon.message },
    bill: {
      itemTotal,
      discount: coupon.discount,
      deliveryFee,
      deliveryWaived: itemTotal > 0 && freeDelivery ? baseDelivery : 0,
      packaging,
      platformFee,
      taxes,
      tip: tipAmount,
      roundOff: money(total - exact),
      total,
      savings: coupon.discount + (itemTotal > 0 && freeDelivery ? baseDelivery : 0),
      freeDeliveryAbove: RULES.delivery.freeAbove,
    },
    canCheckout: blocker === null,
    blocker,
  }
}
