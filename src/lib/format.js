const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inrExact = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** ₹1,299. Whole rupees unless the value has paise. */
export function rupee(value) {
  const amount = Number(value) || 0
  return `₹${Number.isInteger(amount) ? inr.format(amount) : inrExact.format(amount)}`
}

/** 1.2K+ style counts for ratings. */
export function compactCount(value) {
  if (value >= 10000) return `${Math.floor(value / 1000)}K+`
  if (value >= 1000) return `${(Math.floor(value / 100) / 10).toFixed(1).replace('.0', '')}K+`
  if (value >= 100) return `${Math.floor(value / 50) * 50}+`
  return String(value)
}

const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
const day = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const dayYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const clockTime = (ms) => time.format(ms)

export function dayLabel(ms) {
  const then = new Date(ms)
  const now = new Date()
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000)
  if (days === 0) return `Today, ${time.format(ms)}`
  if (days === 1) return `Yesterday, ${time.format(ms)}`
  return `${then.getFullYear() === now.getFullYear() ? day.format(ms) : dayYear.format(ms)}, ${time.format(ms)}`
}

export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/** "Large · serves 2, Extra raita" for a cart or order line. */
export function lineSummary(line) {
  return [line.variant?.name, ...(line.addons || []).map((addon) => addon.name)].filter(Boolean).join(', ')
}
