import { useState } from 'react'
import { PiBriefcase, PiHouse, PiMapPin } from 'react-icons/pi'
import { usePlace } from '../app/place.jsx'
import { useSaveAddress } from '../lib/queries.js'
import { toast } from '../lib/ui.js'
import { Notice, Spinner } from './bits.jsx'

const LABELS = [['Home', PiHouse], ['Work', PiBriefcase], ['Other', PiMapPin]]
const ICONS = Object.fromEntries(LABELS)

/** The little icon that goes with an address label. Exported from here with the form that sets the label. */
export function AddressIcon({ label, size = 18, className = '' }) {
  const Icon = ICONS[label] || PiMapPin
  return <Icon size={size} className={className} />
}

/** Add or edit a saved address. `preferCityId` lists that city's areas first. */
export default function AddressForm({ address, preferCityId, onSaved, onCancel }) {
  const { cities, localityId } = usePlace()
  const save = useSaveAddress()
  const [label, setLabel] = useState(address?.label || 'Home')

  const ordered = [...cities].sort((a, b) => (b.id === preferCityId) - (a.id === preferCityId))
  const fallbackLocality = ordered[0]?.localities.some((l) => l.id === localityId) ? localityId : ordered[0]?.localities[0].id
  const field = save.error?.details?.field

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    save.mutate(
      { id: address?.id, label, line1: form.get('line1'), landmark: form.get('landmark'), localityId: form.get('localityId') },
      {
        onSuccess: (data) => {
          toast.success(address ? 'Address updated.' : 'Address saved.')
          onSaved?.(data.address)
        },
      },
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-3.5" noValidate>
      <div>
        <p className="label">Save as</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Address type">
          {LABELS.map(([name, Icon]) => (
            <button key={name} type="button" role="radio" aria-checked={label === name} onClick={() => setLabel(name)} className="chip">
              <Icon size={15} /> {name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address-locality">Area</label>
        <select id="address-locality" name="localityId" className="field" defaultValue={address?.localityId || fallbackLocality}>
          {ordered.map((city) => (
            <optgroup key={city.id} label={city.name}>
              {city.localities.map((locality) => <option key={locality.id} value={locality.id}>{locality.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="address-line1">Flat, house or building</label>
        <input id="address-line1" name="line1" className="field" defaultValue={address?.line1} autoComplete="address-line1" required aria-invalid={field === 'Flat, house or building' ? 'true' : undefined} />
      </div>
      <div>
        <label className="label" htmlFor="address-landmark">Landmark <span className="font-normal text-faint">(optional)</span></label>
        <input id="address-landmark" name="landmark" className="field" defaultValue={address?.landmark} autoComplete="address-line2" />
      </div>
      {save.error && <Notice tone="bad"><span role="alert">{save.error.message}</span></Notice>}
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={save.isPending}>
          {save.isPending && <Spinner />} {address ? 'Save changes' : 'Save address'}
        </button>
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}
