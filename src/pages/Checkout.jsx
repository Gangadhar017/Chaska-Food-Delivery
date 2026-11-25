import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PiCheckBold, PiCreditCard, PiHandCoins, PiMoney, PiPlus, PiQrCode, PiShoppingBag, PiTag, PiWallet, PiX } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSession } from '../app/session.jsx'
import AddressForm, { AddressIcon } from '../components/AddressForm.jsx'
import AuthForm from '../components/AuthForm.jsx'
import Bill from '../components/Bill.jsx'
import { DietMark, EmptyState, LoadError, Notice, Spinner, Stepper } from '../components/bits.jsx'
import CouponTicket from '../components/CouponTicket.jsx'
import Dialog from '../components/Dialog.jsx'
import { cart, cartPayload, useCart } from '../lib/cart.js'
import { lineSummary, rupee } from '../lib/format.js'
import { useAddresses, useCoupons, usePlaceOrder, useQuote } from '../lib/queries.js'
import { toast, useTitle } from '../lib/ui.js'

const PAYMENTS = [
  ['upi', 'UPI', 'Pay with any UPI app', PiQrCode],
  ['card', 'Credit or debit card', 'Visa, Mastercard, RuPay', PiCreditCard],
  ['wallet', 'Wallet', 'Use your Chaska balance', PiWallet],
  ['cod', 'Cash on delivery', 'Pay the rider in cash or by UPI', PiMoney],
]
const TIPS = [0, 20, 30, 50]

function Step({ number, title, done, summary, children }) {
  return (
    <section className="panel">
      <header className="flex items-center gap-3.5 px-5 py-4">
        <span className={`num grid size-8 shrink-0 place-items-center rounded-full text-[0.95rem] font-bold ${done ? 'bg-leaf text-on-leaf' : 'bg-sunken text-soft'}`}>
          {done ? <PiCheckBold size={14} /> : number}
        </span>
        <div className="min-w-0">
          <h2 className="text-[1.3rem]">{title}</h2>
          {summary && <p className="truncate text-[0.95rem] text-soft">{summary}</p>}
        </div>
      </header>
      {children && <div className="border-t border-line px-5 py-5">{children}</div>}
    </section>
  )
}

function AddressStep({ outlet, selectedId, onSelect }) {
  const { cities } = usePlace()
  const addresses = useAddresses()
  const [adding, setAdding] = useState(false)
  const list = addresses.data || []
  const cityOf = (address) => cities.find((city) => city.localities.some((l) => l.id === address.localityId))

  // Pick the first address this restaurant can reach, once the list is in.
  useEffect(() => {
    if (!addresses.data || selectedId) return
    const reachable = addresses.data.find((address) => cityOf(address)?.id === outlet.cityId)
    if (reachable) onSelect(reachable.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.data, selectedId, outlet.cityId])

  if (addresses.isPending) return <div className="skeleton h-20 w-full" />
  if (addresses.isError) return <LoadError error={addresses.error} onRetry={addresses.refetch} />

  return (
    <div className="grid gap-3">
      {list.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery address">
          {list.map((address) => {
            const reachable = cityOf(address)?.id === outlet.cityId
            const selected = address.id === selectedId
            return (
              <li key={address.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!reachable}
                  onClick={() => onSelect(address.id)}
                  className={`flex h-full w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${selected ? 'border-leaf bg-leaf-tint' : 'border-line hover:border-ink'} ${reachable ? '' : 'opacity-55 hover:border-line'}`}
                >
                  <AddressIcon label={address.label} size={20} className={`mt-0.5 shrink-0 ${selected ? 'text-leaf' : 'text-soft'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">{address.label}{selected && <span className="tag tag-leaf bg-card">Deliver here</span>}</span>
                    <span className="mt-0.5 block text-[0.95rem] leading-snug text-soft">{address.line1}{address.landmark ? `, ${address.landmark}` : ''}</span>
                    <span className="block text-[0.95rem] text-soft">{address.localityName}, {address.cityName}</span>
                    {!reachable && <span className="mt-1 block text-sm font-semibold text-chili">{outlet.name} does not deliver to {address.cityName}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {adding || list.length === 0 ? (
        <div className="rounded-lg border border-line bg-paper px-4 py-4">
          <p className="mb-3 font-display text-lg font-semibold">New address</p>
          <AddressForm preferCityId={outlet.cityId} onCancel={list.length ? () => setAdding(false) : undefined} onSaved={(address) => { setAdding(false); onSelect(address.id) }} />
        </div>
      ) : (
        <button type="button" className="btn btn-outline w-fit" onClick={() => setAdding(true)}><PiPlus size={16} /> Add a new address</button>
      )}
    </div>
  )
}

function CouponBox({ outletId, quote }) {
  const state = useCart()
  const coupons = useCoupons(outletId)
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const applied = quote?.coupon.applied ? quote.coupon : null
  const rejected = quote?.coupon.code && !quote.coupon.applied ? quote.coupon : null

  function apply(value) {
    const clean = String(value).trim().toUpperCase()
    if (!clean) return
    cart.setCoupon(clean)
    setCode('')
    setOpen(false)
  }

  return (
    <div>
      {applied ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-leaf bg-leaf-tint px-3.5 py-3">
          <PiTag size={20} className="shrink-0 text-leaf" />
          <div className="min-w-0 flex-1">
            <p className="num font-bold tracking-wide text-leaf">{applied.code}</p>
            <p className="text-[0.93rem] text-soft">{applied.message}</p>
          </div>
          <button type="button" onClick={() => cart.setCoupon('')} className="btn btn-quiet btn-sm">Remove</button>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-left hover:border-ink">
          <PiTag size={20} className="shrink-0 text-leaf" />
          <span className="flex-1 font-semibold">Apply a coupon</span>
          <span className="text-sm text-faint">{coupons.data ? `${coupons.data.items.length} available` : ''}</span>
        </button>
      )}
      {rejected && (
        <Notice tone="warn" className="mt-2 flex items-start justify-between gap-3">
          <span><strong className="num font-semibold">{rejected.code}</strong>: {rejected.message}</span>
          <button type="button" aria-label="Remove coupon" onClick={() => cart.setCoupon('')} className="shrink-0"><PiX size={15} /></button>
        </Notice>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} kicker="Offers" title="Apply a coupon" width="30rem">
        <div className="px-5 py-5" style={{ '--ticket-cut': 'var(--card)' }}>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); apply(code) }}>
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter coupon code" aria-label="Coupon code" className="field num flex-1 uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal" autoCapitalize="characters" />
            <button type="submit" className="btn btn-primary" disabled={!code.trim()}>Apply</button>
          </form>
          <p className="kicker mb-3 mt-6">Available on this order</p>
          <ul className="grid gap-3">
            {(coupons.data?.items || []).map((coupon) => {
              const short = quote ? coupon.min - quote.bill.itemTotal : 0
              return (
                <li key={coupon.code}>
                  <CouponTicket coupon={coupon} onApply={apply} applied={state.couponCode === coupon.code && Boolean(applied)} disabledReason={short > 0 ? `Add ${rupee(short)} more to use this.` : undefined} cut="var(--card)" />
                </li>
              )
            })}
          </ul>
        </div>
      </Dialog>
    </div>
  )
}

function Summary({ state, quote, loading }) {
  const [custom, setCustom] = useState(false)
  // Until the first quote arrives, show the cart as the browser knows it.
  const lines = quote?.lines || state.lines.map((line) => ({ ...line, total: line.unitPrice * line.quantity, available: true }))

  return (
    <div className="grid gap-5">
      <div className="panel overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="kicker mb-0.5">Your order from</p>
            <Link to={`/restaurant/${state.outlet.id}`} className="block truncate font-display text-xl font-semibold hover:underline">{state.outlet.name}</Link>
            <p className="truncate text-sm text-faint">{state.outlet.localityName}{quote ? ` · ${quote.outlet.etaMinutes} min` : ''}</p>
          </div>
          <Link to={`/restaurant/${state.outlet.id}`} className="btn btn-quiet btn-sm shrink-0"><PiPlus size={14} /> Add items</Link>
        </div>

        <ul className="divide-y divide-line px-5">
          {lines.map((line) => (
            <li key={line.key} className={`flex items-start gap-3 py-3.5 ${line.available ? '' : 'opacity-60'}`}>
              <DietMark diet={line.diet} className="mt-1" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{line.name}</p>
                {lineSummary(line) && <p className="text-sm leading-snug text-faint">{lineSummary(line)}</p>}
                {line.available ? (
                  <p className="num mt-0.5 text-[0.93rem] text-soft">{rupee(line.unitPrice)} each</p>
                ) : (
                  <p className="mt-0.5 text-sm font-semibold text-chili">Sold out. <button type="button" className="underline" onClick={() => cart.remove(line.key)}>Remove</button></p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Stepper compact value={line.quantity} onMinus={() => cart.decrement(line.key)} onPlus={() => cart.increment(line.key)} label={`${line.name} quantity`} />
                <span className="num text-[0.95rem] font-semibold">{rupee(line.total)}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="grid gap-3 border-t border-line px-5 py-4">
          <label className="block">
            <span className="sr-only">Cooking instructions</span>
            <textarea rows={2} className="field text-[0.97rem]" maxLength={200} placeholder="Any instructions for the kitchen? Less spicy, no onion…" value={state.instructions} onChange={(event) => cart.setInstructions(event.target.value)} />
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 size-4 accent-[var(--leaf)]" checked={state.noContact} onChange={(event) => cart.setNoContact(event.target.checked)} />
            <span className="text-[0.97rem]"><span className="font-semibold">No-contact delivery.</span> <span className="text-soft">The rider leaves the order at your door.</span></span>
          </label>
        </div>
      </div>

      <CouponBox outletId={state.outlet.id} quote={quote} />

      <div>
        <p className="mb-2 flex items-center gap-2 font-semibold"><PiHandCoins size={19} className="text-leaf" /> Tip your rider</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tip amount">
          {TIPS.map((amount) => (
            <button key={amount} type="button" role="radio" aria-checked={!custom && state.tip === amount} className="chip num" onClick={() => { setCustom(false); cart.setTip(amount) }}>
              {amount === 0 ? 'Not now' : rupee(amount)}
            </button>
          ))}
          {custom ? (
            <input type="number" min="0" max="500" inputMode="numeric" autoFocus aria-label="Custom tip in rupees" className="field num h-9 w-24" value={state.tip || ''} onChange={(event) => cart.setTip(Math.min(500, Number(event.target.value)))} />
          ) : (
            <button type="button" role="radio" aria-checked={!TIPS.includes(state.tip)} className="chip" onClick={() => setCustom(true)}>{TIPS.includes(state.tip) ? 'Other' : rupee(state.tip)}</button>
          )}
        </div>
        <p className="mt-1.5 text-sm text-faint">All of it goes to the person bringing your food.</p>
      </div>

      {quote ? (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <Bill bill={quote.bill} couponCode={quote.coupon.applied ? quote.coupon.code : null} />
          {quote.bill.deliveryFee > 0 && quote.bill.itemTotal < quote.bill.freeDeliveryAbove && (
            <p className="mt-4 text-center text-sm text-soft">Add {rupee(quote.bill.freeDeliveryAbove - quote.bill.itemTotal)} more for free delivery.</p>
          )}
        </div>
      ) : (
        <div className="skeleton h-64 w-full rounded-xl" />
      )}
    </div>
  )
}

export default function Checkout() {
  useTitle('Checkout')
  const navigate = useNavigate()
  const state = useCart()
  const { localityId } = usePlace()
  const { user, status } = useSession()
  const [addressId, setAddressId] = useState(null)
  const [payment, setPayment] = useState('upi')
  const placeOrder = usePlaceOrder()

  const payload = useMemo(
    () => (state.outlet ? { outletId: state.outlet.id, localityId, addressId: user ? addressId : null, lines: cartPayload(state), couponCode: state.couponCode, tip: state.tip } : null),
    [state, localityId, addressId, user],
  )
  const quoteQuery = useQuote(payload)
  const quote = quoteQuery.data

  // Lines the server no longer recognises are dropped from the saved cart.
  useEffect(() => {
    if (!quote?.removed.length) return
    const gone = new Set(quote.removed.map((entry) => entry.dishId))
    const keys = cart.get().lines.filter((line) => gone.has(line.dishId)).map((line) => line.key)
    if (keys.length) {
      cart.remove(keys)
      toast('Some items are no longer on the menu and were removed from your cart.')
    }
  }, [quote?.removed])

  if (!state.lines.length) {
    return (
      <div className="wrap py-10">
        <EmptyState icon={PiShoppingBag} title="Your cart is empty" action="Find something to eat" to="/">
          Good food is a couple of taps away. Add dishes from a restaurant and come back here to check out.
        </EmptyState>
      </div>
    )
  }

  const ready = Boolean(user && addressId && quote?.canCheckout && !quoteQuery.isPlaceholderData)
  const waitingOn = !user ? 'Sign in to place your order' : !addressId ? 'Choose a delivery address' : quote && !quote.canCheckout ? quote.blocker : null

  function submit() {
    placeOrder.mutate(
      { ...payload, paymentMethod: payment, instructions: state.instructions, noContact: state.noContact, expectedTotal: quote.bill.total },
      {
        onSuccess: ({ order }) => {
          cart.clear()
          navigate(`/orders/${order.id}`, { state: { justPlaced: true } })
        },
        onError: (error) => {
          toast.error(error.message)
          quoteQuery.refetch()
        },
      },
    )
  }

  return (
    <div className="wrap py-7 sm:py-9">
      <p className="kicker mb-1.5">Checkout</p>
      <h1 className="mb-7 text-[2rem] sm:text-[2.4rem]">Almost there</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start xl:gap-12">
        <div className="grid gap-4">
          <Step number={1} title="Account" done={Boolean(user)} summary={user ? `${user.name} · ${user.email}` : 'Sign in or create an account to place your order'}>
            {!user && (status === 'checking' ? <div className="skeleton h-24 w-full" /> : <div className="max-w-md"><AuthForm /></div>)}
          </Step>

          <Step number={2} title="Delivery address" done={Boolean(user && addressId)} summary={user ? undefined : 'Sign in to see your saved addresses'}>
            {user && <AddressStep outlet={{ ...state.outlet, cityId: quote?.outlet.cityId || state.outlet.cityId }} selectedId={addressId} onSelect={setAddressId} />}
          </Step>

          <Step number={3} title="Payment" done={false}>
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {PAYMENTS.map(([key, label, hint, Icon]) => (
                <button key={key} type="button" role="radio" aria-checked={payment === key} onClick={() => setPayment(key)} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${payment === key ? 'border-leaf bg-leaf-tint' : 'border-line hover:border-ink'}`}>
                  <Icon size={22} className={payment === key ? 'text-leaf' : 'text-soft'} />
                  <span>
                    <span className="block font-semibold leading-tight">{label}</span>
                    <span className="block text-sm text-soft">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <Notice className="mt-4">This is a demo checkout. No payment details are asked for, nothing is charged and no food is dispatched.</Notice>
          </Step>
        </div>

        <aside aria-label="Order summary">
          {quoteQuery.isError && !quote ? <LoadError error={quoteQuery.error} onRetry={quoteQuery.refetch} /> : <Summary state={state} quote={quote} loading={quoteQuery.isPlaceholderData} />}

          <div className="mt-6">
            {waitingOn && <p className="mb-2.5 text-center text-[0.95rem] font-medium text-soft" role="status">{waitingOn}</p>}
            <button type="button" className="btn btn-accent btn-lg w-full" disabled={!ready || placeOrder.isPending} onClick={submit}>
              {placeOrder.isPending ? <><Spinner /> Placing your order…</> : <>Place order{quote ? <span className="num"> · {rupee(quote.bill.total)}</span> : null}</>}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
