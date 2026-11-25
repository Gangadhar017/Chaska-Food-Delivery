import { PiCheckBold, PiCopy } from 'react-icons/pi'
import { useState } from 'react'

/** The Clipboard API needs HTTPS. On a plain http page, fall back to copying from a hidden field. */
async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(field)
  field.select()
  const copied = document.execCommand('copy')
  field.remove()
  if (!copied) throw new Error('Copy is not available')
}

function stubLabel(coupon) {
  if (coupon.type === 'percent') return [`${coupon.value}%`, 'off']
  if (coupon.type === 'flat') return [`₹${coupon.value}`, 'off']
  return ['Free', 'delivery']
}

/**
 * A coupon drawn as a paper ticket.
 * Pass `onApply` to get an Apply button (checkout); otherwise the code can be copied.
 * `cut` is the colour behind the ticket, so the punched notches match the surface.
 */
export default function CouponTicket({ coupon, onApply, applied = false, disabledReason, cut }) {
  const [copied, setCopied] = useState(false)
  const [big, small] = stubLabel(coupon)

  async function copy() {
    try {
      await copyText(coupon.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="ticket h-full" style={cut ? { '--ticket-cut': cut } : undefined}>
      <div className="ticket-stub px-1 py-3 text-center">
        <p className="leading-none">
          <span className="num block font-display text-[1.3rem] font-semibold">{big}</span>
          <span className="kicker mt-1 block text-ink">{small}</span>
        </p>
      </div>
      <div className="flex min-w-0 flex-col gap-1.5 px-4 py-3">
        <p className="font-semibold leading-snug">{coupon.title}</p>
        <p className="text-sm leading-snug text-soft">{coupon.detail}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <code className="num rounded border border-dashed border-line-strong px-2 py-0.5 font-sans text-[0.82rem] font-bold tracking-[0.08em]">{coupon.code}</code>
          {onApply ? (
            applied ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-leaf"><PiCheckBold size={13} /> Applied</span>
            ) : (
              <button type="button" onClick={() => onApply(coupon.code)} disabled={Boolean(disabledReason)} title={disabledReason || undefined} className="btn btn-quiet btn-sm -mr-2 uppercase tracking-wide">
                Apply
              </button>
            )
          ) : (
            <button type="button" onClick={copy} className="btn btn-quiet btn-sm -mr-2" aria-label={`Copy code ${coupon.code}`}>
              {copied ? <PiCheckBold size={14} /> : <PiCopy size={15} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        {onApply && disabledReason && !applied && <p className="text-[0.82rem] leading-snug text-faint">{disabledReason}</p>}
      </div>
    </article>
  )
}
