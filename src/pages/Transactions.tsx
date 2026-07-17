import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Skeleton, EmptyState, Segmented, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getTransactions } from '@/lib/data'
import { formatAmount, formatCompact, formatDate, initials, titleCase } from '@/lib/format'
import type { TxStatus } from '@/lib/types'

type Filter = 'all' | TxStatus

export function Transactions() {
  const { data, loading } = useAsync(getTransactions)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (data ?? []).filter((t) => (filter === 'all' ? true : t.status === filter)),
    [data, filter],
  )

  const completed = (data ?? []).filter((t) => t.status === 'completed')
  const volume = completed.reduce((s, t) => s + t.amount, 0)
  const pending = (data ?? []).filter((t) => t.status === 'pending' || t.status === 'processing').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        desc="Payments, deposits, conversions and transfers across the portfolio."
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Completed', value: 'completed' },
              { label: 'Processing', value: 'processing' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Transactions" value={loading ? '—' : data?.length ?? 0} icon="tx" />
        <Stat label="Settled volume" value={loading ? '—' : formatCompact(volume)} icon="treasury" />
        <Stat label="In-flight" value={loading ? '—' : pending} icon="clock" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="tx" title="No transactions" desc="No transactions match this filter." />
        ) : (
          <Table>
            <THead>
              <TH>Customer</TH>
              <TH>Type</TH>
              <TH>Reference</TH>
              <TH>Counterparty</TH>
              <TH className="text-right">Amount</TH>
              <TH>Status</TH>
              <TH className="text-right">Date</TH>
            </THead>
            <TBody>
              {rows.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(t.accountName ?? '?')} />
                      <span className="font-medium">{t.accountName}</span>
                    </div>
                  </TD>
                  <TD><Badge tone="muted">{titleCase(t.type)}</Badge></TD>
                  <TD className="text-muted-foreground">{t.reference}</TD>
                  <TD className="text-muted-foreground">{t.counterparty}</TD>
                  <TD className="text-right font-medium tabular-nums">
                    <span className={t.direction === 'credit' ? 'text-success' : ''}>
                      {t.direction === 'credit' ? '+' : '−'}
                      {formatAmount(t.amount, t.currency)}
                    </span>
                  </TD>
                  <TD><StatusBadge status={t.status} /></TD>
                  <TD className="text-right text-muted-foreground">{formatDate(t.created)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
