import { Link, useLocation } from 'react-router-dom'
import { PiArrowRight, PiShoppingBagFill } from 'react-icons/pi'
import { cartCount, cartSubtotal, useCart } from '../lib/cart.js'
import { plural, rupee } from '../lib/format.js'

/** On phones, a bar above the tab bar that keeps the cart one tap away. */
export default function CartBar() {
  const state = useCart()
  const { pathname } = useLocation()
  const count = cartCount(state)
  if (!count || pathname === '/checkout' || pathname.startsWith('/orders/')) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2 lg:hidden">
      <Link to="/checkout" className="mx-auto flex max-w-lg animate-rise items-center gap-3 rounded-xl bg-leaf px-4 py-3 text-on-leaf">
        <PiShoppingBagFill size={20} className="shrink-0" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="num block font-bold">{plural(count, 'item')} · {rupee(cartSubtotal(state))}</span>
          <span className="block truncate text-[0.82rem] opacity-80">from {state.outlet.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 font-bold">View cart <PiArrowRight size={16} /></span>
      </Link>
    </div>
  )
}
