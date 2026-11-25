/** The Chaska mark: a three-tier tiffin carrier. */
export function LogoMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--marigold)" />
      <path d="M11 11V9.5a5 5 0 0 1 10 0V11" fill="none" stroke="#0d4a37" strokeWidth="2" strokeLinecap="round" />
      <rect x="8" y="11" width="16" height="4.4" rx="1.6" fill="#0d4a37" />
      <rect x="8" y="16.3" width="16" height="4.4" rx="1.6" fill="#fffdf8" />
      <rect x="8" y="21.6" width="16" height="4.4" rx="1.6" fill="#0d4a37" />
    </svg>
  )
}

/** `compact` drops the wordmark on very narrow screens, where the header needs the room. */
export default function Logo({ className = '', compact = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`font-display text-[1.6rem] font-semibold leading-none tracking-[-0.03em] ${compact ? 'hidden xs:inline' : ''}`}>chaska</span>
    </span>
  )
}
