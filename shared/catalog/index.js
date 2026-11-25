// Assembles the catalog: places every brand's outlet in each city and builds its menu.
// Everything here is deterministic. The same code produces the same restaurants, ratings
// and prices in the browser, on the server and in the tests.

import { BRANDS, COUPONS } from './brands.js'
import { CITIES, CUISINES, DEFAULT_LOCALITY_ID } from './places.js'
import { CUSTOM_SETS, SECTIONS } from './menu.js'
import { hash, menuPrice, seededRandom, slugify } from '../core/util.js'

const OUT_OF_STOCK_ONE_IN = 16

function buildCustom(setKey, pureVeg) {
  const set = setKey && CUSTOM_SETS[setKey]
  if (!set) return null
  const allowed = (option) => !pureVeg || !option[2] || option[2] === 'veg'
  const custom = {}
  if (set.variant) {
    const [title, options] = set.variant
    custom.variant = {
      title,
      options: options.map(([name, price], index) => ({ id: `v${index}`, name, price })),
    }
  }
  if (set.addons) {
    custom.addons = set.addons
      .map(([title, max, options], groupIndex) => ({
        id: `g${groupIndex}`,
        title,
        max,
        options: options
          .map((option, index) => ({ id: `g${groupIndex}a${index}`, name: option[0], price: option[1], diet: option[2] || 'veg', keep: allowed(option) }))
          .filter((option) => option.keep)
          .map((option) => ({ id: option.id, name: option.name, price: option.price, diet: option.diet })),
      }))
      .filter((group) => group.options.length > 0)
  }
  return custom
}

function buildMenu(brand) {
  const random = seededRandom(`menu:${brand.id}`)
  const sections = []
  for (const key of brand.sections) {
    const [title, rows] = SECTIONS[key]
    const items = []
    rows.forEach((row, index) => {
      const [name, basePrice, diet, description, photo, customKey, flags = ''] = row
      const roll = random()
      const stockRoll = random()
      const ratingRoll = random()
      const countRoll = random()
      if (brand.veg && diet !== 'veg') return
      const bestseller = flags.includes('B')
      // A restaurant does not carry the whole library: drop about one dish in five.
      if (!bestseller && roll < 0.2) return
      items.push({
        id: `${brand.id}.${key}.${index}`,
        name,
        description,
        diet,
        price: brand.price === 1 ? basePrice : menuPrice(basePrice * brand.price),
        photo: photo || null,
        bestseller,
        spicy: flags.includes('S'),
        rating: Math.round((3.8 + ratingRoll * 1.0) * 10) / 10,
        ratingCount: Math.round(18 + countRoll * countRoll * 1900),
        inStock: bestseller || Math.floor(stockRoll * OUT_OF_STOCK_ONE_IN) !== 0,
        custom: buildCustom(customKey, brand.veg),
      })
    })
    if (items.length) sections.push({ id: slugify(title), title, items })
  }
  return sections
}

function brandCoupon(brand) {
  if (!brand.offer) return null
  const [code, type, value, cap, min] = brand.offer
  const title = type === 'percent' ? `${value}% off${cap ? ` up to ₹${cap}` : ''}` : `Flat ₹${value} off`
  return {
    code,
    type,
    value,
    cap,
    min,
    brandId: brand.id,
    title,
    detail: `Only at ${brand.name}, on orders above ₹${min}.`,
  }
}

function buildOutlet(brand, city) {
  const random = seededRandom(`outlet:${brand.id}:${city.id}`)
  const locality = city.localities[Math.floor(random() * city.localities.length)]
  const coupon = brandCoupon(brand)
  return {
    id: `${brand.id}-${city.id}`,
    brandId: brand.id,
    cityId: city.id,
    cityName: city.name,
    name: brand.name,
    tagline: brand.tagline,
    cuisines: brand.cuisines,
    tags: brand.tags,
    cover: brand.cover,
    veg: Boolean(brand.veg),
    localityId: locality.id,
    localityName: locality.name,
    // A few hundred metres off the locality centre, so outlets do not stack on one point.
    x: Math.round((locality.x + (random() - 0.5) * 1.6) * 100) / 100,
    y: Math.round((locality.y + (random() - 0.5) * 1.6) * 100) / 100,
    rating: Math.round(Math.min(4.8, Math.max(3.4, brand.rating + (random() - 0.5) * 0.5)) * 10) / 10,
    ratingCount: Math.round(120 + random() * random() * 14000),
    costForTwo: brand.costForTwo,
    prepMinutes: brand.prep,
    packagingCharge: brand.costForTwo >= 700 ? 25 : brand.costForTwo >= 400 ? 18 : 12,
    offer: coupon ? { code: coupon.code, label: coupon.title } : null,
  }
}

function createCatalog() {
  const localities = new Map()
  const cities = CITIES.map((city) => {
    for (const locality of city.localities) localities.set(locality.id, locality)
    return city
  })

  const brands = new Map(BRANDS.map((brand) => [brand.id, brand]))
  const outlets = new Map()
  const outletsByCity = new Map(cities.map((city) => [city.id, []]))
  for (const brand of BRANDS) {
    for (const city of cities) {
      if (brand.cities && !brand.cities.includes(city.id)) continue
      // Every brand is not in every city. Skip a few so the cities do not look identical.
      if (!brand.cities && hash(`presence:${brand.id}:${city.id}`) % 9 === 0) continue
      const outlet = buildOutlet(brand, city)
      outlets.set(outlet.id, outlet)
      outletsByCity.get(city.id).push(outlet)
    }
  }

  const coupons = new Map(COUPONS.map((coupon) => [coupon.code, coupon]))
  for (const brand of BRANDS) {
    const coupon = brandCoupon(brand)
    if (coupon) coupons.set(coupon.code, coupon)
  }

  const menus = new Map()
  function menuOf(brandId) {
    if (!menus.has(brandId)) {
      const sections = buildMenu(brands.get(brandId))
      const dishes = new Map()
      for (const section of sections) for (const dish of section.items) dishes.set(dish.id, dish)
      menus.set(brandId, { sections, dishes })
    }
    return menus.get(brandId)
  }

  return {
    cities,
    cuisines: CUISINES,
    defaultLocalityId: DEFAULT_LOCALITY_ID,
    locality: (id) => localities.get(id) || null,
    outlet: (id) => outlets.get(id) || null,
    outletsIn: (cityId) => outletsByCity.get(cityId) || [],
    menuOf,
    coupon: (code) => coupons.get(String(code || '').trim().toUpperCase()) || null,
    platformCoupons: COUPONS,
    couponsFor(outlet) {
      const own = outlet.offer ? [coupons.get(outlet.offer.code)] : []
      return [...own, ...COUPONS]
    },
  }
}

let cached = null

/** The catalog is static, so it is built once and shared. */
export function getCatalog() {
  if (!cached) cached = createCatalog()
  return cached
}
