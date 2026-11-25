import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PiArrowLeft, PiArrowsClockwise, PiCheckBold, PiMoped, PiStar, PiStarFill } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSession } from '../app/session.jsx'
import { AddressIcon } from '../components/AddressForm.jsx'
import Bill from '../components/Bill.jsx'
import { DietMark, LoadError, Notice, Spinner } from '../components/bits.jsx'
import Dialog from '../components/Dialog.jsx'
import OrderMap from '../components/OrderMap.jsx'
import { cart } from '../lib/cart.js'
import { clockTime, dayLabel, lineSummary, rupee } from '../lib/format.js'
import { useOrder, useOrderAction } from '../lib/queries.js'
import { toast, useTitle } from '../lib/ui.js'
import NotFound from './NotFound.jsx'
import { SignInGate } from './Orders.jsx'

function Timeline({ tracking }) {
  return (
    <ol className="grid">
      {tracking.steps.map((step, index) => {
        const last = index === tracking.steps.length - 1
        return (
          <li key={step.key} className="relative flex gap-3.5 pb-5 last:pb-0">
            {!last && <span aria-hidden="true" className={`absolute left-[0.6875rem] top-6 h-[calc(100%-1.25rem)] w-0.5 ${step.done && !step.current ? 'bg-leaf' : 'bg-line'}`} />}
            <span className={`relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 ${step.done ? 'border-leaf bg-leaf text-on-leaf' : 'border-line-strong bg-card'}`}>
              {step.done && !step.current && <PiCheckBold size={11} />}
              {step.current && tracking.active && <span className="size-2 rounded-full bg-on-leaf" />}
              {step.current && !tracking.active && <PiCheckBold size={11} />}
            </span>
            <div className="flex flex-1 items-baseline justify-between gap-3">
              <span className={step.done ? 'font-semibold' : 'text-faint'}>{step.label}</span>
              <span className="num text-sm text-faint">{step.done ? clockTime(step.at) : tracking.active ? `in about ${step.inMinutes} min` : ''}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function RatingBox({ order }) {
  const action = useOrderAction(order.id)
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')

  if (order.rating) {
    return (
      <section className="panel px-5 py-4">
        <p className="kicker mb-2">Your rating</p>
        <p className="flex gap-0.5 text-marigold-deep" aria-label={`${order.rating.stars} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (n <= order.rating.stars ? <PiStarFill key={n} size={22} /> : <PiStar key={n} size={22} className="text-line-strong" />))}
        </p>
        {order.rating.comment && <p className="mt-2 text-soft">&ldquo;{order.rating.comment}&rdquo;</p>}
      </section>
    )
  }

  return (
    <section className="panel px-5 py-4">
      <h2 className="text-[1.25rem]">How was the food?</h2>
      <p className="text-[0.95rem] text-soft">Your rating helps other people decide what to order.</p>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`} onClick={() => setStars(n)} className={`grid size-11 place-items-center rounded-lg transition-colors hover:bg-marigold-tint ${n <= stars ? 'text-marigold-deep' : 'text-line-strong'}`}>
            {n <= stars ? <PiStarFill size={28} /> : <PiStar size={28} />}
          </button>
        ))}
      </div>
      {stars > 0 && (
        <div className="mt-3 grid gap-3">
          <textarea className="field" rows={2} maxLength={300} placeholder="Anything to add? (optional)" aria-label="Comment" value={comment} onChange={(event) => setComment(event.target.value)} />
          <button
            type="button"
            className="btn btn-primary w-fit"
            disabled={action.isPending}
            onClick={() => action.mutate({ action: 'rating', body: { stars, comment } }, { onSuccess: () => toast.success('Thanks for rating your order.'), onError: (error) => toast.error(error.message) })}
          >
            {action.isPending && <Spinner />} Submit rating
          </button>
        </div>
      )}
    </section>
  )
}

function Tracker({ order }) {
  const { tracking } = order
  const { meta } = usePlace()
  const location = useLocation()
  const navigate = useNavigate()
  const action = useOrderAction(order.id)
  const [confirming, setConfirming] = useState(false)
  const delivered = tracking.status === 'delivered'
  const cancelled = tracking.status === 'cancelled'

  function reorder() {
    cart.reorder(order)
    toast('Items added to your cart.')
    navigate('/checkout')
  }

  return (
    <div className="wrap py-6 sm:py-8">
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-soft hover:text-ink"><PiArrowLeft size={15} /> All orders</Link>

      {location.state?.justPlaced && tracking.active && (
        <Notice tone="good" className="mb-5 font-medium">Order placed. {order.outlet.name} has it now, and you can follow it from here.</Notice>
      )}

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:gap-10">
        <div className="grid gap-5">
          <section className="panel overflow-hidden" aria-live="polite">
            <div className="relative border-b border-line">
              <OrderMap order={order} />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-5">
              <div className="min-w-0">
                <p className="kicker mb-1.5">Order <span className="num">{order.number}</span> · {order.outlet.name} · <span className="num">{order.distanceKm} km</span></p>
                <h1 className="text-[1.9rem] sm:text-[2.3rem]">{tracking.headline}</h1>
                <p className="mt-1 text-soft">{tracking.detail}</p>
              </div>
              {tracking.active && (
                <div className="text-right">
                  <p className="num font-display text-[3.2rem] font-semibold leading-none text-leaf">{tracking.etaMinutes}</p>
                  <p className="kicker mt-1">{tracking.etaMinutes === 1 ? 'minute away' : 'minutes away'}</p>
                </div>
              )}
            </div>
            {tracking.active && (
              <div className="h-1.5 bg-sunken" role="progressbar" aria-label="Delivery progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tracking.progress * 100)}>
                <div className="h-full bg-leaf transition-[width] duration-[2000ms] ease-linear" style={{ width: `${tracking.progress * 100}%` }} />
              </div>
            )}
          </section>

          {tracking.active && meta && meta.secondsPerMinute < 60 && (
            <p className="-mt-2 text-sm text-faint">Demo clock: each minute shown here passes in {meta.secondsPerMinute} seconds, so you can watch a whole delivery in a couple of minutes.</p>
          )}

          {tracking.riderAssigned && !delivered && (
            <section className="panel flex items-center gap-4 px-5 py-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-leaf-tint text-leaf"><PiMoped size={24} /></span>
              <div className="min-w-0 flex-1">
                <p className="kicker mb-0.5">Your delivery partner</p>
                <p className="font-semibold">{order.rider.name}</p>
                <p className="num text-sm text-soft">{order.rider.vehicle} · {order.rider.deliveries.toLocaleString('en-IN')} deliveries</p>
              </div>
              <span className="num inline-flex items-center gap-1 rounded-md bg-sunken px-2 py-1 text-sm font-bold"><PiStarFill size={12} className="text-marigold-deep" /> {order.rider.rating.toFixed(1)}</span>
            </section>
          )}

          {delivered && <RatingBox order={order} />}
          {cancelled && order.payment.status === 'refunded' && <Notice tone="warn">Your payment of {rupee(order.bill.total)} is on its way back to you.</Notice>}

          <section className="panel px-5 py-5">
            <h2 className="mb-4 text-[1.25rem]">Progress</h2>
            <Timeline tracking={tracking} />
          </section>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn btn-outline" onClick={reorder}><PiArrowsClockwise size={16} /> Order this again</button>
            {tracking.cancellable && <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>Cancel order</button>}
            <Link to="/help" className="btn btn-quiet">Need help?</Link>
          </div>
        </div>

        <aside aria-label="Order details" className="grid gap-5">
          <section className="panel px-5 py-4">
            <p className="kicker mb-3">Delivering to</p>
            <div className="flex items-start gap-3">
              <AddressIcon label={order.address.label} size={20} className="mt-0.5 shrink-0 text-leaf" />
              <p className="text-[0.97rem] leading-snug">
                <span className="font-semibold">{order.address.label}</span><br />
                <span className="text-soft">{order.address.line1}{order.address.landmark ? `, ${order.address.landmark}` : ''}<br />{order.address.localityName}, {order.address.cityName}</span>
              </p>
            </div>
            {order.noContact && <p className="mt-3 text-sm text-soft">No-contact delivery: the order will be left at your door.</p>}
            {order.instructions && <p className="mt-3 border-t border-dashed border-line pt-3 text-sm text-soft">Note for the kitchen: &ldquo;{order.instructions}&rdquo;</p>}
          </section>

          <section className="panel px-5 py-4">
            <p className="kicker mb-1">Items · {dayLabel(order.placedAt)}</p>
            <ul className="divide-y divide-line">
              {order.lines.map((line) => (
                <li key={line.key} className="flex items-start gap-3 py-3">
                  <DietMark diet={line.diet} className="mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug"><span className="num font-semibold">{line.quantity} ×</span> {line.name}</p>
                    {lineSummary(line) && <p className="text-sm leading-snug text-faint">{lineSummary(line)}</p>}
                  </div>
                  <span className="num font-semibold">{rupee(line.total)}</span>
                </li>
              ))}
            </ul>
          </section>

          <div>
            <Bill bill={order.bill} couponCode={order.couponCode} paid />
            <p className="mt-4 text-center text-sm text-soft">
              {order.payment.label} · {{ paid: 'Paid', due: 'Pay on delivery', refunded: 'Refunded', void: 'Nothing was charged' }[order.payment.status]}
            </p>
          </div>
        </aside>
      </div>

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        kicker={order.number}
        title="Cancel this order?"
        width="26rem"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)}>Keep it</button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={action.isPending}
              onClick={() =>
                action.mutate(
                  { action: 'cancel' },
                  {
                    onSuccess: () => { setConfirming(false); toast('Your order has been cancelled.') },
                    onError: (error) => { setConfirming(false); toast.error(error.message) },
                  },
                )
              }
            >
              {action.isPending && <Spinner />} Cancel order
            </button>
          </div>
        }
      >
        <p className="px-5 py-5 text-soft">
          The kitchen has not started yet, so you can cancel without a charge.
          {order.payment.status === 'paid' ? ` ${rupee(order.bill.total)} will be refunded.` : ''}
        </p>
      </Dialog>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user, status } = useSession()
  const order = useOrder(user ? id : null)
  useTitle(order.data ? `Order ${order.data.number}` : 'Order')

  if (status === 'checking') return <div className="wrap py-10"><div className="skeleton h-72 w-full rounded-xl" /></div>
  if (!user) return <SignInGate title="Track your order">Sign in to see this order.</SignInGate>
  if (order.error?.status === 404) return <NotFound />
  if (order.isError) return <div className="wrap"><LoadError error={order.error} onRetry={order.refetch} /></div>
  if (!order.data) return <div className="wrap py-10" aria-busy="true"><div className="skeleton h-72 w-full rounded-xl" /><div className="skeleton mt-5 h-40 w-full rounded-xl" /></div>

  return <Tracker order={order.data} />
}
