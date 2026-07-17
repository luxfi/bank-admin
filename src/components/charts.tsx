// Inline SVG charts — no charting dependency. Monochrome, token-driven, crisp
// on the true-black canvas. Responsive via viewBox + preserveAspectRatio.
import { useId } from 'react'

// Area/line trend for the overview volume series.
export function AreaTrend({ data, height = 160 }: { data: { label: string; value: number }[]; height?: number }) {
  const gid = useId()
  const w = 640
  const h = height
  const pad = 8
  const max = Math.max(1, ...data.map((d) => d.value))
  const step = (w - pad * 2) / Math.max(1, data.length - 1)
  const pts = data.map((d, i) => {
    const x = pad + i * step
    const y = pad + (1 - d.value / max) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--foreground)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--foreground)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${gid})`} />
      <path d={line} fill="none" stroke="var(--foreground)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="var(--background)" stroke="var(--foreground)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}

// Horizontal proportion bars (currency mix / treasury).
export function ProportionBars({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-medium text-foreground">{d.label}</span>
            <span className="tabular-nums text-muted-foreground">{d.sub}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full bg-foreground/80"
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Compact sparkline bars for tiles.
export function SparkBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(1, ...data)
  return (
    <div className={`flex items-end gap-0.5 ${className ?? ''}`}>
      {data.map((v, i) => (
        <div key={i} className="w-1 rounded-sm bg-foreground/25" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
      ))}
    </div>
  )
}
