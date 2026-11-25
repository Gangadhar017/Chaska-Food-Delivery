import { Link, useNavigate } from 'react-router-dom'
import { PiArrowsClockwise, PiReceipt, PiStarFill } from 'react-icons/pi'
import { useSession } from '../app/session.jsx'
import AuthForm from '../components/AuthForm.jsx'
import { EmptyState, LoadError } from '../components/bits.jsx'
import Photo from '../components/Photo.jsx'
import { cart } from '../lib/cart.js'
import { dayLabel, rupee } from '../lib/format.js'
import { useOrders } from '../lib/queries.js'
import { toast, useTitle } from '../lib/ui.js'

export function StatusTag({ tracking }) {
  if (tracking.status === 'cancelled') return <span className="tag tag-chili">Cancelled</span>
  if (tracking.status === 'delivered') return <span className="tag tag-leaf">Delivered</span>
  return <span className="tag tag-marigold">{tracking.headline} · {tracking.etaMinutes} min</span>
}

/** Shown on pages that need an account when nobody is signed in. */
export function SignInGate({ title, children }) {
  return (
    <div className="wrap py-10">
      <div className="mx-auto max-w-md">
        <p className="kicker mb-1.5">Your account</p>
        <h1 className="text-[2rem]">{title}</h1>
        <p className="mb-6 mt-2 text-soft">{children}</p>
        <div className="panel px-5 py-5"><AuthForm /></div>
      </div>
    </div>
  )
}

function OrderCard({ order }) {
  const navigate = useNavigate()
  const { tracking } = order
  const items = order.lines.map((line) => `${line.quantity} × ${line.name}`).join(', ')

  return (
    <article className="panel flex flex-col gap-4 px-4 py-4 sm:flex-row sm:px-5">
      <Photo name={order.outlet.cover} label={order.outlet.name} width={220} ratio={0.8} className="hidden aspect-[5/4] w-32 shrink-0 rounded-lg border border-line sm:block" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h2 className="truncate text-[1.25rem]">{order.outlet.name}</h2>
            <p className="text-sm text-faint">{order.outlet.localityName} · <span className="num">{order.number}</span> · {dayLabel(order.placedAt)}</p>
          </div>
          <StatusTag tracking={tracking} />
        </div>
        <p className="clamp-2 mt-2 text-[0.97rem] text-soft">{items}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-line pt-3">
          <p className="num mr-auto font-bold">{rupee(order.bill.total)} <span className="text-sm font-normal text-faint">· {order.payment.label}</span></p>
          {order.rating && (
            <span className="num inline-flex items-center gap-1 text-sm text-soft"><PiStarFill size={13} className="text-marigold-deep" /> You rated {order.rating.stars}</span>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              cart.reorder(order)
              toast('Items added to your cart.')
              navigate('/checkout')
            }}
          >
            <PiArrowsClockwise size={15} /> Reorder
          </button>
          <Link to={`/orders/${order.id}`} className={`btn btn-sm ${tracking.active ? 'btn-primary' : 'btn-outline'}`}>{tracking.active ? 'Track order' : 'View details'}</Link>
        </div>
      </div>
    </article>
  )
}

export default function Orders() {
  useTitle('Your orders')
  const { user, status } = useSession()
  const orders = useOrders(Boolean(user))

  if (status === 'checking') return <div className="wrap py-10"><div className="skeleton h-40 w-full max-w-3xl" /></div>
  if (!user) return <SignInGate title="Your orders">Sign in to see what you have ordered and to follow anything that is on its way.</SignInGate>

  const list = orders.data || []
  const live = list.filter((order) => order.tracking.active)
  const past = list.filter((order) => !order.tracking.active)

  return (
    <div className="wrap py-7 sm:py-9">
      <div className="mx-auto max-w-3xl">
        <p className="kicker mb-1.5">Your account</p>
        <h1 className="mb-7 text-[2rem] sm:text-[2.4rem]">Orders</h1>

        {orders.isError ? (
          <LoadError error={orders.error} onRetry={orders.refetch} />
        ) : orders.isPending ? (
          <div className="grid gap-4" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton h-36 rounded-xl" />)}
          </div>
        ) : list.length === 0 ? (
          <EmptyState icon={PiReceipt} title="No orders yet" action="Browse restaurants" to="/">
            When you place an order it will show up here, along with live tracking.
          </EmptyState>
        ) : (
          <div className="grid gap-9">
            {live.length > 0 && (
              <section>
                <p className="kicker mb-3">On the way</p>
                <div className="grid gap-4">{live.map((order) => <OrderCard key={order.id} order={order} />)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <p className="kicker mb-3">Past orders</p>
                <div className="grid gap-4">{past.map((order) => <OrderCard key={order.id} order={order} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
