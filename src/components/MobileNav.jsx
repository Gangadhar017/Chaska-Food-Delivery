import { NavLink } from 'react-router-dom'
import { PiHouse, PiHouseFill, PiMagnifyingGlass, PiMagnifyingGlassBold, PiReceipt, PiSealPercent, PiSealPercentFill, PiShoppingBag, PiShoppingBagFill } from 'react-icons/pi'
import { cartCount, useCart } from '../lib/cart.js'

const ITEMS = [
  ['/', 'Home', PiHouse, PiHouseFill],
  ['/search', 'Search', PiMagnifyingGlass, PiMagnifyingGlassBold],
  ['/offers', 'Offers', PiSealPercent, PiSealPercentFill],
  ['/orders', 'Orders', PiReceipt, PiReceipt],
  ['/checkout', 'Cart', PiShoppingBag, PiShoppingBagFill],
]

/** Tab bar for phones and small tablets. The header carries these links on desktop. */
export default function MobileNav() {
  const count = cartCount(useCart())
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {ITEMS.map(([to, label, Icon, ActiveIcon]) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={({ isActive }) => `relative flex h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[0.74rem] font-semibold ${isActive ? 'text-leaf' : 'text-soft'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-5 top-0 h-0.5 rounded-b bg-leaf" />}
                  <span className="relative">
                    {isActive ? <ActiveIcon size={22} /> : <Icon size={22} />}
                    {to === '/checkout' && count > 0 && (
                      <span className="num absolute -right-2.5 -top-1.5 grid h-[1.1rem] min-w-[1.1rem] place-items-center rounded-full bg-marigold px-1 text-[0.68rem] font-bold text-on-marigold">{count}</span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
