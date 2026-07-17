import { cn } from '@/lib/cn'

// Lux ▼ mark — white downward triangle on black. White-label: this surface is
// the Lux brand only (never a Hanzo mark on a Lux deployment).
export function LuxMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d="M50 78 L20 30 L80 30 Z" fill="currentColor" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight text-foreground', className)}>
      <LuxMark size={18} />
      <span>
        Lux<span className="text-muted-foreground"> Financial</span>
      </span>
    </span>
  )
}
