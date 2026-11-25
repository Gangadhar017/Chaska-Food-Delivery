import { useCallback, useEffect, useRef, useState } from 'react'
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi'
import { SectionHeading } from './bits.jsx'

/** A horizontally scrolling row with a heading and previous / next buttons. */
export default function Rail({ kicker, title, children, itemClassName = '' }) {
  const track = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const node = track.current
    if (!node) return
    setEdges({ start: node.scrollLeft <= 4, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    measure()
    const node = track.current
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [measure, children])

  const scroll = (direction) => {
    const node = track.current
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: 'smooth' })
  }

  const arrow = 'grid size-9 place-items-center rounded-lg border border-line-strong bg-card text-ink transition-colors hover:border-ink disabled:opacity-35 disabled:hover:border-line-strong'

  return (
    <section>
      <SectionHeading kicker={kicker} title={title}>
        <button type="button" className={arrow} onClick={() => scroll(-1)} disabled={edges.start} aria-label={`Scroll ${title} back`}>
          <PiCaretLeft size={16} />
        </button>
        <button type="button" className={arrow} onClick={() => scroll(1)} disabled={edges.end} aria-label={`Scroll ${title} forward`}>
          <PiCaretRight size={16} />
        </button>
      </SectionHeading>
      <ul ref={track} onScroll={measure} className="hide-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {[].concat(children).filter(Boolean).map((child, index) => (
          <li key={child.key ?? index} className={`shrink-0 snap-start ${itemClassName}`}>
            {child}
          </li>
        ))}
      </ul>
    </section>
  )
}
