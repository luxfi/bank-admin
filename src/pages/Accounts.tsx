import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, Table, THead, TH, TBody, TR, TD, Avatar, Button, EmptyState, Skeleton, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { Drawer, DetailRow } from '@/components/Drawer'
import { useAsync } from '@/hooks/useAsync'
import { getAccounts, getBalances, type CustomerRow } from '@/lib/data'
import { formatAmount, formatCompact, formatDate, initials } from '@/lib/format'

export function Accounts() {
  const { data, loading } = useAsync(getAccounts)
  const [sel, setSel] = useState<CustomerRow | null>(null)
  const balances = useAsync(() => (sel ? getBalances(sel.id) : Promise.resolve({ accountId: '', balances: [] })), [sel?.id])

  const rows = data ?? []
  const totalUsd = rows.reduce((s, a) => s + a.totalUsd, 0)
  const active = rows.filter((a) => a.status === 'active').length

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts" desc="Multi-currency accounts and balances." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Accounts" value={loading ? '—' : rows.length} icon="wallet" />
        <Stat label="Active" value={loading ? '—' : active} icon="check" />
        <Stat label="Total balance" value={loading ? '—' : formatCompact(totalUsd)} icon="treasury" hint="USD-normalized" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="wallet" title="No accounts" />
        ) : (
          <Table>
            <THead>
              <TH>Account</TH>
              <TH>Base ccy</TH>
              <TH className="text-right">Currencies</TH>
              <TH className="text-right">Balance (USD)</TH>
              <TH>Status</TH>
              <TH className="text-right">Opened</TH>
            </THead>
            <TBody>
              {rows.map((a) => (
                <TR key={a.id} onClick={() => setSel(a)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(a.entityName)} />
                      <div className="leading-tight">
                        <p className="font-medium">{a.entityName}</p>
                        <p className="font-mono text-xs text-muted-foreground">{a.id}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>{a.currency}</TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{a.currencies}</TD>
                  <TD className="text-right font-medium tabular-nums">{formatCompact(a.totalUsd)}</TD>
                  <TD><StatusBadge status={a.status} /></TD>
                  <TD className="text-right text-muted-foreground">{formatDate(a.created)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.entityName}
        subtitle={sel ? `Account · ${sel.currency}` : ''}
      >
        {sel && (
          <div className="space-y-6">
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Balances</p>
              {balances.loading ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="space-y-2">
                  {(balances.data?.balances ?? []).map((b) => (
                    <div key={b.currency} className="rounded-lg border border-border bg-secondary/20 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{b.currency}</span>
                      </div>
                      <p className="mt-1 text-lg font-semibold tabular-nums">{formatAmount(b.available, b.currency)}</p>
                      {b.held > 0 && (
                        <p className="text-xs text-muted-foreground">{formatAmount(b.held, b.currency)} held</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
              <DetailRow label="Account ID"><span className="font-mono text-xs">{sel.id}</span></DetailRow>
              <DetailRow label="Owner"><span className="font-mono text-xs">{sel.owner}</span></DetailRow>
              <DetailRow label="Type"><span className="capitalize">{sel.entityType}</span></DetailRow>
              <DetailRow label="Opened">{formatDate(sel.created)}</DetailRow>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}
