import { useState } from 'react'
import { cart } from '../lib/cart.js'
import Dialog from './Dialog.jsx'
import DishCustomizer from './DishCustomizer.jsx'

/**
 * Everything that can happen when someone taps Add on a dish: open the customiser if the
 * dish has options, and ask before replacing a cart that holds another restaurant's food.
 * Render `dialogs` once on the page and call `add(outlet, dish)` from any dish row.
 */
export function useDishActions() {
  const [customising, setCustomising] = useState(null)
  const [replacing, setReplacing] = useState(null)

  function commit(outlet, dish, selection) {
    const { conflict } = cart.add(outlet, dish, selection)
    if (conflict) setReplacing({ outlet, dish, selection })
  }

  const add = (outlet, dish) => {
    if (dish.custom) setCustomising({ outlet, dish })
    else commit(outlet, dish)
  }

  const dialogs = (
    <>
      {customising && (
        <DishCustomizer
          key={customising.dish.id}
          dish={customising.dish}
          onClose={() => setCustomising(null)}
          onAdd={(selection) => {
            const { outlet, dish } = customising
            setCustomising(null)
            commit(outlet, dish, selection)
          }}
        />
      )}
      <Dialog
        open={Boolean(replacing)}
        onClose={() => setReplacing(null)}
        kicker="One restaurant at a time"
        title="Start a new cart?"
        width="26rem"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-outline" onClick={() => setReplacing(null)}>Keep my cart</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                cart.startOver(replacing.outlet, replacing.dish, replacing.selection)
                setReplacing(null)
              }}
            >
              Start new cart
            </button>
          </div>
        }
      >
        <p className="px-5 py-5 text-soft">
          Your cart has items from <strong className="font-semibold text-ink">{cart.get().outlet?.name}</strong>. Adding this dish from{' '}
          <strong className="font-semibold text-ink">{replacing?.outlet.name}</strong> will clear it.
        </p>
      </Dialog>
    </>
  )

  return { add, minus: (dish) => cart.decrementDish(dish.id), dialogs }
}
