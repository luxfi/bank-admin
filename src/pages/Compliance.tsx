import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Skeleton, EmptyState, Segmented, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getCompliance } from '@/lib/data'
import { formatDate, initials, titleCase } from '@/lib/format'
import type { ComplianceKind } from '@/lib/types'

type Filter = 'all' | ComplianceKind

const kindTone: Record<ComplianceKind, 'info' | 'warning' | 'danger' | 'neutral'> = {
  kyc: 'info',
  aml: 'warning',
  sanctions: 'danger',
  pep: 'neutral',
}

export function Compliance() {
  const { data, loading } = useAsync(getCompliance)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (data ?? []).filter((c) => (filter === 'all' ? true : c.kind === filter)),
    [data, filter],
  )

  const open = (data ?? []).filter((c) => c.status === 'open').length
  const escalated = (data ?? []).filter((c) => c.status === 'escalated').length
  const high = (data ?? []).filter((c) => c.severity === 'high').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        desc="AML / KYC / sanctions review queue. Read-only demo."
        action={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'KYC', value: 'kyc' },
              { label: 'AML', value: 'aml' },
              { label: 'Sanctions', value: 'sanctions' },
              { label: 'PEP', value: 'pep' },
            ]}
          />
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Open cases" value={loading ? '—' : open} icon="shield" />
        <Stat label="Escalated" value={loading ? '—' : escalated} icon="arrowUp" />
        <Stat label="High severity" value={loading ? '—' : high} icon="dot" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="shield" title="Queue clear" desc="No open compliance cases for this filter." />
        ) : (
          <Table>
            <THead>
              <TH>Customer</TH>
              <TH>Type</TH>
              <TH>Detail</TH>
              <TH>Severity</TH>
              <TH>Status</TH>
              <TH className="text-right">Raised</TH>
            </THead>
            <TBody>
              {rows.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(c.accountName)} />
                      <span className="font-medium">{c.accountName}</span>
                    </div>
                  </TD>
                  <TD><Badge tone={kindTone[c.kind]}>{c.kind.toUpperCase()}</Badge></TD>
                  <TD className="max-w-[320px] truncate text-muted-foreground" title={c.detail}>{c.detail}</TD>
                  <TD>
                    <Badge tone={c.severity === 'high' ? 'danger' : c.severity === 'medium' ? 'warning' : 'muted'}>
                      {titleCase(c.severity)}
                    </Badge>
                  </TD>
                  <TD><StatusBadge status={c.status} /></TD>
                  <TD className="text-right text-muted-foreground">{formatDate(c.created)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
