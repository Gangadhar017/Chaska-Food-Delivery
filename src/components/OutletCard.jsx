import { Link } from 'react-router-dom'
import { PiHeart, PiHeartFill, PiLeaf } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSession } from '../app/session.jsx'
import { rupee } from '../lib/format.js'
import { useFavourites, useToggleFavourite } from '../lib/queries.js'
import { toast } from '../lib/ui.js'
import { Rating } from './bits.jsx'
import Photo from './Photo.jsx'

export function FavouriteButton({ outlet, className = '' }) {
  const { user, askToSignIn } = useSession()
  const { localityId } = usePlace()
  const { data } = useFavourites(localityId, Boolean(user))
  const toggle = useToggleFavourite()
  const on = Boolean(user && data?.ids.includes(outlet.id))

  function flip() {
    toggle.mutate(
      { outletId: outlet.id, on: !on },
      { onError: (error) => toast.error(error.message), onSuccess: () => toast(!on ? `${outlet.name} saved to your favourites.` : `${outlet.name} removed from favourites.`) },
    )
  }

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Remove ${outlet.name} from favourites` : `Save ${outlet.name} to favourites`}
      onClick={(event) => {
        event.preventDefault()
        if (user) flip()
        else askToSignIn('Sign in to save favourites', flip)
      }}
      className={`grid size-9 place-items-center rounded-full border border-line bg-card/95 transition-transform hover:scale-110 ${on ? 'text-chili' : 'text-ink'} ${className}`}
    >
      {on ? <PiHeartFill size={18} /> : <PiHeart size={18} />}
    </button>
  )
}

/** A restaurant in a grid or rail. */
export default function OutletCard({ outlet, eager = false }) {
  return (
    <article className="group relative h-full">
      <Link to={`/restaurant/${outlet.id}`} className="block rounded-xl">
        <div className="relative">
          <Photo name={outlet.cover} label={outlet.name} width={420} ratio={0.64} eager={eager} className="aspect-[25/16] rounded-xl border border-line [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.04]" />
          {outlet.offer && (
            <span className="tag tag-marigold absolute bottom-3 left-0 rounded-l-none px-2.5 py-[0.4rem] text-[0.78rem]">{outlet.offer.label}</span>
          )}
          {outlet.veg && (
            <span className="tag absolute left-2.5 top-2.5 bg-card text-veg"><PiLeaf size={11} /> Pure veg</span>
          )}
        </div>
        <div className="px-0.5 pt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-[1.2rem] decoration-line-strong decoration-1 underline-offset-4 group-hover:underline">{outlet.name}</h3>
            <span className="mt-0.5 shrink-0"><Rating value={outlet.rating} size="sm" /></span>
          </div>
          <p className="truncate text-[0.95rem] text-soft">{outlet.cuisines.join(' · ')}</p>
          <p className="num mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.92rem] font-medium">
            <span>{outlet.etaMinutes} min</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />
            <span>{outlet.distanceKm} km</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />
            <span className="text-soft">{rupee(outlet.costForTwo)} for two</span>
          </p>
          <p className="truncate text-sm text-faint">{outlet.localityName}</p>
        </div>
      </Link>
      <FavouriteButton outlet={outlet} className="absolute right-2.5 top-2.5" />
    </article>
  )
}

export function OutletCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[25/16] rounded-xl" />
      <div className="skeleton mt-3.5 h-5 w-3/5" />
      <div className="skeleton mt-2 h-4 w-4/5" />
      <div className="skeleton mt-2 h-4 w-2/5" />
    </div>
  )
}
