import { Link } from 'react-router-dom'
import { PiCaretDown } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { backendMode } from '../lib/api.js'
import { useTitle } from '../lib/ui.js'

export default function Help() {
  useTitle('Help')
  const { meta } = usePlace()
  const seconds = meta?.secondsPerMinute || 4

  const groups = [
    ['Ordering', [
      ['Can I order from two restaurants at once?', 'A cart holds food from one restaurant, because one rider collects it from one kitchen. If you add a dish from somewhere else, Chaska asks before it clears your cart.'],
      ['Why does the delivery time change when I change my area?', 'Every restaurant sits at a fixed spot in its city. The time you see is its cooking time plus the ride from there to the area you picked, so a place next door is quicker than one across town.'],
      ['How are delivery fees worked out?', 'The fee starts at ₹25 for the first 2 km and goes up by ₹7 for each kilometre after that, to a maximum of ₹79. Orders with items worth ₹499 or more are delivered free.'],
      ['Something in my cart says "Sold out". What now?', 'The kitchen has run out for the day. Remove that item to carry on with the rest of your order.'],
    ]],
    ['Coupons', [
      ['How do I use a coupon?', 'On the checkout page, choose "Apply a coupon". You can type a code or pick one from the list. The bill shows the discount straight away.'],
      ['Why was my coupon not applied?', 'Each coupon has a minimum order value, and some only work at one restaurant or on your first order. Checkout tells you which rule was not met and how much more you need to add.'],
    ]],
    ['After you order', [
      ['Can I cancel an order?', 'Yes, until the kitchen starts cooking. Open the order and choose "Cancel order". Once it says "Being prepared", it can no longer be cancelled.'],
      ['Why does the delivery finish so quickly?', `Tracking runs on a demo clock so you do not have to wait half an hour to see it work: each minute on screen passes in ${seconds} seconds. A 30 minute delivery plays out in about ${Math.round((30 * seconds) / 60)} minutes.`],
      ['How do I order the same thing again?', 'Go to Orders and choose "Reorder" on any past order. The same dishes, with the same options, go into your cart.'],
    ]],
    ['About this project', [
      ['Is this a real food delivery service?', 'No. Chaska is a portfolio project. The restaurants and menus are made up, no payment is taken and no food is delivered.'],
      ['Where is my data kept?', backendMode === 'server'
        ? 'This build talks to the Chaska API. Your account, addresses and orders are stored in its database, and your password is stored only as a salted hash.'
        : 'This build runs without a server. Your account, addresses and orders are stored in this browser only and never leave it. Clearing site data removes them.'],
      ['Is there an account I can try it with?', 'Yes. On the sign-in form choose "Continue with the demo account". It has two saved addresses in Bengaluru, so you can place an order straight away.'],
    ]],
  ]

  return (
    <div className="wrap py-7 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <p className="kicker mb-1.5">Help</p>
        <h1 className="text-[2rem] sm:text-[2.6rem]">Questions, answered</h1>
        <p className="mt-2 text-soft">
          Looking for an order? You will find it under <Link to="/orders" className="font-semibold text-leaf underline underline-offset-2">Orders</Link>.
        </p>

        <div className="mt-9 grid gap-9">
          {groups.map(([title, items]) => (
            <section key={title}>
              <h2 className="mb-1 border-b-2 border-ink pb-2 text-[1.4rem]">{title}</h2>
              <div className="divide-y divide-line">
                {items.map(([question, answer]) => (
                  <details key={question} className="group py-1">
                    <summary className="flex list-none items-center justify-between gap-4 py-3 text-[1.05rem] font-semibold">
                      {question}
                      <PiCaretDown size={16} className="shrink-0 text-faint transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="max-w-prose pb-4 text-soft">{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
