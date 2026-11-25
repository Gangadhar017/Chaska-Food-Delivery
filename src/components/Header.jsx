import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  PiCaretDown, PiHeart, PiMagnifyingGlass, PiMapPinFill, PiMoon, PiQuestion, PiReceipt, PiSealPercent,
  PiShoppingBag, PiSignOut, PiSun, PiUser, PiUserCircle,
} from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSession } from '../app/session.jsx'
import { cartCount, useCart } from '../lib/cart.js'
import { setTheme, toast, useTheme } from '../lib/ui.js'
import Logo from './Logo.jsx'

function HeaderSearch() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onSearchPage = pathname === '/search'
  const [text, setText] = useState('')

  useEffect(() => {
    if (!onSearchPage) setText('')
  }, [onSearchPage])

  // The search page has its own, larger box.
  if (onSearchPage) return <div className="hidden flex-1 md:block" />

  return (
    <form
      role="search"
      className="relative hidden max-w-md flex-1 md:block"
      onSubmit={(event) => {
        event.preventDefault()
        navigate(`/search${text.trim() ? `?q=${encodeURIComponent(text.trim())}` : ''}`)
      }}
    >
      <PiMagnifyingGlass size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-band-soft" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search for biryani, dosa, a restaurant…"
        aria-label="Search restaurants and dishes"
        className="h-10 w-full rounded-lg border border-band-line bg-band-well pl-10 pr-3 text-[0.97rem] text-on-band placeholder:text-band-soft focus:border-marigold focus:outline-none"
      />
    </form>
  )
}

function AccountMenu() {
  const { user, signOut } = useSession()
  const theme = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const item = 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[0.97rem] text-ink hover:bg-sunken'
  const links = [
    ['/orders', PiReceipt, 'Orders'],
    ['/account/favourites', PiHeart, 'Favourites'],
    ['/account/addresses', PiMapPinFill, 'Addresses'],
    ['/account', PiUser, 'Profile'],
  ]

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" className="flex h-10 items-center gap-2 rounded-lg px-2.5 font-medium hover:bg-band-well">
        <PiUserCircle size={22} />
        <span className="max-w-28 truncate">{user.name.split(' ')[0]}</span>
        <PiCaretDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 w-60 animate-rise rounded-xl border border-line bg-card p-1.5 text-ink shadow-[0_18px_40px_-18px_rgb(8_16_12/0.45)]">
          <p className="truncate px-3 pb-2 pt-1.5 text-sm text-faint">{user.email}</p>
          {links.map(([to, Icon, label]) => (
            <Link key={to} to={to} role="menuitem" className={item} onClick={() => setOpen(false)}>
              <Icon size={18} className="text-soft" /> {label}
            </Link>
          ))}
          <div className="my-1.5 h-px bg-line" />
          <button type="button" role="menuitem" className={item} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <PiSun size={18} className="text-soft" /> : <PiMoon size={18} className="text-soft" />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false)
              signOut()
              toast('You have been signed out.')
              navigate('/')
            }}
          >
            <PiSignOut size={18} className="text-soft" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { locality, city, openPicker } = usePlace()
  const { user, status, askToSignIn } = useSession()
  const theme = useTheme()
  const count = cartCount(useCart())

  const navLink = ({ isActive }) => `flex h-10 items-center gap-2 rounded-lg px-2.5 font-medium transition-colors hover:bg-band-well ${isActive ? 'text-marigold' : ''}`

  return (
    <header className="sticky top-0 z-40 border-b border-band-line bg-band text-on-band">
      <div className="wrap flex h-16 items-center gap-2 sm:gap-4 lg:gap-5">
        <Link to="/" aria-label="Chaska home" className="shrink-0 rounded-md">
          <Logo compact />
        </Link>

        <button type="button" onClick={openPicker} className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-band-well" aria-label={`Delivery location: ${locality?.name || 'choose'}. Change`}>
          <PiMapPinFill size={18} className="shrink-0 text-marigold" />
          <span className="min-w-0 leading-tight">
            <span className="kicker block text-band-soft">Deliver to</span>
            <span className="block truncate font-semibold">
              {locality ? locality.name : 'Choose location'}
              {city && <span className="hidden font-normal text-band-soft sm:inline">, {city.name}</span>}
            </span>
          </span>
          <PiCaretDown size={13} className="shrink-0 text-band-soft" />
        </button>

        <HeaderSearch />

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLink to="/offers" className={navLink}><PiSealPercent size={20} /> Offers</NavLink>
          <NavLink to="/help" className={navLink}><PiQuestion size={20} /> Help</NavLink>
          {user ? (
            <AccountMenu />
          ) : (
            <button type="button" className="flex h-10 items-center gap-2 rounded-lg px-2.5 font-medium hover:bg-band-well" onClick={() => askToSignIn()} disabled={status === 'checking'}>
              <PiUser size={20} /> Sign in
            </button>
          )}
          <Link to="/checkout" className="btn btn-accent btn-sm ml-2 h-10 px-3.5" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <PiShoppingBag size={19} />
            Cart
            {count > 0 && <span className="num grid h-5 min-w-5 place-items-center rounded-full bg-on-marigold px-1 text-[0.75rem] text-marigold">{count}</span>}
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center lg:hidden">
          <Link to="/account" aria-label={user ? 'Your account' : 'Sign in'} className="grid size-10 place-items-center rounded-lg hover:bg-band-well">
            {user ? <PiUserCircle size={22} /> : <PiUser size={20} />}
          </Link>
          <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} className="grid size-10 place-items-center rounded-lg hover:bg-band-well">
            {theme === 'dark' ? <PiSun size={20} /> : <PiMoon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
