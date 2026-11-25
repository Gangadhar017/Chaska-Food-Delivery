import { useSearchParams } from 'react-router-dom'
import { PiLeaf, PiLightning, PiSealPercent, PiSmileySad, PiStarFill } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { plural } from '../lib/format.js'
import { useOutlets } from '../lib/queries.js'
import { LoadError, SectionHeading, Spinner } from './bits.jsx'
import OutletCard, { OutletCardSkeleton } from './OutletCard.jsx'

const SORTS = [
  ['relevance', 'Relevance'],
  ['rating', 'Rating'],
  ['eta', 'Delivery time'],
  ['costLow', 'Cost: low to high'],
  ['costHigh', 'Cost: high to low'],
]
const TOGGLES = [
  ['veg', 'Pure veg', PiLeaf],
  ['fast', 'Under 30 min', PiLightning],
  ['offers', 'Offers', PiSealPercent],
]
const COSTS = [
  ['low', 'Up to ₹300'],
  ['mid', '₹300 to ₹600'],
  ['high', 'Above ₹600'],
]
const KEYS = ['sort', 'veg', 'fast', 'offers', 'rating', 'cost']

/**
 * The restaurant grid with its filters. Filter state lives in the URL, so a filtered
 * list can be shared, bookmarked and reached with the back button.
 * `fixed` holds filters the page itself imposes (a cuisine, or offers only).
 */
export default function Listing({ title, kicker, fixed = {}, hide = [] }) {
  const { localityId, locality } = usePlace()
  const [params, setParams] = useSearchParams()

  const filters = { ...Object.fromEntries(KEYS.filter((key) => params.get(key)).map((key) => [key, params.get(key)])), ...fixed }
  const active = KEYS.filter((key) => params.get(key) && !(key in fixed)).length
  const query = useOutlets(localityId, filters)

  function set(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true, preventScrollReset: true })
  }
  function clear() {
    const next = new URLSearchParams(params)
    KEYS.forEach((key) => next.delete(key))
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const pages = query.data?.pages || []
  const outlets = pages.flatMap((page) => page.items)
  const total = pages[0]?.total

  return (
    <section aria-label={title}>
      <SectionHeading kicker={kicker ?? (total !== undefined && locality ? `${plural(total, 'place')} delivering to ${locality.name}` : ' ')} title={title} />

      <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-line bg-paper/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto py-3">
          <label className="relative shrink-0">
            <span className="sr-only">Sort by</span>
            <select value={params.get('sort') || 'relevance'} onChange={(event) => set('sort', event.target.value === 'relevance' ? '' : event.target.value)} className="chip appearance-none pr-8 font-semibold">
              {SORTS.map(([value, label]) => <option key={value} value={value}>Sort: {label}</option>)}
            </select>
            <svg aria-hidden="true" viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
          </label>

          <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-line" />

          {TOGGLES.filter(([key]) => !(key in fixed) && !hide.includes(key)).map(([key, label, Icon]) => (
            <button key={key} type="button" className="chip shrink-0" aria-pressed={params.get(key) === '1'} onClick={() => set(key, params.get(key) === '1' ? '' : '1')}>
              <Icon size={15} /> {label}
            </button>
          ))}
          <button type="button" className="chip shrink-0" aria-pressed={params.get('rating') === '4.3'} onClick={() => set('rating', params.get('rating') === '4.3' ? '' : '4.3')}>
            <PiStarFill size={13} /> Rated 4.3+
          </button>
          {COSTS.map(([value, label]) => (
            <button key={value} type="button" className="chip shrink-0" aria-pressed={params.get('cost') === value} onClick={() => set('cost', params.get('cost') === value ? '' : value)}>
              {label}
            </button>
          ))}
          {active > 0 && (
            <button type="button" onClick={clear} className="btn btn-quiet btn-sm shrink-0">Clear all</button>
          )}
        </div>
      </div>

      {query.isError ? (
        <LoadError error={query.error} onRetry={query.refetch} />
      ) : query.isPending ? (
        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <OutletCardSkeleton key={index} />)}
        </div>
      ) : outlets.length === 0 ? (
        <div className="panel mx-auto flex max-w-md flex-col items-center px-6 py-10 text-center">
          <PiSmileySad size={34} className="text-faint" />
          <h3 className="mt-3 text-xl">Nothing matches those filters</h3>
          <p className="mt-1 text-soft">Try removing one, or look at a different area.</p>
          {active > 0 && <button type="button" onClick={clear} className="btn btn-outline btn-sm mt-5">Clear filters</button>}
        </div>
      ) : (
        <>
          <ul className={`grid gap-x-6 gap-y-9 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
            {outlets.map((outlet) => (
              <li key={outlet.id} className="min-w-0"><OutletCard outlet={outlet} /></li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="num text-sm text-faint">Showing {outlets.length} of {total}</p>
            {query.hasNextPage && (
              <button type="button" className="btn btn-outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
                {query.isFetchingNextPage && <Spinner />} Show more restaurants
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}
