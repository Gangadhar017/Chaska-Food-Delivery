// Small UI stores and hooks: toasts, theme, document title, debounce.

import { useEffect, useState, useSyncExternalStore } from 'react'

function createStore(initial) {
  let value = initial
  const listeners = new Set()
  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? next(value) : next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// ── Toasts ──────────────────────────────────────────────────────────────────

const toasts = createStore([])
let toastId = 0

export function toast(message, { tone = 'info', action, duration = 3600 } = {}) {
  const id = ++toastId
  toasts.set((list) => [...list.slice(-2), { id, message, tone, action }])
  setTimeout(() => dismissToast(id), duration)
  return id
}
toast.error = (message, options) => toast(message, { ...options, tone: 'error', duration: 5200 })
toast.success = (message, options) => toast(message, { ...options, tone: 'success' })

export const dismissToast = (id) => toasts.set((list) => list.filter((entry) => entry.id !== id))
export const useToasts = () => useSyncExternalStore(toasts.subscribe, toasts.get)

// ── Theme ───────────────────────────────────────────────────────────────────

const THEME_KEY = 'chaska.theme'
const theme = createStore(typeof document === 'undefined' ? 'light' : document.documentElement.dataset.theme || 'light')

export function setTheme(next) {
  document.documentElement.dataset.theme = next
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#0a100d' : '#0d4a37')
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {
    // Not saved; applies to this visit.
  }
  theme.set(next)
}
export const useTheme = () => useSyncExternalStore(theme.subscribe, theme.get)

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Chaska` : 'Chaska · Food delivery from the kitchens around you'
  }, [title])
}

export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** True when the viewport is at least `minWidth` rem wide. */
export function useWide(minWidth) {
  const query = `(min-width: ${minWidth}rem)`
  const [matches, setMatches] = useState(() => (typeof matchMedia === 'undefined' ? true : matchMedia(query).matches))
  useEffect(() => {
    const media = matchMedia(query)
    const update = () => setMatches(media.matches)
    media.addEventListener('change', update)
    update()
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}
