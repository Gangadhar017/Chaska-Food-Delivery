import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PiArrowRight, PiClockCounterClockwise, PiMagnifyingGlass, PiX } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { LoadError, Rating } from '../components/bits.jsx'
import { useDishActions } from '../components/dishActions.jsx'
import DishRow from '../components/DishRow.jsx'
import OutletCard from '../components/OutletCard.jsx'
import Photo from '../components/Photo.jsx'
import { dishQuantity, useCart } from '../lib/cart.js'
import { plural } from '../lib/format.js'
import { useSearch, useSuggestions } from '../lib/queries.js'
import { useDebounced, useTitle } from '../lib/ui.js'

const RECENT_KEY = 'chaska.searches'

function readRecent() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY))
    return Array.isArray(list) ? list.slice(0, 6) : []
  } catch {
    return []
  }
}

function remember(term) {
  const next = [term, ...readRecent().filter((entry) => entry.toLowerCase() !== term.toLowerCase())].slice(0, 6)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Recent searches are a nicety; fine to lose them.
  }
  return next
}

/** Dishes grouped under the restaurant that serves them. */
function DishResults({ dishes }) {
  const state = useCart()
  const actions = useDishActions()
  const groups = useMemo(() => {
    const byOutlet = new Map()
    for (const hit of dishes) {
      if (!byOutlet.has(hit.outlet.id)) byOutlet.set(hit.outlet.id, { outlet: hit.outlet, dishes: [] })
      byOutlet.get(hit.outlet.id).dishes.push(hit.dish)
    }
    return [...byOutlet.values()]
  }, [dishes])

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {groups.map(({ outlet, dishes: list }) => (
        <section key={outlet.id} className="panel px-5">
          <Link to={`/restaurant/${outlet.id}`} className="group flex items-center gap-3 border-b border-line py-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.15rem] font-semibold group-hover:underline">{outlet.name}</p>
              <p className="num flex items-center gap-2 text-sm text-soft">
                <Rating value={outlet.rating} size="sm" /> {outlet.etaMinutes} min · {outlet.localityName}
              </p>
            </div>
            <PiArrowRight size={18} className="shrink-0 text-faint group-hover:text-ink" />
          </Link>
          <div className="divide-y divide-line">
            {list.slice(0, 4).map((dish) => (
              <DishRow key={dish.id} dish={dish} quantity={dishQuantity(state, outlet.id, dish.id)} onAdd={() => actions.add(outlet, dish)} onMinus={() => actions.minus(dish)} />
            ))}
          </div>
          {list.length > 4 && (
            <Link to={`/restaurant/${outlet.id}`} className="block border-t border-line py-3 text-center text-[0.95rem] font-semibold text-leaf hover:underline">
              {plural(list.length - 4, 'more match', 'more matches')} on this menu
            </Link>
          )}
        </section>
      ))}
      {actions.dialogs}
    </div>
  )
}

export default function Search() {
  const { localityId, locality, cuisines } = usePlace()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(params.get('q') || '')
  const [tab, setTab] = useState('dishes')
  const [recent, setRecent] = useState(readRecent)
  const input = useRef(null)
  const term = useDebounced(text.trim(), 280)
  useTitle(term ? `"${term}"` : 'Search')

  const results = useSearch(localityId, term)
  const suggestions = useSuggestions(localityId, term)

  // Keep the address bar in step with the box, so a search can be shared or reloaded.
  useEffect(() => {
    const current = params.get('q') || ''
    if (term === current) return
    setParams(term ? { q: term } : {}, { replace: true })
  }, [term, params, setParams])

  // Remember a search once it has returned something.
  useEffect(() => {
    if (term.length >= 3 && results.data && results.data.dishes.length + results.data.outlets.length > 0) setRecent(remember(term))
  }, [term, results.data])

  useEffect(() => {
    input.current?.focus()
  }, [])

  const data = term.length >= 2 ? results.data : null
  const counts = { dishes: data?.dishes.length || 0, restaurants: data?.outlets.length || 0 }
  const shown = counts[tab] === 0 && counts[tab === 'dishes' ? 'restaurants' : 'dishes'] > 0 ? (tab === 'dishes' ? 'restaurants' : 'dishes') : tab

  return (
    <div className="wrap py-7 sm:py-9">
      <div className="mx-auto max-w-3xl">
        <h1 className="sr-only">Search</h1>
        <div className="relative">
          <PiMagnifyingGlass size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
          <input
            ref={input}
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Search for dishes and restaurants"
            aria-label="Search for dishes and restaurants"
            className="field h-14 rounded-xl pl-12 pr-12 text-[1.1rem]"
          />
          {text && (
            <button type="button" onClick={() => { setText(''); input.current?.focus() }} aria-label="Clear search" className="absolute right-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-faint hover:bg-sunken hover:text-ink">
              <PiX size={18} />
            </button>
          )}
        </div>

        {term.length >= 2 && suggestions.data?.items.length > 0 && (
          <ul className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Suggestions">
            {suggestions.data.items.map((item) => (
              <li key={`${item.type}-${item.label}`} className="shrink-0">
                {item.type === 'restaurant' ? (
                  <Link to={`/restaurant/${item.id}`} className="chip"><span className="kicker">Restaurant</span> {item.label}</Link>
                ) : item.type === 'cuisine' ? (
                  <Link to={`/cuisine/${item.id}`} className="chip"><span className="kicker">Cuisine</span> {item.label}</Link>
                ) : (
                  <button type="button" className="chip" onClick={() => setText(item.label)}>{item.label}</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {term.length < 2 ? (
        <div className="mx-auto mt-9 max-w-3xl">
          {recent.length > 0 && (
            <section className="mb-9">
              <div className="mb-3 flex items-center justify-between">
                <p className="kicker">Recent searches</p>
                <button type="button" className="text-sm font-semibold text-leaf hover:underline" onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]) }}>Clear</button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {recent.map((entry) => (
                  <li key={entry}><button type="button" className="chip" onClick={() => setText(entry)}><PiClockCounterClockwise size={15} className="text-faint" /> {entry}</button></li>
                ))}
              </ul>
            </section>
          )}
          <p className="kicker mb-4">Popular around {locality?.name}</p>
          <ul className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4 md:grid-cols-6">
            {cuisines.slice(0, 12).map((cuisine) => (
              <li key={cuisine.id}>
                <Link to={`/cuisine/${cuisine.id}`} className="group block">
                  <Photo name={cuisine.photo} label={cuisine.name} width={220} ratio={1} className="aspect-square rounded-xl border border-line" />
                  <p className="mt-1.5 truncate text-center text-[0.95rem] font-semibold group-hover:text-leaf">{cuisine.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : results.isError ? (
        <LoadError error={results.error} onRetry={results.refetch} />
      ) : !data ? (
        <div className="mt-9 grid gap-5 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-56 rounded-xl" />)}
        </div>
      ) : counts.dishes + counts.restaurants === 0 ? (
        <div className="mx-auto mt-14 max-w-md text-center">
          <h2 className="text-2xl">No luck with &ldquo;{term}&rdquo;</h2>
          <p className="mt-2 text-soft">Nothing near {locality?.name} matches. Check the spelling, or try something broader like &ldquo;paneer&rdquo; or &ldquo;pizza&rdquo;.</p>
        </div>
      ) : (
        <div className={`mt-7 transition-opacity ${results.isPlaceholderData ? 'opacity-60' : ''}`}>
          <div className="mb-6 flex gap-2 border-b border-line" role="tablist" aria-label="Results">
            {[['dishes', 'Dishes'], ['restaurants', 'Restaurants']].map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={shown === key} onClick={() => setTab(key)} className={`-mb-px flex items-center gap-2 border-b-2 px-1 pb-2.5 pr-4 text-[1.05rem] font-semibold ${shown === key ? 'border-leaf text-ink' : 'border-transparent text-faint hover:text-ink'}`}>
                {label}
                <span className="num rounded bg-sunken px-1.5 py-0.5 text-[0.78rem] text-soft">{counts[key]}</span>
              </button>
            ))}
          </div>
          {shown === 'dishes' ? (
            <DishResults dishes={data.dishes} />
          ) : (
            <ul className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.outlets.map((outlet) => <li key={outlet.id} className="min-w-0"><OutletCard outlet={outlet} /></li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
