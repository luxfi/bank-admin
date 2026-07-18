import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, Table, THead, TH, TBody, TR, TD, Avatar, Badge, Skeleton, EmptyState, Stat } from '@/components/ui'
import { Drawer, DetailRow } from '@/components/Drawer'
import { useAsync } from '@/hooks/useAsync'
import { getSafes } from '@/lib/data'
import { formatAmount, formatCompact, formatDate, initials } from '@/lib/format'
import { Icon } from '@/components/icons'
import type { Safe } from '@/lib/types'

function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
}

export function Safes() {
  const { data, loading } = useAsync(getSafes)
  const [sel, setSel] = useState<Safe | null>(null)

  const safes = data ?? []
  const totalUsd = safes.reduce((s, x) => s + x.balance, 0)
  const pending = safes.reduce((s, x) => s + x.pendingTx, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Safes" desc="On-chain M-of-N multisig safes. Owners are distinct on-chain signers. Testnet, sandbox." />

      <Card className="border-info/25 bg-info/[0.05]">
        <CardBody className="flex items-start gap-3 py-4">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-info/30 bg-info/10 text-info">
            <Icon name="lock" size={16} />
          </span>
          <div className="text-sm">
            <p className="font-medium text-foreground">Smart-contract multisig</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Each safe is an on-chain contract requiring M of N owner signatures to execute. Distinct
              from MPC — here the signers are separate on-chain accounts, not shares of one key.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Safes" value={loading ? '—' : safes.length} icon="lock" />
        <Stat label="Assets under multisig" value={loading ? '—' : formatCompact(totalUsd)} icon="treasury" hint="testnet" />
        <Stat label="Queued txns" value={loading ? '—' : pending} icon="clock" hint="awaiting signatures" />
      </div>

      <Card>
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : safes.length === 0 ? (
          <EmptyState icon="lock" title="No safes" />
        ) : (
          <Table>
            <THead>
              <TH>Account</TH>
              <TH>Network</TH>
              <TH>Safe address</TH>
              <TH>Policy</TH>
              <TH className="text-right">Balance</TH>
              <TH className="text-right">Queued</TH>
              <TH className="text-right">Nonce</TH>
            </THead>
            <TBody>
              {safes.map((s) => (
                <TR key={s.id} onClick={() => setSel(s)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar label={initials(s.accountName)} />
                      <span className="font-medium">{s.accountName}</span>
                    </div>
                  </TD>
                  <TD className="text-muted-foreground">{s.chain}</TD>
                  <TD><span className="font-mono text-xs text-muted-foreground">{shortAddr(s.address)}</span></TD>
                  <TD><Badge tone="muted">{s.threshold}</Badge></TD>
                  <TD className="text-right font-medium tabular-nums">{formatAmount(s.balance, s.currency)} {s.currency}</TD>
                  <TD className="text-right">
                    {s.pendingTx > 0 ? <Badge tone="warning">{s.pendingTx}</Badge> : <span className="text-muted-foreground">0</span>}
                  </TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{s.nonce}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Drawer
        open={!!sel}
        onClose={() => setSel(null)}
        title={sel?.accountName}
        subtitle={sel ? `Multisig ${sel.threshold} · ${sel.chain}` : ''}
      >
        {sel && (
          <div className="space-y-6">
            <section>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Safe</p>
              <DetailRow label="Address"><span className="font-mono text-xs">{shortAddr(sel.address)}</span></DetailRow>
              <DetailRow label="Policy"><Badge tone="muted">{sel.threshold}</Badge></DetailRow>
              <DetailRow label="Balance"><span className="tabular-nums">{formatAmount(sel.balance, sel.currency)} {sel.currency}</span></DetailRow>
              <DetailRow label="Queued txns">{sel.pendingTx}</DetailRow>
              <DetailRow label="Nonce">{sel.nonce}</DetailRow>
              <DetailRow label="Created">{formatDate(sel.created)}</DetailRow>
            </section>
            <section>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Owners ({sel.owners.length}) · {sel.threshold} required
              </p>
              <div className="space-y-1.5">
                {sel.owners.map((o, i) => (
                  <div key={o} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-border bg-secondary/50 text-[10px] font-semibold">
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{shortAddr(o)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </div>
  )
}
