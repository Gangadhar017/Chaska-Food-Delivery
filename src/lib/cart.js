// The cart: a small store outside React, saved to localStorage.
// A cart belongs to one restaurant. Prices kept here are for instant feedback only;
// the bill always comes from the API's quote.

import { useSyncExternalStore } from 'react'
import { lineKey } from '../../shared/core/pricing.js'

const KEY = 'chaska.cart.v1'
const MAX_QUANTITY = 20
const EMPTY = { outlet: null, lines: [], couponCode: '', tip: 0, instructions: '', noContact: false }

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    if (saved && Array.isArray(saved.lines)) return { ...EMPTY, ...saved }
  } catch {
    // fall through to an empty cart
  }
  return EMPTY
}

let state = load()
const listeners = new Set()

function set(next) {
  state = next.lines.length ? next : EMPTY
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // The cart still works for this visit.
  }
  listeners.forEach((listener) => listener())
}

function buildLine(dish, { variantId, addonIds = [], quantity = 1 } = {}) {
  const variant = dish.custom?.variant ? dish.custom.variant.options.find((o) => o.id === variantId) || dish.custom.variant.options[0] : null
  const addons = (dish.custom?.addons || []).flatMap((group) => group.options.filter((o) => addonIds.includes(o.id)))
  return {
    key: lineKey(dish.id, variant?.id, addons.map((a) => a.id)),
    dishId: dish.id,
    name: dish.name,
    diet: dish.diet,
    variant: variant ? { id: variant.id, name: variant.name } : null,
    addons: addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    unitPrice: dish.price + (variant?.price || 0) + addons.reduce((sum, a) => sum + a.price, 0),
    quantity,
    addedAt: Date.now(),
  }
}

const outletSnapshot = (outlet) => ({
  id: outlet.id, name: outlet.name, localityName: outlet.localityName, cityId: outlet.cityId, cityName: outlet.cityName, cover: outlet.cover,
})

function withLine(base, line) {
  const existing = base.lines.find((entry) => entry.key === line.key)
  const lines = existing
    ? base.lines.map((entry) => (entry.key === line.key ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + line.quantity), addedAt: line.addedAt } : entry))
    : [...base.lines, line]
  return { ...base, lines }
}

export const cart = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  get: () => state,

  /** Add a dish. Returns `{ conflict: true }` when the cart holds another restaurant's food. */
  add(outlet, dish, selection) {
    if (state.outlet && state.outlet.id !== outlet.id && state.lines.length) return { conflict: true }
    set(withLine({ ...state, outlet: outletSnapshot(outlet) }, buildLine(dish, selection)))
    return { conflict: false }
  },

  /** Empty the cart and start again with this dish from a different restaurant. */
  startOver(outlet, dish, selection) {
    set(withLine({ ...EMPTY, outlet: outletSnapshot(outlet) }, buildLine(dish, selection)))
  },

  setQuantity(key, quantity) {
    const lines = state.lines
      .map((line) => (line.key === key ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) } : line))
      .filter((line) => line.quantity > 0)
    set({ ...state, lines })
  },
  increment(key) {
    const line = state.lines.find((entry) => entry.key === key)
    if (line) cart.setQuantity(key, line.quantity + 1)
  },
  decrement(key) {
    const line = state.lines.find((entry) => entry.key === key)
    if (line) cart.setQuantity(key, line.quantity - 1)
  },
  /** Take one off the most recently added line of a dish (used by the menu stepper). */
  decrementDish(dishId) {
    const line = state.lines.filter((entry) => entry.dishId === dishId).sort((a, b) => b.addedAt - a.addedAt)[0]
    if (line) cart.setQuantity(line.key, line.quantity - 1)
  },
  remove(keys) {
    const drop = new Set([].concat(keys))
    set({ ...state, lines: state.lines.filter((line) => !drop.has(line.key)) })
  },

  setCoupon: (couponCode) => set({ ...state, couponCode: couponCode || '' }),
  setTip: (tip) => set({ ...state, tip: Math.max(0, Math.round(Number(tip) || 0)) }),
  setInstructions: (instructions) => set({ ...state, instructions: instructions.slice(0, 200) }),
  setNoContact: (noContact) => set({ ...state, noContact }),
  clear: () => set(EMPTY),

  /** Fill the cart with the items from a past order. */
  reorder(order) {
    set({
      ...EMPTY,
      outlet: { id: order.outlet.id, name: order.outlet.name, localityName: order.outlet.localityName, cityName: order.outlet.cityName, cover: order.outlet.cover },
      lines: order.lines.map((line) => ({
        key: line.key, dishId: line.dishId, name: line.name, diet: line.diet, variant: line.variant, addons: line.addons,
        unitPrice: line.unitPrice, quantity: line.quantity, addedAt: Date.now(),
      })),
    })
  },
}

export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get)
}

export const cartCount = (state) => state.lines.reduce((sum, line) => sum + line.quantity, 0)
export const cartSubtotal = (state) => state.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
export const dishQuantity = (state, outletId, dishId) =>
  state.outlet?.id === outletId ? state.lines.reduce((sum, line) => (line.dishId === dishId ? sum + line.quantity : sum), 0) : 0

/** The shape the API expects for cart lines. */
export const cartPayload = (state) =>
  state.lines.map((line) => ({ dishId: line.dishId, variantId: line.variant?.id, addonIds: line.addons.map((a) => a.id), quantity: line.quantity }))
