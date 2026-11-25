import { useEffect, useRef } from 'react'
import { PiX } from 'react-icons/pi'

/**
 * A modal built on the native <dialog> element, which gives us focus trapping,
 * Escape to close and the top layer for free. Centred on desktop, a bottom sheet on phones.
 */
export default function Dialog({ open, onClose, title, kicker, width, children, footer, bare = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={ref}
      className="dialog"
      style={width ? { '--dialog-width': width } : undefined}
      aria-label={typeof title === 'string' ? title : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={(event) => {
        // A press on the backdrop lands on the dialog element itself.
        if (event.target === ref.current) onClose()
      }}
    >
      {!bare && (
        <header className="flex items-start gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {kicker && <p className="kicker mb-1">{kicker}</p>}
            <h2 className="text-[1.35rem]">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 -mt-0.5 grid size-9 shrink-0 place-items-center rounded-md text-soft hover:bg-sunken hover:text-ink">
            <PiX size={20} />
          </button>
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <footer className="border-t border-line bg-card px-5 py-3.5">{footer}</footer>}
    </dialog>
  )
}
