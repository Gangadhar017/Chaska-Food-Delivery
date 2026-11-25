// Small pieces used all over the app.

import { Link } from 'react-router-dom'
import { PiMinusBold, PiPlusBold, PiStarFill } from 'react-icons/pi'
import { compactCount } from '../lib/format.js'

const DIET = {
  veg: { label: 'Vegetarian', color: 'var(--veg)' },
  nonveg: { label: 'Non-vegetarian', color: 'var(--chili)' },
  egg: { label: 'Contains egg', color: 'var(--egg)' },
}

/** The square veg / non-veg mark every Indian menu carries. */
export function DietMark({ diet, className = '' }) {
  const { label, color } = DIET[diet] || DIET.veg
  return (
    <span role="img" aria-label={label} title={label} className={`inline-grid size-[15px] shrink-0 place-items-center rounded-[3px] border-[1.5px] ${className}`} style={{ borderColor: color }}>
      {diet === 'nonveg' ? (
        <span className="size-0 border-x-[3.5px] border-b-[6px] border-x-transparent" style={{ borderBottomColor: color }} />
      ) : (
        <span className="size-[7px] rounded-full" style={{ background: color }} />
      )}
    </span>
  )
}

export function Rating({ value, count, size = 'md' }) {
  const strong = value >= 4
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`num inline-flex items-center gap-0.5 rounded-[5px] font-bold ${size === 'sm' ? 'px-1 py-px text-[0.78rem]' : 'px-1.5 py-0.5 text-[0.85rem]'} ${strong ? 'bg-leaf text-on-leaf' : 'bg-sunken text-ink'}`}>
        <PiStarFill size={size === 'sm' ? 10 : 11} aria-hidden="true" />
        {value.toFixed(1)}
      </span>
      {count !== undefined && <span className="num text-sm text-faint">{compactCount(count)} ratings</span>}
    </span>
  )
}

/** Minus / count / plus. `compact` is the version that sits on a dish photo. */
export function Stepper({ value, onMinus, onPlus, label = 'quantity', compact = false, max = 20 }) {
  const side = compact ? 'w-9' : 'w-10'
  return (
    <div className={`inline-flex items-stretch overflow-hidden rounded-lg bg-leaf font-bold text-on-leaf ${compact ? 'h-9' : 'h-10'}`} role="group" aria-label={label}>
      <button type="button" onClick={onMinus} aria-label={`Decrease ${label}`} className={`grid ${side} place-items-center hover:bg-leaf-deep`}>
        <PiMinusBold size={13} />
      </button>
      <span className="num grid min-w-6 place-items-center text-[0.95rem]" aria-live="polite">{value}</span>
      <button type="button" onClick={onPlus} disabled={value >= max} aria-label={`Increase ${label}`} className={`grid ${side} place-items-center hover:bg-leaf-deep disabled:opacity-40`}>
        <PiPlusBold size={13} />
      </button>
    </div>
  )
}

export function SectionHeading({ kicker, title, children, as: Tag = 'h2' }) {
  return (
    <div className="mb-5 flex items-end gap-4">
      <div className="min-w-0">
        {kicker && <p className="kicker mb-1.5">{kicker}</p>}
        <Tag className="text-[1.6rem] sm:text-[1.85rem]">{title}</Tag>
      </div>
      <span aria-hidden="true" className="mb-2 hidden h-px flex-1 bg-line sm:block" />
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children, action, to, onAction }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
      {Icon && (
        <span className="mb-5 grid size-16 place-items-center rounded-full border border-line bg-card text-leaf">
          <Icon size={28} />
        </span>
      )}
      <h2 className="text-2xl">{title}</h2>
      {children && <p className="mt-2 text-soft">{children}</p>}
      {action && to && <Link to={to} className="btn btn-primary mt-6">{action}</Link>}
      {action && onAction && <button type="button" onClick={onAction} className="btn btn-primary mt-6">{action}</button>}
    </div>
  )
}

export function Spinner({ className = '' }) {
  return <span role="status" aria-label="Loading" className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />
}

/** An inline error with a retry, for failed loads. */
export function LoadError({ error, onRetry }) {
  return (
    <div role="alert" className="panel mx-auto my-10 flex max-w-lg flex-col items-center gap-3 px-6 py-8 text-center">
      <p className="font-display text-xl font-semibold">That did not load</p>
      <p className="text-soft">{error?.message || 'Something went wrong. Please try again.'}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn btn-outline btn-sm">Try again</button>}
    </div>
  )
}

export function Notice({ tone = 'info', children, className = '' }) {
  const tones = {
    info: 'border-line bg-sunken text-soft',
    good: 'border-transparent bg-leaf-tint text-leaf',
    warn: 'border-transparent bg-marigold-tint text-ink',
    bad: 'border-transparent bg-chili-tint text-chili',
  }
  return <div className={`rounded-lg border px-3.5 py-2.5 text-[0.93rem] leading-snug ${tones[tone]} ${className}`}>{children}</div>
}
