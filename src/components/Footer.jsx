import { Link } from 'react-router-dom'
import { PiGithubLogo } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { backendMode } from '../lib/api.js'
import Logo from './Logo.jsx'

export default function Footer() {
  const { cities, city, setLocality } = usePlace()
  const heading = 'kicker mb-3 text-band-soft'
  const link = 'text-on-band/85 hover:text-marigold'

  return (
    <footer className="mt-20 border-t border-band-line bg-band pb-24 text-on-band lg:pb-0">
      <div className="wrap grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-1 font-deva text-lg text-marigold" lang="hi">चस्का</p>
          <p className="mt-3 max-w-xs text-[0.95rem] text-band-soft">
            <em className="font-display not-italic text-on-band">Chaska</em>, noun: a taste you keep going back for. Food from the kitchens around you, brought to your door.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className={heading}>Explore</p>
          <ul className="grid gap-2">
            <li><Link className={link} to="/">Restaurants near you</Link></li>
            <li><Link className={link} to="/search">Search dishes</Link></li>
            <li><Link className={link} to="/offers">Offers and coupons</Link></li>
            <li><Link className={link} to="/orders">Your orders</Link></li>
            <li><Link className={link} to="/help">Help</Link></li>
          </ul>
        </nav>

        <div>
          <p className={heading}>We deliver in</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-1">
            {cities.map((entry) => (
              <li key={entry.id}>
                <button type="button" onClick={() => { setLocality(entry.localities[0].id); window.scrollTo({ top: 0 }) }} className={`${link} ${entry.id === city?.id ? 'font-semibold text-marigold' : ''}`}>
                  {entry.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={heading}>About this project</p>
          <p className="text-[0.95rem] text-band-soft">
            A portfolio project by Gangadhar Singh. The restaurants are made up, nothing is charged and no food will arrive, however good it looks.
          </p>
          <a className={`${link} mt-3 inline-flex items-center gap-2`} href="https://github.com/Gangadhar017" target="_blank" rel="noreferrer">
            <PiGithubLogo size={18} /> github.com/Gangadhar017
          </a>
        </div>
      </div>
      <div className="border-t border-band-line">
        <div className="wrap flex flex-col gap-1 py-4 text-sm text-band-soft sm:flex-row sm:items-center sm:justify-between">
          <p>Photographs from Unsplash.</p>
          <p>{backendMode === 'server' ? 'Connected to the Chaska API.' : 'Running in demo mode: your account and orders stay in this browser.'}</p>
        </div>
      </div>
    </footer>
  )
}
