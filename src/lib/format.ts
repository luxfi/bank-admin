// Money is stored in minor units (cents) — same convention as bankd. Convert to
// major units for display. Currency decimals follow ISO 4217 exceptions.
const currencyDecimals: Record<string, number> = { BHD: 3, KWD: 3, OMR: 3, JPY: 0, KRW: 0 }

function decimals(currency: string): number {
  return currencyDecimals[currency.toUpperCase()] ?? 2
}

export function formatAmount(minorUnits: number, currency: string): string {
  const d = decimals(currency)
  const major = minorUnits / Math.pow(10, d)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(major)
}

// Compact money for KPI tiles (e.g. $1.2M). Always USD-normalized display.
export function formatCompact(minorUnits: number, currency = 'USD'): string {
  const d = decimals(currency)
  const major = minorUnits / Math.pow(10, d)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(major)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

export function formatDate(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateShort(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function relativeTime(iso: string): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
