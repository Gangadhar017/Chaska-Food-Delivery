import { PiCheckCircleFill, PiInfo, PiWarning, PiX } from 'react-icons/pi'
import { dismissToast, useToasts } from '../lib/ui.js'

const ICONS = { info: PiInfo, success: PiCheckCircleFill, error: PiWarning }

export default function Toaster() {
  const toasts = useToasts()
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((entry) => {
        const Icon = ICONS[entry.tone] || PiInfo
        return (
          <div key={entry.id} role="status" className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-xl bg-ink py-2.5 pl-3.5 pr-2 text-paper">
            <Icon size={19} className={`shrink-0 ${entry.tone === 'error' ? 'text-marigold' : 'text-marigold'}`} />
            <p className="min-w-0 flex-1 text-[0.95rem] leading-snug">{entry.message}</p>
            {entry.action && (
              <button type="button" onClick={() => { entry.action.run(); dismissToast(entry.id) }} className="shrink-0 rounded-md px-2 py-1 text-sm font-bold uppercase tracking-wide text-marigold hover:bg-paper/10">
                {entry.action.label}
              </button>
            )}
            <button type="button" onClick={() => dismissToast(entry.id)} aria-label="Dismiss" className="grid size-8 shrink-0 place-items-center rounded-md text-paper/70 hover:bg-paper/10 hover:text-paper">
              <PiX size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
