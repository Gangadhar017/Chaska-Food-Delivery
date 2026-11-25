import { PiPepper, PiStarFill } from 'react-icons/pi'
import { compactCount, rupee } from '../lib/format.js'
import { DietMark, Stepper } from './bits.jsx'
import Photo from './Photo.jsx'

function AddControl({ dish, quantity, onAdd, onMinus }) {
  if (!dish.inStock) {
    return <span className="grid h-9 w-[6.5rem] place-items-center rounded-lg border border-line bg-sunken text-sm font-semibold text-faint">Sold out</span>
  }
  if (quantity > 0) {
    return <Stepper compact value={quantity} onMinus={onMinus} onPlus={onAdd} label={`${dish.name} quantity`} />
  }
  return (
    <button type="button" onClick={onAdd} aria-label={`Add ${dish.name}`} className="h-9 w-[6.5rem] rounded-lg border border-line-strong bg-card text-[0.9rem] font-bold uppercase tracking-[0.06em] text-leaf transition-colors hover:border-leaf hover:bg-leaf-tint">
      Add
    </button>
  )
}

/** One dish on a menu: details on the left, photo and Add button on the right. */
export default function DishRow({ dish, quantity, onAdd, onMinus }) {
  return (
    <article className={`flex gap-4 py-5 ${dish.inStock ? '' : 'opacity-60'}`}>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <DietMark diet={dish.diet} />
          {dish.bestseller && <span className="tag tag-soft-marigold">Bestseller</span>}
          {dish.spicy && <span className="tag tag-chili"><PiPepper size={11} /> Spicy</span>}
        </div>
        <h3 className="font-sans text-[1.08rem] font-semibold leading-snug tracking-normal">{dish.name}</h3>
        <p className="num mt-0.5 font-semibold">{rupee(dish.price)}</p>
        <p className="num mt-1 flex items-center gap-1 text-sm text-soft">
          <PiStarFill size={12} className="text-marigold-deep" />
          <span className="font-semibold text-ink">{dish.rating.toFixed(1)}</span>
          <span className="text-faint">({compactCount(dish.ratingCount)})</span>
        </p>
        <p className="clamp-2 mt-2 max-w-prose text-[0.95rem] leading-snug text-soft">{dish.description}</p>
      </div>

      <div className="flex w-[7.5rem] shrink-0 flex-col items-center sm:w-[9.5rem]">
        {dish.photo ? (
          <>
            <Photo name={dish.photo} alt={dish.name} label={dish.name} width={304} ratio={0.86} className="aspect-[7/6] w-full rounded-xl border border-line" />
            <div className="relative z-10 -mt-[1.15rem]"><AddControl dish={dish} quantity={quantity} onAdd={onAdd} onMinus={onMinus} /></div>
          </>
        ) : (
          <div className="pt-1"><AddControl dish={dish} quantity={quantity} onAdd={onAdd} onMinus={onMinus} /></div>
        )}
        {dish.custom && dish.inStock && <p className="mt-1.5 text-[0.78rem] text-faint">Customisable</p>}
      </div>
    </article>
  )
}
