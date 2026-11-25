import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRANDS } from '../shared/catalog/brands.js'
import { PHOTOS, photoUrl } from '../shared/catalog/images.js'
import { getCatalog } from '../shared/catalog/index.js'
import { CUSTOM_SETS, SECTIONS } from '../shared/catalog/menu.js'
import { CUISINES } from '../shared/catalog/places.js'
import { listOutlets, nearbyOutlets, search, suggest } from '../shared/core/listing.js'

const catalog = getCatalog()
const koramangala = catalog.locality('blr-koramangala')

test('every brand points at sections, photos and cuisine tags that exist', () => {
  const cuisineIds = new Set(CUISINES.map((c) => c.id))
  for (const brand of BRANDS) {
    assert.ok(PHOTOS[brand.cover], `${brand.id}: unknown cover photo ${brand.cover}`)
    for (const section of brand.sections) assert.ok(SECTIONS[section], `${brand.id}: unknown section ${section}`)
    for (const tag of brand.tags) assert.ok(cuisineIds.has(tag), `${brand.id}: unknown tag ${tag}`)
  }
  for (const cuisine of CUISINES) assert.ok(PHOTOS[cuisine.photo], `cuisine ${cuisine.id}: unknown photo`)
})

test('every dish in the library is well formed', () => {
  for (const [key, [title, rows]] of Object.entries(SECTIONS)) {
    assert.ok(title && rows.length, `${key} is empty`)
    for (const [name, price, diet, description, photo, custom] of rows) {
      assert.ok(name && description, `${key}: dish without a name or description`)
      assert.ok(Number.isInteger(price) && price > 0, `${name}: bad price`)
      assert.ok(['veg', 'nonveg', 'egg'].includes(diet), `${name}: bad diet`)
      if (photo) assert.ok(PHOTOS[photo], `${name}: unknown photo ${photo}`)
      if (custom) assert.ok(CUSTOM_SETS[custom], `${name}: unknown custom set ${custom}`)
    }
  }
})

test('each city has a full list of restaurants with unique ids', () => {
  const seen = new Set()
  for (const city of catalog.cities) {
    const outlets = catalog.outletsIn(city.id)
    assert.ok(outlets.length >= 20, `${city.name} has only ${outlets.length} restaurants`)
    for (const outlet of outlets) {
      assert.ok(!seen.has(outlet.id), `duplicate outlet ${outlet.id}`)
      seen.add(outlet.id)
      assert.equal(catalog.locality(outlet.localityId).cityId, city.id)
      assert.ok(outlet.rating >= 3.4 && outlet.rating <= 4.8)
    }
  }
})

test('menus are stable, non-empty and respect pure-veg kitchens', () => {
  for (const brand of BRANDS) {
    const { sections, dishes } = catalog.menuOf(brand.id)
    assert.ok(dishes.size >= 12, `${brand.id} has a thin menu (${dishes.size})`)
    assert.ok(sections.every((section) => section.items.length > 0))
    if (brand.veg) {
      for (const dish of dishes.values()) {
        assert.equal(dish.diet, 'veg', `${brand.id} serves ${dish.name}`)
        for (const group of dish.custom?.addons || []) {
          for (const option of group.options) assert.equal(option.diet, 'veg')
        }
      }
    }
  }
  assert.equal(catalog.menuOf('deg-and-dum'), catalog.menuOf('deg-and-dum'))
})

test('bestsellers are always in stock', () => {
  for (const brand of BRANDS) {
    for (const dish of catalog.menuOf(brand.id).dishes.values()) {
      if (dish.bestseller) assert.ok(dish.inStock, `${dish.name} at ${brand.id}`)
    }
  }
})

test('photo urls are built from keys and missing keys give null', () => {
  assert.match(photoUrl('dosa', 400), /^https:\/\/images\.unsplash\.com\/photo-.+w=400&h=300/)
  assert.equal(photoUrl('no-such-photo'), null)
  assert.equal(photoUrl(null), null)
})

test('listing filters and sorts', () => {
  const all = listOutlets(catalog, koramangala, { limit: 48 })
  assert.equal(all.total, nearbyOutlets(catalog, koramangala).length)

  const veg = listOutlets(catalog, koramangala, { veg: '1', limit: 48 })
  assert.ok(veg.total > 0 && veg.items.every((o) => o.veg))

  const rated = listOutlets(catalog, koramangala, { rating: '4.3', limit: 48 })
  assert.ok(rated.items.every((o) => o.rating >= 4.3))

  const fast = listOutlets(catalog, koramangala, { fast: '1', sort: 'eta', limit: 48 })
  assert.ok(fast.items.every((o) => o.etaMinutes <= 30))
  for (let i = 1; i < fast.items.length; i++) assert.ok(fast.items[i - 1].etaMinutes <= fast.items[i].etaMinutes)

  const pizza = listOutlets(catalog, koramangala, { cuisine: 'pizza' })
  assert.ok(pizza.total > 0 && pizza.items.every((o) => o.tags.includes('pizza')))

  const cheap = listOutlets(catalog, koramangala, { cost: 'low', sort: 'costLow', limit: 48 })
  assert.ok(cheap.items.every((o) => o.costForTwo <= 300))
})

test('listing pages do not overlap', () => {
  const first = listOutlets(catalog, koramangala, { limit: 8, page: 1 })
  const second = listOutlets(catalog, koramangala, { limit: 8, page: 2 })
  assert.equal(first.items.length, 8)
  assert.ok(first.hasMore)
  const ids = new Set(first.items.map((o) => o.id))
  assert.ok(second.items.every((o) => !ids.has(o.id)))
})

test('distance and eta depend on where you are', () => {
  const here = nearbyOutlets(catalog, koramangala)
  const there = nearbyOutlets(catalog, catalog.locality('blr-indiranagar'))
  const sample = here[0]
  const same = there.find((o) => o.id === sample.id)
  assert.notEqual(sample.distanceKm, same.distanceKm)
  assert.ok(here.every((o) => o.distanceKm <= 10))
})

test('search finds dishes and restaurants, and needs every word to match', () => {
  const biryani = search(catalog, koramangala, 'biryani')
  assert.ok(biryani.dishes.length > 5)
  assert.ok(biryani.dishes.every((hit) => /biryani/i.test(hit.dish.name + hit.dish.description)))
  assert.ok(biryani.outlets.some((o) => o.cuisines.includes('Biryani')))

  const paneerTikka = search(catalog, koramangala, 'paneer tikka')
  assert.ok(paneerTikka.dishes.every((hit) => /paneer/i.test(hit.dish.name + hit.dish.description)))

  assert.deepEqual(search(catalog, koramangala, '   ').dishes, [])
  assert.equal(search(catalog, koramangala, 'zzzzqqq').dishes.length, 0)
})

test('suggestions mix cuisines, restaurants and dishes', () => {
  const items = suggest(catalog, koramangala, 'bi')
  assert.ok(items.length > 0 && items.length <= 8)
  assert.ok(items.some((item) => item.type === 'cuisine' && item.label === 'Biryani'))
  assert.deepEqual(suggest(catalog, koramangala, ''), [])
})
