import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardBody, Table, THead, TH, TBody, TR, TD, Badge, Skeleton, Stat, EmptyState } from '@/components/ui'
import { SparkBars } from '@/components/charts'
import { useAsync } from '@/hooks/useAsync'
import { getNodes, getChainInfo } from '@/lib/data'
import { useBrand } from '@/lib/brand'
import { formatNumber } from '@/lib/format'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { NodeStatus } from '@/lib/types'

const statusTone: Record<NodeStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  healthy: 'success',
  syncing: 'info',
  degraded: 'warning',
  offline: 'danger',
}

function shortId(id: string): string {
  return id.length > 18 ? `${id.slice(0, 12)}…${id.slice(-4)}` : id
}

export function Nodes() {
  const brand = useBrand()
  const { data: chain, loading: cl } = useAsync(getChainInfo)
  const { data: nodes, loading: nl } = useAsync(getNodes)

  function copy(t: string) {
    navigator.clipboard?.writeText(t).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nodes"
        desc={`${brand.product} chain — validator fleet, consensus health, and throughput. Testnet, sandbox.`}
      />

      {/* Chain summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cl || !chain ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Block height" value={`#${formatNumber(chain.blockHeight)}`} icon="server" hint={`chain ${chain.chainId}`} />
            <Stat label="Throughput" value={`${chain.tps} tps`} icon="activity" hint={`${chain.blockTimeMs}ms blocks`} />
            <Stat label="Validators" value={formatNumber(chain.validators)} icon="cpu" hint={`${chain.fullNodes} full nodes`} />
            <Stat
              label="Consensus"
              value={chain.consensusHealth === 'healthy' ? 'Healthy' : 'Degraded'}
              icon="shield"
              hint={`${chain.finalizedPct}% finalized`}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Throughput + consensus */}
        <Card className="lg:col-span-2">
          <CardHeader title="Consensus" desc={chain?.consensus ?? '—'} />
          <CardBody>
            {cl || !chain ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-3xl font-semibold tabular-nums">{chain.tps} <span className="text-base font-normal text-muted-foreground">tps</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chain.blockTimeMs}ms block time · {chain.finalizedPct}% finalized · {chain.validators}-validator BFT
                  </p>
                </div>
                <SparkBars data={chain.throughput} className="h-16 w-1/2" />
              </div>
            )}
          </CardBody>
        </Card>

        {/* RPC endpoints */}
        <Card>
          <CardHeader title="RPC endpoints" desc="Public testnet" />
          <CardBody className="space-y-2">
            {cl || !chain
              ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-9" />)
              : chain.rpcEndpoints.map((ep) => (
                  <button
                    key={ep}
                    onClick={() => copy(ep)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-left text-xs hover:bg-accent"
                    title="Copy endpoint"
                  >
                    <span className="truncate font-mono text-muted-foreground">{ep}</span>
                    <Icon name="copy" size={13} />
                  </button>
                ))}
          </CardBody>
        </Card>
      </div>

      {/* Node fleet */}
      <Card>
        <CardHeader title="Node fleet" desc="Validators and full nodes across regions" />
        {nl || !nodes ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : nodes.length === 0 ? (
          <EmptyState icon="server" title="No nodes" />
        ) : (
          <Table>
            <THead>
              <TH>Node ID</TH>
              <TH>Region</TH>
              <TH>Role</TH>
              <TH>Version</TH>
              <TH className="text-right">Uptime</TH>
              <TH className="text-right">Peers</TH>
              <TH className="text-right">Height</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {nodes.map((n) => (
                <TR key={n.id}>
                  <TD><span className="font-mono text-xs text-muted-foreground">{shortId(n.id)}</span></TD>
                  <TD className="text-muted-foreground">{n.region}</TD>
                  <TD><Badge tone={n.role === 'validator' ? 'info' : 'muted'}>{n.role}</Badge></TD>
                  <TD className="text-muted-foreground">{n.version}</TD>
                  <TD className="text-right tabular-nums">{n.uptimePct.toFixed(2)}%</TD>
                  <TD className="text-right tabular-nums text-muted-foreground">{n.peers}</TD>
                  <TD className="text-right tabular-nums">#{formatNumber(n.blockHeight)}</TD>
                  <TD><Badge tone={statusTone[n.status]} dot>{n.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Latest blocks */}
      <Card>
        <CardHeader title="Latest blocks" desc="Most recent proposed blocks" />
        {cl || !chain ? (
          <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
        ) : (
          <Table>
            <THead>
              <TH>Block</TH>
              <TH className="text-right">Txns</TH>
              <TH>Proposer</TH>
              <TH className="text-right">Age</TH>
            </THead>
            <TBody>
              {chain.recentBlocks.map((b) => (
                <TR key={b.height}>
                  <TD className="font-medium tabular-nums">#{formatNumber(b.height)}</TD>
                  <TD className="text-right tabular-nums">{b.txs}</TD>
                  <TD><span className="font-mono text-xs text-muted-foreground">{shortId(b.proposer)}</span></TD>
                  <TD className={cn('text-right text-muted-foreground')}>{b.ageSec}s ago</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
