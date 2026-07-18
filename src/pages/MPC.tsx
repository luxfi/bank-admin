import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Button, Skeleton, EmptyState, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getWallets, setWalletStatus } from '@/lib/data'
import { formatAmount, formatCompact, initials, relativeTime } from '@/lib/format'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { Wallet } from '@/lib/types'

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

const healthTone = { healthy: 'success', rotating: 'info', degraded: 'warning' } as const

export function MPC() {
  const { data, loading, refetch } = useAsync(getWallets)
  const [busyId, setBusyId] = useState<string | null>(null)

  const wallets = data ?? []
  const active = wallets.filter((w) => w.status === 'active').length
  const totalUsd = wallets.reduce((s, w) => s + w.balance, 0)

  async function toggle(w: Wallet) {
    setBusyId(w.id)
    await setWalletStatus(w.id, w.status === 'frozen' ? 'active' : 'frozen')
    setBusyId(null)
    refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="MPC" desc="Threshold-signed custody — the key is sharded across parties; no single party ever holds it. Testnet, sandbox." />

      <Card className="border-info/25 bg-info/[0.05]">
        <CardBody className="flex items-start gap-3 py-4">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-info/30 bg-info/10 text-info">
            <Icon name="cpu" size={16} />
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Multi-party computation custody</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each wallet's signing key is split into shares held by a distinct party set. A threshold
              (e.g. 2-of-3) must co-sign; no party can sign alone and no party holds the whole key.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="MPC wallets" value={loading ? '—' : wallets.length} icon="cpu" />
        <Stat label="Active" value={loading ? '—' : active} icon="check" />
        <Stat label="Custody value" value={loading ? '—' : formatCompact(totalUsd)} icon="treasury" hint="testnet" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : wallets.length === 0 ? (
          <EmptyState icon="cpu" title="No MPC wallets" />
        ) : (
          <Table>
            <THead>
              <TH>Account</TH>
              <TH>Network</TH>
              <TH>Address</TH>
              <TH>Threshold</TH>
              <TH>Party set</TH>
              <TH>Key shares</TH>
              <TH className="text-right">Balance</TH>
              <TH>Last signed</TH>
              <TH>Status</TH>
              <TH className="text-right">Action</TH>
            </THead>
            <TBody>
              {wallets.map((w) => (
                <TR key={w.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(w.accountName ?? '?')} />
                      <span className="font-medium">{w.accountName}</span>
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">{w.chain}</TD>
                  <TD><span className="font-mono text-xs text-muted-foreground">{shortAddr(w.address)}</span></TD>
                  <TD><Badge tone="muted">{w.threshold}</Badge></TD>
                  <TD>
                    <span className="text-xs text-muted-foreground" title={w.parties.join(', ')}>
                      {w.parties.length} parties
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={healthTone[w.keyShareHealth]} dot>{w.keyShareHealth}</Badge>
                  </TD>
                  <TD className="text-right font-medium tabular-nums">{formatAmount(w.balance, w.currency)} {w.currency}</TD>
                  <TD className="text-muted-foreground">{relativeTime(w.lastSigned)}</TD>
                  <TD><StatusBadge status={w.status} /></TD>
                  <TD className="text-right">
                    {w.status !== 'provisioning' && (
                      <Button
                        size="sm"
                        variant={w.status === 'frozen' ? 'success' : 'ghost'}
                        icon={w.status === 'frozen' ? 'check' : 'snow'}
                        disabled={busyId === w.id}
                        onClick={() => toggle(w)}
                      >
                        {w.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
