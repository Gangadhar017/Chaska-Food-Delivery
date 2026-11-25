import { useState } from 'react'
import { rupee } from '../lib/format.js'
import { DietMark, Stepper } from './bits.jsx'
import Dialog from './Dialog.jsx'

/** Pick a size and add-ons for a dish before it goes in the cart. */
export default function DishCustomizer({ dish, onClose, onAdd }) {
  const variants = dish.custom?.variant
  const groups = dish.custom?.addons || []
  const [variantId, setVariantId] = useState(variants?.options[0].id)
  const [addonIds, setAddonIds] = useState([])
  const [quantity, setQuantity] = useState(1)

  const variant = variants?.options.find((option) => option.id === variantId)
  const chosen = groups.flatMap((group) => group.options.filter((option) => addonIds.includes(option.id)))
  const unit = dish.price + (variant?.price || 0) + chosen.reduce((sum, option) => sum + option.price, 0)

  function toggle(group, option) {
    setAddonIds((current) => {
      if (current.includes(option.id)) return current.filter((id) => id !== option.id)
      const inGroup = group.options.filter((entry) => current.includes(entry.id)).length
      return inGroup >= group.max ? current : [...current, option.id]
    })
  }

  const row = 'flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 transition-colors'

  return (
    <Dialog
      open
      onClose={onClose}
      kicker="Make it yours"
      title={<span className="flex items-center gap-2.5"><DietMark diet={dish.diet} />{dish.name}</span>}
      footer={
        <div className="flex items-center gap-3">
          <Stepper value={quantity} onMinus={() => setQuantity((n) => Math.max(1, n - 1))} onPlus={() => setQuantity((n) => n + 1)} label={`${dish.name} quantity`} />
          <button type="button" className="btn btn-primary flex-1" onClick={() => onAdd({ variantId, addonIds, quantity })}>
            Add to cart <span className="num opacity-80">·</span> <span className="num">{rupee(unit * quantity)}</span>
          </button>
        </div>
      }
    >
      <div className="grid gap-6 px-5 py-5">
        {variants && (
          <fieldset>
            <legend className="mb-2.5 flex w-full items-baseline justify-between">
              <span className="font-display text-lg font-semibold">{variants.title}</span>
              <span className="tag tag-muted">Required</span>
            </legend>
            <div className="grid gap-2">
              {variants.options.map((option) => (
                <label key={option.id} className={`${row} ${option.id === variantId ? 'border-leaf bg-leaf-tint' : 'border-line hover:border-ink'}`}>
                  <input type="radio" name="variant" className="size-4 accent-[var(--leaf)]" checked={option.id === variantId} onChange={() => setVariantId(option.id)} />
                  <span className="flex-1">{option.name}</span>
                  <span className="num font-semibold">{rupee(dish.price + option.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {groups.map((group) => {
          const picked = group.options.filter((option) => addonIds.includes(option.id)).length
          return (
            <fieldset key={group.id}>
              <legend className="mb-2.5 flex w-full items-baseline justify-between">
                <span className="font-display text-lg font-semibold">{group.title}</span>
                <span className="text-sm text-faint">Choose up to {group.max}</span>
              </legend>
              <div className="grid gap-2">
                {group.options.map((option) => {
                  const checked = addonIds.includes(option.id)
                  const full = !checked && picked >= group.max
                  return (
                    <label key={option.id} className={`${row} ${checked ? 'border-leaf bg-leaf-tint' : 'border-line hover:border-ink'} ${full ? 'cursor-not-allowed opacity-50 hover:border-line' : ''}`}>
                      <input type="checkbox" className="size-4 accent-[var(--leaf)]" checked={checked} disabled={full} onChange={() => toggle(group, option)} />
                      <DietMark diet={option.diet} />
                      <span className="flex-1">{option.name}</span>
                      <span className="num text-soft">+ {rupee(option.price)}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )
        })}
      </div>
    </Dialog>
  )
}
