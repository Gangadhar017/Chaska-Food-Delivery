import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PiArrowRight, PiForkKnife, PiLeaf, PiList, PiMagnifyingGlass, PiX } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { DietMark, LoadError, Notice, Rating, Stepper } from '../components/bits.jsx'
import CouponTicket from '../components/CouponTicket.jsx'
import Dialog from '../components/Dialog.jsx'
import { useDishActions } from '../components/dishActions.jsx'
import DishRow from '../components/DishRow.jsx'
import { FavouriteButton } from '../components/OutletCard.jsx'
import Photo from '../components/Photo.jsx'
import { cart, cartCount, cartSubtotal, dishQuantity, useCart } from '../lib/cart.js'
import { compactCount, lineSummary, plural, rupee } from '../lib/format.js'
import { useRestaurant } from '../lib/queries.js'
import { useTitle } from '../lib/ui.js'
import NotFound from './NotFound.jsx'

function Fact({ label, children }) {
  return (
    <div className="px-4 py-3 first:pl-0 sm:px-5">
      <dt className="kicker mb-1">{label}</dt>
      <dd className="num text-[1.02rem] font-semibold">{children}</dd>
    </div>
  )
}

function Masthead({ outlet }) {
  return (
    <section className="border-b border-line bg-card">
      <div className="wrap grid gap-6 py-7 md:grid-cols-[1fr_19rem] md:items-center lg:py-9">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-faint">
            <Link to="/" className="hover:text-ink">Home</Link>
            <span aria-hidden="true">/</span>
            <span>{outlet.cityName}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate text-soft">{outlet.name}</span>
          </nav>
          <div className="flex items-start gap-4">
            <h1 className="text-[2.2rem] sm:text-[2.9rem]">{outlet.name}</h1>
            <FavouriteButton outlet={outlet} className="mt-1.5 shrink-0 sm:mt-3" />
          </div>
          <p className="mt-2 max-w-xl font-display text-[1.12rem] italic text-soft">{outlet.tagline}</p>
          <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.97rem] text-soft">
            {outlet.veg && <span className="tag tag-leaf"><PiLeaf size={11} /> Pure veg</span>}
            <span>{outlet.cuisines.join(' · ')}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />
            <span>{outlet.localityName}</span>
          </p>
          <dl className="mt-5 flex flex-wrap divide-x divide-line border-y border-line">
            <Fact label="Rating">
              <span className="flex items-center gap-2"><Rating value={outlet.rating} /><span className="text-sm font-normal text-faint">{compactCount(outlet.ratingCount)}</span></span>
            </Fact>
            <Fact label="Delivery">{outlet.etaMinutes} min</Fact>
            <Fact label="Distance">{outlet.distanceKm} km</Fact>
            <Fact label="For two">{rupee(outlet.costForTwo)}</Fact>
          </dl>
        </div>
        <Photo name={outlet.cover} label={outlet.name} alt="" width={640} ratio={0.7} eager className="hidden aspect-[10/7] rounded-2xl border border-line md:block" />
      </div>
    </section>
  )
}

function CartPanel({ outlet }) {
  const state = useCart()
  const mine = state.outlet?.id === outlet.id
  const count = cartCount(state)

  if (!count) {
    return (
      <div className="panel px-5 py-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-sunken text-faint"><PiForkKnife size={24} /></span>
        <p className="mt-4 font-display text-xl font-semibold">Your cart is empty</p>
        <p className="mt-1 text-[0.95rem] text-soft">Add something from the menu and it will show up here.</p>
      </div>
    )
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <p className="kicker mb-1">{mine ? 'Your order from' : 'Your cart is from'}</p>
        <p className="font-display text-xl font-semibold leading-tight">{state.outlet.name}</p>
        {!mine && <p className="mt-1.5 text-sm text-soft">Adding from {outlet.name} will ask before replacing it.</p>}
      </div>
      <ul className="max-h-[22rem] divide-y divide-line overflow-y-auto px-5">
        {state.lines.map((line) => (
          <li key={line.key} className="flex items-start gap-3 py-3.5">
            <DietMark diet={line.diet} className="mt-1" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{line.name}</p>
              {lineSummary(line) && <p className="text-sm leading-snug text-faint">{lineSummary(line)}</p>}
              <p className="num mt-0.5 text-[0.93rem] text-soft">{rupee(line.unitPrice * line.quantity)}</p>
            </div>
            <Stepper compact value={line.quantity} onMinus={() => cart.decrement(line.key)} onPlus={() => cart.increment(line.key)} label={`${line.name} quantity`} />
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-sunken/60 px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-semibold">Subtotal</span>
          <span className="num text-lg font-bold">{rupee(cartSubtotal(state))}</span>
        </div>
        <Link to="/checkout" className="btn btn-primary w-full">Go to checkout <PiArrowRight size={17} /></Link>
        <p className="mt-2 text-center text-sm text-faint">Delivery, taxes and offers are added at checkout.</p>
      </div>
    </div>
  )
}

/** Highlights the menu section currently on screen. */
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id.replace('menu-', ''))
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    key.split('|').forEach((id) => {
      const node = document.getElementById(`menu-${id}`)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [key])
  return active
}

function Menu({ data }) {
  const { outlet, menu } = data
  const state = useCart()
  const actions = useDishActions()
  const [vegOnly, setVegOnly] = useState(false)
  const [bestOnly, setBestOnly] = useState(false)
  const [text, setText] = useState('')
  const [navOpen, setNavOpen] = useState(false)

  const sections = useMemo(() => {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean)
    return menu
      .map((section) => ({
        ...section,
        items: section.items.filter((dish) => {
          if (vegOnly && dish.diet !== 'veg') return false
          if (bestOnly && !dish.bestseller) return false
          const haystack = `${dish.name} ${dish.description}`.toLowerCase()
          return words.every((word) => haystack.includes(word))
        }),
      }))
      .filter((section) => section.items.length > 0)
  }, [menu, vegOnly, bestOnly, text])

  const active = useActiveSection(sections.map((section) => section.id))
  const jump = (id) => {
    setNavOpen(false)
    document.getElementById(`menu-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const filtered = vegOnly || bestOnly || text

  return (
    <div className="wrap grid gap-8 py-8 lg:grid-cols-[13rem_minmax(0,1fr)_21.5rem] lg:gap-10">
      <nav aria-label="Menu sections" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="kicker mb-3">Menu</p>
          <ul className="grid border-l border-line">
            {sections.map((section) => (
              <li key={section.id}>
                <button type="button" onClick={() => jump(section.id)} aria-current={active === section.id ? 'true' : undefined} className={`-ml-px flex w-full items-baseline justify-between gap-2 border-l-2 py-2 pl-4 pr-1 text-left text-[0.97rem] transition-colors ${active === section.id ? 'border-leaf font-semibold text-leaf' : 'border-transparent text-soft hover:text-ink'}`}>
                  <span>{section.title}</span>
                  <span className="num text-sm text-faint">{section.items.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <PiMagnifyingGlass size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder={`Search in ${outlet.name}`} aria-label="Search this menu" className="field h-10 pl-9 pr-9" />
            {text && (
              <button type="button" onClick={() => setText('')} aria-label="Clear search" className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-faint hover:text-ink"><PiX size={15} /></button>
            )}
          </div>
          {!outlet.veg && (
            <button type="button" className="chip h-10" aria-pressed={vegOnly} onClick={() => setVegOnly((value) => !value)}>
              <DietMark diet="veg" className={vegOnly ? 'bg-paper' : ''} /> Veg only
            </button>
          )}
          <button type="button" className="chip h-10" aria-pressed={bestOnly} onClick={() => setBestOnly((value) => !value)}>Bestsellers</button>
        </div>

        {sections.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-display text-xl font-semibold">Nothing on the menu matches</p>
            <p className="mt-1 text-soft">Try a different word or switch off the filters.</p>
            {filtered && <button type="button" className="btn btn-outline btn-sm mt-4" onClick={() => { setText(''); setVegOnly(false); setBestOnly(false) }}>Show the full menu</button>}
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id} id={`menu-${section.id}`} aria-labelledby={`heading-${section.id}`} className="scroll-mt-24 pt-7">
              <div className="flex items-baseline gap-3 border-b-2 border-ink pb-2">
                <h2 id={`heading-${section.id}`} className="text-[1.5rem]">{section.title}</h2>
                <span className="num kicker">{plural(section.items.length, 'item')}</span>
              </div>
              <div className="divide-y divide-line">
                {section.items.map((dish) => (
                  <DishRow key={dish.id} dish={dish} quantity={dishQuantity(state, outlet.id, dish.id)} onAdd={() => actions.add(outlet, dish)} onMinus={() => actions.minus(dish)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <aside aria-label="Cart" className="hidden lg:block">
        <div className="sticky top-24"><CartPanel outlet={outlet} /></div>
      </aside>

      <button type="button" onClick={() => setNavOpen(true)} className="btn fixed bottom-[calc(8.75rem+env(safe-area-inset-bottom))] right-4 z-30 h-11 bg-ink text-paper lg:hidden">
        <PiList size={18} /> Menu
      </button>
      <Dialog open={navOpen} onClose={() => setNavOpen(false)} kicker={outlet.name} title="Menu" width="24rem">
        <ul className="divide-y divide-line px-5 py-1">
          {sections.map((section) => (
            <li key={section.id}>
              <button type="button" onClick={() => jump(section.id)} className="flex w-full items-baseline justify-between py-3.5 text-left text-[1.05rem] font-medium">
                {section.title}
                <span className="num text-sm text-faint">{section.items.length}</span>
              </button>
            </li>
          ))}
        </ul>
      </Dialog>
      {actions.dialogs}
    </div>
  )
}

export default function Restaurant() {
  const { id } = useParams()
  const { localityId, city, setLocality } = usePlace()
  const query = useRestaurant(id, localityId)
  const data = query.data
  useTitle(data ? `${data.outlet.name}, ${data.outlet.localityName}` : '')

  if (query.error?.status === 404) return <NotFound />
  if (query.isError) return <div className="wrap"><LoadError error={query.error} onRetry={query.refetch} /></div>
  if (!data) {
    return (
      <div className="wrap py-9" aria-busy="true">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton mt-4 h-11 w-80 max-w-full" />
        <div className="skeleton mt-4 h-5 w-96 max-w-full" />
        <div className="skeleton mt-7 h-16 w-full max-w-xl" />
        <div className="mt-12 grid gap-6">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-28 w-full max-w-3xl" />)}
        </div>
      </div>
    )
  }

  const { outlet, coupons } = data
  const elsewhere = city && city.id !== outlet.cityId

  return (
    <>
      <Masthead outlet={outlet} />
      {elsewhere && (
        <div className="wrap pt-5">
          <Notice tone="warn" className="flex flex-wrap items-center justify-between gap-3">
            <span>This restaurant is in {outlet.cityName}, but you are ordering to {city.name}. Switch location to order from here.</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setLocality(data.locality.id)}>Deliver to {data.locality.name}</button>
          </Notice>
        </div>
      )}
      <div className="wrap pt-7">
        <p className="kicker mb-3">Offers at this restaurant</p>
        <ul className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
          {coupons.map((coupon) => (
            <li key={coupon.code} className="w-[19rem] shrink-0"><CouponTicket coupon={coupon} /></li>
          ))}
        </ul>
      </div>
      <Menu data={data} />
    </>
  )
}
