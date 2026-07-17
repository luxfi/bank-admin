import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Button, EmptyState, Skeleton, Segmented } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { Drawer, DetailRow } from '@/components/Drawer'
import { useAsync } from '@/hooks/useAsync'
import { getCustomers, getBalances, setKyc, type CustomerRow } from '@/lib/data'
import { formatCompact, formatDate, formatAmount, initials, titleCase } from '@/lib/format'
import type { KycStatus } from '@/lib/types'

type Filter = 'all' | 'pending' | 'approved' | 'business' | 'individual'

export function Customers() {
  const { data, loading, refetch } = useAsync(getCustomers)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState<CustomerRow | null>(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const items = data ?? []
    switch (filter) {
      case 'pending':
        return items.filter((a) => a.kycStatus === 'pending' || a.kycStatus === 'not_started')
      case 'approved':
        return items.filter((a) => a.kycStatus === 'approved')
      case 'business':
        return items.filter((a) => a.entityType === 'business')
      case 'individual':
        return items.filter((a) => a.entityType === 'individual')
      default:
        return items
    }
  }, [data, filter])

  const balances = useAsync(() => (sel ? getBalances(sel.id) : Promise.resolve({ accountId: '', balances: [] })), [sel?.id])

  async function decide(status: KycStatus) {
    if (!sel) return
    setBusy(true)
    await setKyc(sel.id, status)
    setBusy(false)
    setSel({ ...sel, kycStatus: status, status: status === 'rejected' ? 'suspended' : 'active' })
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        desc="Onboarded entities and their KYC standing."
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Business', value: 'business' },
              { label: 'Individual', value: 'individual' },
            ]}
          />
        }
      />

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="users" title="No customers" desc="No entities match this filter." />
        ) : (
          <Table>
            <THead>
              <TH>Customer</TH>
              <TH>Type</TH>
              <TH>Country</TH>
              <TH className="text-right">Balance</TH>
              <TH>KYC</TH>
              <TH>Risk</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TR key={c.id} onClick={() => setSel(c)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(c.entityName)} />
                      <div className="leading-tight">
                        <p className="font-medium">{c.entityName}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="capitalize text-muted-foreground">{c.entityType}</TD>
                  <TD>{c.country}</TD>
                  <TD className="text-right font-medium tabular-nums">{formatCompact(c.totalUsd)}</TD>
                  <TD><StatusBadge status={c.kycStatus} /></TD>
                  <TD><Badge tone={c.riskRating === 'high' ? 'danger' : c.riskRating === 'medium' ? 'warning' : 'muted'}>{c.riskRating}</Badge></TD>
                  <TD><StatusBadge status={c.status} dot={false} /></TD>
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
        subtitle={sel ? `${titleCase(sel.entityType)} · ${sel.country} · ${sel.currency}` : ''}
        footer={
          sel && (sel.kycStatus === 'pending' || sel.kycStatus === 'not_started') ? (
            <div className="flex gap-2">
              <Button variant="success" icon="check" className="flex-1" disabled={busy} onClick={() => decide('approved')}>
                Approve KYC
              </Button>
              <Button variant="danger" icon="ban" className="flex-1" disabled={busy} onClick={() => decide('rejected')}>
                Reject
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              KYC {sel ? titleCase(sel.kycStatus) : ''} — no action required
            </p>
          )
        }
      >
        {sel && (
          <div className="space-y-6">
            <section>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">KYC / Risk</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={sel.kycStatus} />
                <Badge tone={sel.riskRating === 'high' ? 'danger' : sel.riskRating === 'medium' ? 'warning' : 'muted'}>
                  {sel.riskRating} risk
                </Badge>
                <StatusBadge status={sel.status} dot={false} />
              </div>
            </section>
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile</p>
              <DetailRow label="Account ID"><span className="font-mono text-xs">{sel.id}</span></DetailRow>
              <DetailRow label="Email">{sel.email}</DetailRow>
              <DetailRow label="Base currency">{sel.currency}</DetailRow>
              <DetailRow label="Onboarded">{formatDate(sel.created)}</DetailRow>
            </section>
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Balances</p>
              {balances.loading ? (
                <Skeleton className="h-16" />
              ) : (
                <div className="space-y-1">
                  {(balances.data?.balances ?? []).map((b) => (
                    <DetailRow key={b.currency} label={b.currency}>
                      <span className="tabular-nums">{formatAmount(b.available, b.currency)}</span>
                      {b.held > 0 && <span className="ml-2 text-xs text-muted-foreground">({formatAmount(b.held, b.currency)} held)</span>}
                    </DetailRow>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}
