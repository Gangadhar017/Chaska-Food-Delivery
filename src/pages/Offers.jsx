import CouponTicket from '../components/CouponTicket.jsx'
import Listing from '../components/Listing.jsx'
import { useCoupons } from '../lib/queries.js'
import { useTitle } from '../lib/ui.js'

export default function Offers() {
  useTitle('Offers and coupons')
  const coupons = useCoupons()

  return (
    <>
      <section className="bg-band text-on-band">
        <div className="wrap py-9 sm:py-12">
          <p className="kicker mb-3 text-band-soft">Offers and coupons</p>
          <h1 className="max-w-2xl text-[2.3rem] sm:text-[3.2rem]">Eat well, pay a <em className="font-medium text-marigold">little less</em></h1>
          <p className="mt-3 max-w-xl text-[1.05rem] text-band-soft">Copy a code and enter it at checkout. One coupon per order, and the bill shows exactly what it took off.</p>
        </div>
      </section>

      <div className="wrap grid grid-cols-[minmax(0,1fr)] gap-14 pt-10">
        <section aria-label="Coupons">
          <p className="kicker mb-4">Works at every restaurant</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.isPending
              ? Array.from({ length: 5 }, (_, index) => <li key={index} className="skeleton h-32 rounded-xl" />)
              : (coupons.data?.items || []).map((coupon) => <li key={coupon.code}><CouponTicket coupon={coupon} /></li>)}
          </ul>
        </section>

        <Listing title="Restaurants with their own deals" fixed={{ offers: '1' }} />
      </div>
    </>
  )
}
