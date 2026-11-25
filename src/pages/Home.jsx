import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PiArrowRight, PiMagnifyingGlass } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { LoadError } from '../components/bits.jsx'
import CouponTicket from '../components/CouponTicket.jsx'
import Listing from '../components/Listing.jsx'
import OutletCard, { OutletCardSkeleton } from '../components/OutletCard.jsx'
import Photo from '../components/Photo.jsx'
import Rail from '../components/Rail.jsx'
import { useHome } from '../lib/queries.js'
import { useTitle } from '../lib/ui.js'

const HERO_PHOTOS = [
  ['biryani-chicken', 'A plate of chicken dum biryani'],
  ['dosa', 'Masala dosa with chutneys'],
  ['paneer-butter', 'Paneer butter masala with naan'],
]

function Hero({ home }) {
  const navigate = useNavigate()
  const { locality, openPicker } = usePlace()
  const [text, setText] = useState('')
  const quickest = home?.quick[0]

  return (
    <section className="bg-band text-on-band">
      <div className="wrap grid items-center gap-10 pb-12 pt-8 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pb-16">
        <div>
          <p className="kicker mb-4 text-band-soft">
            {home ? `${home.total} kitchens cooking near ` : 'Finding kitchens near '}
            <button type="button" onClick={openPicker} className="kicker text-marigold underline decoration-dotted underline-offset-4">
              {locality?.name || 'you'}
            </button>
          </p>
          <h1 className="text-[2.6rem] leading-[1.02] sm:text-[3.6rem] lg:text-[4.25rem]">
            What&rsquo;s the <em className="font-medium text-marigold">chaska</em> today?
          </h1>
          <p className="mt-4 max-w-md text-[1.08rem] text-band-soft">
            Biryani on dum, dosa off the tawa, or cake at midnight. Order from the kitchens around you and follow it to your door.
          </p>

          <form
            role="search"
            className="mt-7 flex max-w-xl gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              navigate(`/search${text.trim() ? `?q=${encodeURIComponent(text.trim())}` : ''}`)
            }}
          >
            <div className="relative flex-1">
              <PiMagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Biryani, dosa, pizza…"
                aria-label="Search for a dish or a restaurant"
                className="h-[3.25rem] w-full rounded-lg border border-transparent bg-card pl-12 pr-4 text-[1.05rem] text-ink placeholder:text-faint focus:border-marigold focus:outline-none"
              />
            </div>
            <button type="submit" className="btn btn-accent btn-lg px-5">
              <span className="hidden sm:inline">Find food</span>
              <PiArrowRight size={19} className="sm:hidden" />
            </button>
          </form>

          <ul className="mt-5 flex flex-wrap gap-2">
            {(home?.cuisines || []).slice(0, 6).map((cuisine) => (
              <li key={cuisine.id}>
                <Link to={`/cuisine/${cuisine.id}`} className="inline-flex h-8 items-center rounded-md border border-band-line px-3 text-[0.92rem] text-on-band/90 hover:border-marigold hover:text-marigold">
                  {cuisine.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="grid grid-cols-[1.25fr_1fr] gap-3">
            <Photo name={HERO_PHOTOS[0][0]} width={520} ratio={1.18} eager className="row-span-2 aspect-[11/13] rounded-2xl" />
            <Photo name={HERO_PHOTOS[1][0]} width={400} ratio={0.8} eager className="aspect-[5/4] rounded-2xl" />
            <Photo name={HERO_PHOTOS[2][0]} width={400} ratio={0.8} eager className="aspect-[5/4] rounded-2xl" />
          </div>
          {quickest && (
            <div className="absolute -left-6 bottom-8 w-56 rotate-[-3deg] rounded-xl bg-marigold px-4 py-3 text-on-marigold">
              <p className="kicker text-on-marigold/70">Quickest right now</p>
              <p className="mt-0.5 truncate font-display text-lg font-semibold leading-tight">{quickest.name}</p>
              <p className="num text-[0.92rem] font-semibold">{quickest.etaMinutes} min to {locality?.name}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CuisineRail({ cuisines }) {
  return (
    <Rail kicker="Start with a craving" title="What are you in the mood for?">
      {cuisines.map((cuisine) => (
        <Link key={cuisine.id} to={`/cuisine/${cuisine.id}`} className="group block w-[7.25rem] sm:w-[8.5rem]">
          <Photo name={cuisine.photo} label={cuisine.name} width={272} ratio={1} className="aspect-square rounded-xl border border-line [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105" />
          <p className="mt-2 truncate text-center font-semibold group-hover:text-leaf">{cuisine.name}</p>
          <p className="num text-center text-sm text-faint">{cuisine.count} {cuisine.count === 1 ? 'place' : 'places'}</p>
        </Link>
      ))}
    </Rail>
  )
}

function OutletRail({ kicker, title, outlets }) {
  if (!outlets?.length) return null
  return (
    <Rail kicker={kicker} title={title} itemClassName="w-[17rem] sm:w-[18.5rem]">
      {outlets.map((outlet) => <OutletCard key={outlet.id} outlet={outlet} />)}
    </Rail>
  )
}

export default function Home() {
  useTitle('')
  const { localityId, locality } = usePlace()
  const home = useHome(localityId)
  const data = home.data

  return (
    <>
      <Hero home={data} />
      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-14 pt-12">
        {home.isError ? (
          <LoadError error={home.error} onRetry={home.refetch} />
        ) : !data ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => <OutletCardSkeleton key={index} />)}
          </div>
        ) : (
          <>
            <CuisineRail cuisines={data.cuisines} />
            <OutletRail kicker={`Loved in ${locality?.name || 'your area'}`} title="Top rated near you" outlets={data.topRated} />

            <Rail kicker="Use a code at checkout" title="Offers on the table" itemClassName="w-[19.5rem]">
              {data.coupons.map((coupon) => <CouponTicket key={coupon.code} coupon={coupon} />)}
            </Rail>

            <OutletRail kicker="When you cannot wait" title="Quickest to your door" outlets={data.quick} />
          </>
        )}
        <Listing title="All restaurants" />
      </div>
    </>
  )
}
