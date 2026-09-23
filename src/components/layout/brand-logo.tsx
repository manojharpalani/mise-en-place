import Link from 'next/link'

/**
 * Mise en Place lockup: Home Kitchen mark + "mise en place" wordmark,
 * optionally with the "Your AI-enabled chef operating system" tagline.
 */
export function BrandLogo({
  tone = 'light',
  tagline = true,
  size = 'md',
  className = '',
}: {
  tone?: 'light' | 'dark'
  tagline?: boolean
  size?: 'md' | 'lg'
  className?: string
}) {
  const onDark = tone === 'dark'
  const mark = size === 'lg' ? 44 : 34
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Mise en Place home">
      <img src={onDark ? '/logo-mark-light.svg' : '/logo-mark.svg'} alt="" width={mark} height={mark} style={{ width: mark, height: mark }} />
      <span className="flex flex-col text-left">
        <span
          className={`font-heading font-extrabold leading-none tracking-[-0.03em] whitespace-nowrap ${size === 'lg' ? 'text-[28px]' : 'text-[22px]'}`}
          style={{ color: onDark ? '#FFF9EC' : '#12402C' }}
        >
          mise en <span style={{ color: onDark ? '#F5B82E' : '#E2472B' }}>place</span>
        </span>
        {tagline && (
          <span
            className="mt-1.5 text-[10.5px] leading-none font-semibold uppercase tracking-[0.08em] whitespace-nowrap"
            style={{ color: onDark ? '#F5B82E' : '#4D5747' }}
          >
            Your AI-enabled chef operating system
          </span>
        )}
      </span>
    </Link>
  )
}
