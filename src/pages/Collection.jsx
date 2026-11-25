import { Link, useParams } from 'react-router-dom'
import { PiArrowLeft } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import Listing from '../components/Listing.jsx'
import Photo from '../components/Photo.jsx'
import { useTitle } from '../lib/ui.js'
import NotFound from './NotFound.jsx'

/** Every restaurant that serves one cuisine. */
export default function Collection() {
  const { id } = useParams()
  const { cuisines, locality, ready } = usePlace()
  const cuisine = cuisines.find((entry) => entry.id === id)
  useTitle(cuisine ? `${cuisine.name} near you` : '')

  if (ready && !cuisine) return <NotFound />

  return (
    <>
      <section className="bg-band text-on-band">
        <div className="wrap flex items-center gap-5 py-8 sm:py-10">
          {cuisine && <Photo name={cuisine.photo} label={cuisine.name} width={220} ratio={1} eager className="size-20 shrink-0 rounded-xl sm:size-28" />}
          <div className="min-w-0">
            <Link to="/" className="mb-2 inline-flex items-center gap-1.5 text-sm text-band-soft hover:text-marigold"><PiArrowLeft size={14} /> All restaurants</Link>
            <h1 className="text-[2.2rem] sm:text-[3rem]">{cuisine?.name || ' '}</h1>
            <p className="mt-1 text-band-soft">Places serving {cuisine?.name.toLowerCase()} that deliver to {locality?.name}.</p>
          </div>
        </div>
      </section>
      <div className="wrap pt-10">
        {cuisine && <Listing key={cuisine.id} title={`${cuisine.name} near you`} fixed={{ cuisine: cuisine.id }} />}
      </div>
    </>
  )
}
