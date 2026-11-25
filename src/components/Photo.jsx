import { useState } from 'react'
import { photoUrl } from '../../shared/catalog/images.js'

/**
 * A catalog photo, cropped to the size asked for and served at 1x and 2x.
 * Shows a quiet paper tile with the item's initial while loading, or if the photo fails.
 */
export default function Photo({ name, alt = '', width = 480, ratio = 0.75, className = '', eager = false, label }) {
  const [state, setState] = useState('loading')
  const height = Math.round(width * ratio)
  const src = photoUrl(name, width, height)
  const failed = !src || state === 'failed'

  return (
    <div className={`relative overflow-hidden bg-sunken ${className}`}>
      {failed ? (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_9px,var(--line)_9px_10px)]">
          <span className="font-display text-4xl font-semibold text-line-strong">{(label || alt || '·').trim().charAt(0).toUpperCase()}</span>
        </div>
      ) : (
        <img
          // A cached image can finish loading before React attaches onLoad, so check on mount too.
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) setState('ready')
          }}
          src={src}
          srcSet={`${src} 1x, ${photoUrl(name, width * 2, height * 2)} 2x`}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${state === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
