import { useEffect, useState } from 'react'
import { PiCheckBold, PiMapPin } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { toast } from '../lib/ui.js'
import Dialog from './Dialog.jsx'

export default function LocationPicker({ open, onClose }) {
  const { cities, city, localityId, setLocality } = usePlace()
  const [cityId, setCityId] = useState(city?.id)

  useEffect(() => {
    if (open) setCityId(city?.id)
  }, [open, city?.id])

  const shown = cities.find((entry) => entry.id === cityId) || cities[0]

  function pick(locality) {
    setLocality(locality.id)
    onClose()
    if (locality.id !== localityId) toast(`Delivering to ${locality.name}, ${shown.name}`)
  }

  return (
    <Dialog open={open} onClose={onClose} kicker="Delivery location" title="Where should we bring it?" width="34rem">
      <div className="px-5 py-4">
        <p className="label">City</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="City">
          {cities.map((entry) => (
            <button key={entry.id} type="button" role="radio" aria-checked={entry.id === shown?.id} onClick={() => setCityId(entry.id)} className="chip">
              {entry.name}
            </button>
          ))}
        </div>

        <p className="label mt-5">Area in {shown?.name}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {shown?.localities.map((locality) => {
            const current = locality.id === localityId
            return (
              <li key={locality.id}>
                <button
                  type="button"
                  onClick={() => pick(locality)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${current ? 'border-leaf bg-leaf-tint' : 'border-line bg-card hover:border-ink'}`}
                >
                  <PiMapPin size={18} className={current ? 'text-leaf' : 'text-faint'} />
                  <span className="flex-1 font-medium">{locality.name}</span>
                  {current && <PiCheckBold size={14} className="text-leaf" />}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-sm text-faint">Restaurants, delivery times and fees are worked out from the area you pick.</p>
      </div>
    </Dialog>
  )
}
