// @hanzo/ui-style primitives, implemented on the true-black token set. Pure
// Tailwind v4 (no Radix/peer deps) so the build is bulletproof, but the visual
// language — hairline borders, near-black cards, monochrome primary, rounded-xl,
// 150ms ease-out — is the @hanzo/ui design system.
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from './icons'

// ---- Button ----
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md'
const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none'
const btnVariant: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border bg-secondary/40 text-foreground hover:bg-secondary',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
  danger: 'border border-destructive/40 text-destructive hover:bg-destructive/10',
  success: 'border border-success/40 text-success hover:bg-success/10',
}
const btnSize: Record<Size, string> = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm' }

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: { variant?: Variant; size?: Size; icon?: IconName } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(btnBase, btnVariant[variant], btnSize[size], className)} {...props}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

// ---- Card ----
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground', className)}
      {...props}
    >
      {children}
    </div>
  )
}
export function CardHeader({ title, desc, action }: { title: ReactNode; desc?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  )
}
export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

// ---- Badge (status) ----
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'muted'
const toneClass: Record<Tone, string> = {
  neutral: 'border-border bg-secondary/50 text-foreground',
  success: 'border-success/30 bg-success/10 text-success',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-info/30 bg-info/10 text-info',
  muted: 'border-border bg-transparent text-muted-foreground',
}
export function Badge({ tone = 'neutral', dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        toneClass[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// ---- Table ----
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  )
}
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {children}
      </tr>
    </thead>
  )
}
export function TH({ className, children }: { className?: string; children?: ReactNode }) {
  return <th className={cn('whitespace-nowrap px-4 py-2.5 font-medium', className)}>{children}</th>
}
export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}
export function TR({ className, onClick, children }: { className?: string; onClick?: () => void; children: ReactNode }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-border/60 last:border-0 transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50',
        className,
      )}
    >
      {children}
    </tr>
  )
}
export function TD({ className, title, children }: { className?: string; title?: string; children?: ReactNode }) {
  return (
    <td title={title} className={cn('whitespace-nowrap px-4 py-3 align-middle', className)}>
      {children}
    </td>
  )
}

// ---- Stat tile ----
export function Stat({
  label,
  value,
  delta,
  icon,
  hint,
}: {
  label: string
  value: ReactNode
  delta?: { value: string; up?: boolean }
  icon?: IconName
  hint?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-secondary/40 text-muted-foreground">
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</span>
        {delta && (
          <span className={cn('mb-1 inline-flex items-center gap-0.5 text-xs font-medium', delta.up ? 'text-success' : 'text-muted-foreground')}>
            <Icon name={delta.up ? 'arrowUp' : 'arrowDown'} size={12} />
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

// ---- Skeleton / Empty / Avatar ----
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-secondary/60', className)} />
}
export function EmptyState({ icon = 'search', title, desc }: { icon?: IconName; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full border border-border bg-secondary/40 text-muted-foreground">
        <Icon name={icon} size={20} />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {desc && <p className="max-w-sm text-xs text-muted-foreground">{desc}</p>}
    </div>
  )
}
export function Avatar({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-secondary/50 text-[11px] font-semibold text-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}

// ---- Segmented control (filter tabs) ----
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
            value === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
