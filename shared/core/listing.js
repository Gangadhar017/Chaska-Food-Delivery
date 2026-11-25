// Restaurant listing, filtering and search over the catalog.

import { RULES, deliveryFeeFor } from './pricing.js'
import { roadDistanceKm } from './util.js'

/** An outlet as seen from one delivery point: adds distance, ETA and the delivery fee. */
export function outletView(outlet, locality) {
  const distanceKm = roadDistanceKm(outlet, locality)
  const rideMinutes = Math.round(4 + distanceKm * 3.2)
  return {
    id: outlet.id,
    brandId: outlet.brandId,
    name: outlet.name,
    tagline: outlet.tagline,
    cuisines: outlet.cuisines,
    tags: outlet.tags,
    cover: outlet.cover,
    veg: outlet.veg,
    localityName: outlet.localityName,
    cityId: outlet.cityId,
    cityName: outlet.cityName,
    x: outlet.x,
    y: outlet.y,
    rating: outlet.rating,
    ratingCount: outlet.ratingCount,
    costForTwo: outlet.costForTwo,
    prepMinutes: outlet.prepMinutes,
    packagingCharge: outlet.packagingCharge,
    offer: outlet.offer,
    distanceKm,
    etaMinutes: outlet.prepMinutes + rideMinutes,
    deliveryFee: deliveryFeeFor(distanceKm),
    deliverable: distanceKm <= RULES.radiusKm,
  }
}

/** Every outlet that can deliver to this locality. */
export function nearbyOutlets(catalog, locality) {
  return catalog
    .outletsIn(locality.cityId)
    .map((outlet) => outletView(outlet, locality))
    .filter((outlet) => outlet.deliverable)
}

const relevance = (o) => o.rating * 20 - o.etaMinutes * 0.6 + Math.log10(o.ratingCount) * 3 + (o.offer ? 4 : 0)

export const SORTS = {
  relevance: (a, b) => relevance(b) - relevance(a),
  rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
  eta: (a, b) => a.etaMinutes - b.etaMinutes || b.rating - a.rating,
  costLow: (a, b) => a.costForTwo - b.costForTwo || b.rating - a.rating,
  costHigh: (a, b) => b.costForTwo - a.costForTwo || b.rating - a.rating,
}

const COST_BANDS = {
  low: (o) => o.costForTwo <= 300,
  mid: (o) => o.costForTwo > 300 && o.costForTwo <= 600,
  high: (o) => o.costForTwo > 600,
}

const truthy = (value) => value === true || value === '1' || value === 'true'

/** Apply the list filters from a query string and return one page of results. */
export function listOutlets(catalog, locality, query = {}) {
  let items = nearbyOutlets(catalog, locality)

  if (query.cuisine) items = items.filter((o) => o.tags.includes(query.cuisine))
  if (truthy(query.veg)) items = items.filter((o) => o.veg)
  if (truthy(query.offers)) items = items.filter((o) => o.offer)
  if (truthy(query.fast)) items = items.filter((o) => o.etaMinutes <= 30)
  const minRating = Number(query.rating)
  if (minRating > 0) items = items.filter((o) => o.rating >= minRating)
  if (COST_BANDS[query.cost]) items = items.filter(COST_BANDS[query.cost])

  items.sort(SORTS[query.sort] || SORTS.relevance)

  const pageSize = Math.min(48, Math.max(1, Number(query.limit) || 12))
  const page = Math.max(1, Number(query.page) || 1)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    hasMore: start + pageSize < items.length,
  }
}

function tokens(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
}

/** Score how well `text` answers the query. 0 means it does not match every word. */
function matchScore(text, words) {
  const haystack = ` ${text.toLowerCase()}`
  let score = 0
  for (const word of words) {
    const at = haystack.indexOf(word)
    if (at === -1) return 0
    score += haystack[at - 1] === ' ' ? 2 : 1
  }
  if (haystack.startsWith(` ${words[0]}`)) score += 2
  return score
}

/** Search restaurants and dishes around a locality. */
export function search(catalog, locality, text) {
  const words = tokens(text)
  if (!words.length) return { query: '', outlets: [], dishes: [] }

  const outlets = []
  const dishes = []
  for (const outlet of nearbyOutlets(catalog, locality)) {
    const outletScore = Math.max(matchScore(outlet.name, words) * 2, matchScore(outlet.cuisines.join(' '), words))
    if (outletScore) outlets.push({ outlet, score: outletScore + outlet.rating / 10 })

    for (const dish of catalog.menuOf(outlet.brandId).dishes.values()) {
      const dishScore = matchScore(dish.name, words) * 2 || matchScore(dish.description, words)
      if (dishScore) {
        dishes.push({ outlet, dish, score: dishScore + (dish.bestseller ? 1 : 0) + dish.rating / 10 - outlet.etaMinutes / 200 })
      }
    }
  }

  outlets.sort((a, b) => b.score - a.score)
  dishes.sort((a, b) => b.score - a.score)
  return {
    query: words.join(' '),
    outlets: outlets.slice(0, 12).map((hit) => hit.outlet),
    dishes: dishes.slice(0, 36).map((hit) => ({ outlet: hit.outlet, dish: hit.dish })),
  }
}

/** Short type-ahead suggestions: cuisines first, then restaurants, then dish names. */
export function suggest(catalog, locality, text) {
  const words = tokens(text)
  if (!words.length) return []
  const seen = new Set()
  const out = []
  const push = (type, label, extra) => {
    const key = `${type}:${label.toLowerCase()}`
    if (seen.has(key) || out.length >= 8) return
    seen.add(key)
    out.push({ type, label, ...extra })
  }

  for (const cuisine of catalog.cuisines) {
    if (matchScore(cuisine.name, words)) push('cuisine', cuisine.name, { id: cuisine.id })
  }
  const nearby = nearbyOutlets(catalog, locality)
  for (const outlet of nearby) {
    if (matchScore(outlet.name, words)) push('restaurant', outlet.name, { id: outlet.id, photo: outlet.cover })
  }
  const dishNames = new Map()
  for (const outlet of nearby) {
    for (const dish of catalog.menuOf(outlet.brandId).dishes.values()) {
      const score = matchScore(dish.name, words)
      if (score) dishNames.set(dish.name, Math.max(score, dishNames.get(dish.name) || 0))
    }
  }
  for (const [name] of [...dishNames].sort((a, b) => b[1] - a[1])) push('dish', name)
  return out
}
