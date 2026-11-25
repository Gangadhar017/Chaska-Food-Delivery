import { rupee } from '../lib/format.js'

function Row({ label, hint, children, strong = false }) {
  return (
    <div className={`flex items-baseline ${strong ? 'text-[1.08rem] font-bold' : 'text-[0.97rem]'}`}>
      <span>
        {label}
        {hint && <span className="ml-1.5 text-[0.82rem] font-normal text-faint">{hint}</span>}
      </span>
      <span className="leader" aria-hidden="true" />
      <span className="num">{children}</span>
    </div>
  )
}

/** The bill, laid out like a till receipt. Works for a live quote and for a placed order. */
export default function Bill({ bill, couponCode, paid = false }) {
  return (
    <div className="receipt">
      <p className="kicker mb-3 text-center">Bill details</p>
      <div className="grid gap-2">
        <Row label="Item total">{rupee(bill.itemTotal)}</Row>
        {bill.discount > 0 && (
          <Row label="Coupon" hint={couponCode || undefined}>
            <span className="font-semibold text-leaf">− {rupee(bill.discount)}</span>
          </Row>
        )}
        <Row label="Delivery fee">
          {bill.deliveryFee === 0 ? (
            <>
              {bill.deliveryWaived > 0 && <s className="mr-1.5 text-faint">{rupee(bill.deliveryWaived)}</s>}
              <span className="font-semibold text-leaf">Free</span>
            </>
          ) : (
            rupee(bill.deliveryFee)
          )}
        </Row>
        <Row label="Restaurant packaging">{rupee(bill.packaging)}</Row>
        <Row label="Platform fee">{rupee(bill.platformFee)}</Row>
        <Row label="GST" hint="5%">{rupee(bill.taxes)}</Row>
        {bill.tip > 0 && <Row label="Tip for your rider">{rupee(bill.tip)}</Row>}
        {bill.roundOff !== 0 && <Row label="Round off">{bill.roundOff > 0 ? '+ ' : '− '}{rupee(Math.abs(bill.roundOff))}</Row>}
      </div>
      <div className="my-3 border-t border-dashed border-line-strong" />
      <Row label={paid ? 'Total' : 'To pay'} strong>{rupee(bill.total)}</Row>
      {bill.savings > 0 && (
        <p className="mt-3 rounded-md bg-leaf-tint px-3 py-1.5 text-center text-[0.92rem] font-semibold text-leaf">
          You {paid ? 'saved' : 'save'} {rupee(bill.savings)} on this order
        </p>
      )}
    </div>
  )
}
