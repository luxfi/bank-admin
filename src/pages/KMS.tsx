import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, Table, THead, TH, TBody, TR, TD, Badge, Skeleton, EmptyState, Segmented, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getKmsSecrets } from '@/lib/data'
import { KMS_MASTER } from '@/lib/sandbox'
import { formatDate, relativeTime, titleCase } from '@/lib/format'
import { Icon } from '@/components/icons'
import type { SecretType } from '@/lib/types'

type Filter = 'all' | SecretType

const typeTone: Record<SecretType, 'info' | 'warning' | 'neutral' | 'muted'> = {
  api_key: 'info',
  passphrase: 'warning',
  signing_key: 'info',
  certificate: 'muted',
  webhook_secret: 'neutral',
  db_credential: 'warning',
}

export function KMS() {
  const { data, loading } = useAsync(getKmsSecrets)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = useMemo(
    () => (data ?? []).filter((s) => (filter === 'all' ? true : s.type === filter)),
    [data, filter],
  )
  const active = (data ?? []).filter((s) => s.status === 'active').length
  const rotating = (data ?? []).filter((s) => s.status === 'rotating').length

  return (
    <div className="space-y-6">
      <PageHeader title="KMS" desc="Secrets, passphrases and API keys. Values are masked — sandbox only." />

      {/* Master key — MPC-sharded */}
      <Card className="border-info/25 bg-info/[0.05]">
        <CardBody className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-info/30 bg-info/10 text-info">
              <Icon name="key" size={17} />
            </span>
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Master key: <span className="text-info">{KMS_MASTER.scheme}</span> — no single custodian
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{KMS_MASTER.detail}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {KMS_MASTER.custodians.map((c) => (
              <Badge key={c} tone="muted">{c}</Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Secrets" value={loading ? '—' : data?.length ?? 0} icon="key" />
        <Stat label="Active" value={loading ? '—' : active} icon="check" />
        <Stat label="Rotating" value={loading ? '—' : rotating} icon="clock" />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <p className="text-sm font-semibold">Secrets</p>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: 'All', value: 'all' },
              { label: 'API keys', value: 'api_key' },
              { label: 'Signing', value: 'signing_key' },
              { label: 'Passphrase', value: 'passphrase' },
              { label: 'Webhook', value: 'webhook_secret' },
            ]}
          />
        </div>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="key" title="No secrets" desc="No secrets match this filter." />
        ) : (
          <Table>
            <THead>
              <TH>Name</TH>
              <TH>Type</TH>
              <TH>Value</TH>
              <TH className="text-right">Ver</TH>
              <TH>Rotation</TH>
              <TH>Scope</TH>
              <TH>Last accessed</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {rows.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium">{s.name}</TD>
                  <TD><Badge tone={typeTone[s.type]}>{titleCase(s.type)}</Badge></TD>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Icon name="lock" size={12} />
                      {s.maskedValue}
                    </span>
                  </TD>
                  <TD className="text-right tabular-nums text-muted-foreground">v{s.version}</TD>
                  <TD className="text-muted-foreground">{s.rotation}</TD>
                  <TD className="text-muted-foreground">{s.scope}</TD>
                  <TD className="text-muted-foreground" title={formatDate(s.lastAccessed)}>{relativeTime(s.lastAccessed)}</TD>
                  <TD><StatusBadge status={s.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
