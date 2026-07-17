import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card as UICard, Stat, Skeleton, Button, Badge, EmptyState, Segmented } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getCards, setCardStatus } from '@/lib/data'
import { formatAmount, formatCompact } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { Card as CardType } from '@/lib/types'

type Filter = 'all' | 'active' | 'frozen'

function CardVisual({ card, busy, onToggle }: { card: CardType; busy: boolean; onToggle: () => void }) {
  const pct = Math.min(100, (card.spendMtd / card.limitMonthly) * 100)
  const frozen = card.status === 'frozen'
  return (
    <UICard className={cn('overflow-hidden transition-opacity', frozen && 'opacity-70')}>
      {/* Card face */}
      <div className="relative aspect-[1.586/1] w-full bg-gradient-to-br from-secondary/60 via-card to-background p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-8 place-items-center rounded bg-foreground/10">
              <span className="h-3 w-4 rounded-sm bg-foreground/40" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">Lux Financial</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">{card.brand}</span>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-mono text-sm tracking-widest text-foreground/90">•••• •••• •••• {card.last4}</p>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="max-w-[60%] truncate">{card.accountName}</span>
            <span>exp {card.expiry}</span>
          </div>
        </div>
      </div>
      {/* Meta */}
      <div className="space-y-3 border-t border-border p-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={card.status} />
          <span className="text-xs text-muted-foreground">{card.currency}</span>
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Spend MTD</span>
            <span className="tabular-nums">{formatAmount(card.spendMtd, card.currency)} / {formatCompact(card.limitMonthly, card.currency)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary/50">
            <div className={cn('h-full rounded-full', pct > 85 ? 'bg-warning' : 'bg-foreground/70')} style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
        </div>
        {card.status !== 'pending' && (
          <Button
            size="sm"
            variant={frozen ? 'success' : 'secondary'}
            icon={frozen ? 'check' : 'snow'}
            className="w-full"
            disabled={busy}
            onClick={onToggle}
          >
            {frozen ? 'Unfreeze card' : 'Freeze card'}
          </Button>
        )}
      </div>
    </UICard>
  )
}

export function Cards() {
  const { data, loading, refetch } = useAsync(getCards)
  const [filter, setFilter] = useState<Filter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const cards = (data ?? []).filter((c) => (filter === 'all' ? true : c.status === filter))
  const issued = data?.length ?? 0
  const frozen = (data ?? []).filter((c) => c.status === 'frozen').length
  const spend = (data ?? []).reduce((s, c) => s + c.spendMtd, 0)

  async function toggle(c: CardType) {
    setBusyId(c.id)
    await setCardStatus(c.id, c.status === 'frozen' ? 'active' : 'frozen')
    setBusyId(null)
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards"
        desc="Issued virtual cards. Freeze / unfreeze in sandbox."
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Frozen', value: 'frozen' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Issued" value={loading ? '—' : issued} icon="card" />
        <Stat label="Frozen" value={loading ? '—' : frozen} icon="snow" />
        <Stat label="Spend MTD" value={loading ? '—' : formatCompact(spend)} icon="tx" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : cards.length === 0 ? (
        <UICard><EmptyState icon="card" title="No cards" desc="No cards match this filter." /></UICard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <CardVisual key={c.id} card={c} busy={busyId === c.id} onToggle={() => toggle(c)} />
          ))}
        </div>
      )}
    </div>
  )
}
