import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Button, Skeleton, EmptyState, Stat } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getWallets, setWalletStatus } from '@/lib/data'
import { formatAmount, formatCompact, initials } from '@/lib/format'
import { Icon } from '@/components/icons'
import type { Wallet } from '@/lib/types'

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

export function Custody() {
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

  function copy(addr: string) {
    navigator.clipboard?.writeText(addr).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <PageHeader title="MPC · Safes" desc="Threshold-signed custody wallets. Testnet, sandbox." />

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Wallets" value={loading ? '—' : wallets.length} icon="cpu" />
        <Stat label="Active" value={loading ? '—' : active} icon="check" />
        <Stat label="Custody value" value={loading ? '—' : formatCompact(totalUsd)} icon="treasury" hint="testnet" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : wallets.length === 0 ? (
          <EmptyState icon="cpu" title="No custody wallets" />
        ) : (
          <Table>
            <THead>
              <TH>Account</TH>
              <TH>Chain</TH>
              <TH>Address</TH>
              <TH>Threshold</TH>
              <TH className="text-right">Balance</TH>
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
                  <TD>
                    <button
                      onClick={() => copy(w.address)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
                      title="Copy address"
                    >
                      {shortAddr(w.address)}
                      <Icon name="copy" size={12} />
                    </button>
                  </TD>
                  <TD><Badge tone="muted">{w.threshold}</Badge></TD>
                  <TD className="text-right font-medium tabular-nums">{formatAmount(w.balance, w.currency)} {w.currency}</TD>
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
