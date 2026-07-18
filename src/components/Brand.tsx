import { cn } from '@/lib/cn'
import { useBrand } from '@/lib/brand'

// Brand mark. Lux → white ▼ triangle. ACM → rounded accent tile with the
// lowercase initial. White-label: never a Hanzo mark on a tenant surface.
export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  const brand = useBrand()
  if (brand.wordmark.mark === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
        <path d="M50 78 L20 30 L80 30 Z" fill="currentColor" />
      </svg>
    )
  }
  // Tile mark (ACM): filled rounded square in the brand accent.
  return (
    <span
      className={cn('inline-grid place-items-center rounded-[6px] font-bold lowercase text-white', className)}
      style={{ width: size, height: size, backgroundColor: brand.accent, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {brand.wordmark.text[0]}
    </span>
  )
}

// Back-compat alias — existing imports use LuxMark.
export const LuxMark = BrandMark

// Wordmark. Lux → "Lux Financial" with the triangle. ACM → bold lowercase "acm".
export function Wordmark({ className }: { className?: string }) {
  const brand = useBrand()
  if (brand.id === 'acm') {
    return (
      <span className={cn('inline-flex items-baseline font-bold lowercase tracking-tight', className)}>
        <span style={{ color: brand.accent }}>{brand.wordmark.text}</span>
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight text-foreground', className)}>
      <BrandMark size={18} />
      <span>
        {brand.wordmark.text}
        {brand.wordmark.sub && <span className="text-muted-foreground"> {brand.wordmark.sub}</span>}
      </span>
    </span>
  )
}
