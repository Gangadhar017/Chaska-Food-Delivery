import { useMemo } from 'react'
import { seededRandom } from '../../shared/core/util.js'
import { useWide } from '../lib/ui.js'

const W = 800
const H = 360
const COLS = [70, 200, 330, 470, 600, 730]
const ROWS = [60, 140, 220, 300]

/** A street route between the restaurant and the customer, different for every order. */
function buildRoute(seed) {
  const random = seededRandom(`map:${seed}`)
  const pick = (list) => list[Math.floor(random() * list.length)]
  const from = { x: pick(COLS.slice(0, 2)), y: pick(ROWS) }
  let to = { x: pick(COLS.slice(4)), y: pick(ROWS) }
  if (to.y === from.y) to = { ...to, y: ROWS[(ROWS.indexOf(to.y) + 2) % ROWS.length] }
  const midX = pick(COLS.slice(2, 4))
  const points = [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to]

  // A few city blocks, a park and a lake to give the streets something to run between.
  const blocks = Array.from({ length: 9 }, () => ({
    x: pick(COLS) - 40 + random() * 30,
    y: pick(ROWS) - 62 + random() * 10,
    w: 44 + random() * 46,
    h: 26 + random() * 30,
  }))
  const park = { x: pick(COLS.slice(1, 5)) + 18, y: pick(ROWS.slice(0, 3)) + 14, w: 96, h: 52 }
  return { points, blocks, park, from, to }
}

function pointAlong(points, t) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y))
  const total = lengths.reduce((sum, length) => sum + length, 0)
  let remaining = Math.min(1, Math.max(0, t)) * total
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const ratio = lengths[i] ? Math.min(1, remaining / lengths[i]) : 0
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * ratio,
        y: points[i].y + (points[i + 1].y - points[i].y) * ratio,
        done: [...points.slice(0, i + 1), null],
      }
    }
    remaining -= lengths[i]
  }
  return { ...points[0], done: [points[0], null] }
}

const toPath = (points) => points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')

/** The live map on the tracking page: streets, the route, and the rider moving along it. */
export default function OrderMap({ order }) {
  const { tracking } = order
  const { points, blocks, park, from, to } = useMemo(() => buildRoute(order.id), [order.id])
  const rider = pointAlong(points, tracking.riderProgress)
  const travelled = [...rider.done.filter(Boolean), { x: rider.x, y: rider.y }]
  const riding = tracking.status === 'picked_up' || tracking.status === 'arriving'
  const cancelled = tracking.status === 'cancelled'
  // The drawing scales with the page, so on a phone the markers are drawn larger to stay readable.
  const pin = useWide(40) ? 1 : 1.7

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of the delivery route. ${tracking.headline}.`} className="block h-auto w-full">
      <rect width={W} height={H} fill="var(--sunken)" />
      <rect x={park.x} y={park.y} width={park.w} height={park.h} rx="10" fill="var(--leaf-tint)" />
      {blocks.map((block, index) => (
        <rect key={index} x={block.x} y={block.y} width={block.w} height={block.h} rx="4" fill="var(--line)" opacity="0.55" />
      ))}

      <g stroke="var(--card)" strokeLinecap="round">
        {ROWS.map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} strokeWidth="14" />)}
        {COLS.map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} strokeWidth="14" />)}
        <line x1="0" y1="10" x2="270" y2={H} strokeWidth="9" />
        <line x1={W} y1="90" x2="540" y2={H} strokeWidth="9" />
      </g>

      <path d={toPath(points)} fill="none" stroke={cancelled ? 'var(--line-strong)' : 'var(--leaf)'} strokeWidth={5 * pin} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`2 ${11 * pin}`} opacity="0.75" />
      {!cancelled && travelled.length > 1 && (
        <path d={toPath(travelled)} fill="none" stroke="var(--leaf)" strokeWidth={5 * pin} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Restaurant */}
      <g transform={`translate(${from.x} ${from.y}) scale(${pin})`}>
        <rect x="-15" y="-15" width="30" height="30" rx="8" fill="var(--marigold)" stroke="var(--card)" strokeWidth="3" />
        <path d="M-4.5 -7v5.5a2.5 2.5 0 0 0 5 0V-7M-2 -7v14M5 7V-7c-2.4 1.2-3 4-3 7h3" fill="none" stroke="var(--on-marigold)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Home */}
      <g transform={`translate(${to.x} ${to.y}) scale(${pin})`}>
        {tracking.status === 'arriving' && <circle r="16" fill="none" stroke="var(--leaf)" strokeWidth="2" style={{ animation: 'pulse-ring 1.6s ease-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />}
        <circle r="16" fill="var(--leaf)" stroke="var(--card)" strokeWidth="3" />
        <path d="M-7 0L0 -6.5 7 0M-5 -1.5V6.5h10V-1.5" fill="none" stroke="var(--on-leaf)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Rider */}
      {riding && (
        <g style={{ transform: `translate(${rider.x}px, ${rider.y}px) scale(${pin})`, transition: 'transform 2s linear' }}>
          <circle r="13" fill="var(--ink)" stroke="var(--card)" strokeWidth="3" />
          <circle cx="-4.5" cy="3.5" r="2.6" fill="none" stroke="var(--paper)" strokeWidth="1.5" />
          <circle cx="5" cy="3.5" r="2.6" fill="none" stroke="var(--paper)" strokeWidth="1.5" />
          <path d="M-4.5 3.5L-1.5 -2h4l2.5 5.5M1 -2L-0.5 -5h-2.5" fill="none" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}
