import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardBody, Table, THead, TH, TBody, TR, TD, Stat, Skeleton, Badge } from '@/components/ui'
import { ProportionBars } from '@/components/charts'
import { useAsync } from '@/hooks/useAsync'
import { getTreasury } from '@/lib/data'
import { formatAmount, formatCompact } from '@/lib/format'

export function Treasury() {
  const { data, loading } = useAsync(getTreasury)

  return (
    <div className="space-y-6">
      <PageHeader title="Treasury" desc="Aggregate liquidity and float across all customer balances (sandbox)." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Total liquidity" value={formatCompact(data.totalUsd)} icon="treasury" hint="USD-normalized" />
            <Stat label="Available" value={formatCompact(data.totalUsd - data.heldUsd)} icon="check" />
            <Stat label="Held / float" value={formatCompact(data.heldUsd)} icon="clock" hint="pending settlement" />
            <Stat label="Currencies" value={data.byCurrency.length} icon="wallet" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Balances by currency" desc="Available vs held, per settlement currency" />
          {loading || !data ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <Table>
              <THead>
                <TH>Currency</TH>
                <TH className="text-right">Available</TH>
                <TH className="text-right">Held</TH>
                <TH className="text-right">Total (USD)</TH>
                <TH className="text-right">Share</TH>
              </THead>
              <TBody>
                {data.byCurrency.map((c) => (
                  <TR key={c.currency}>
                    <TD>
                      <Badge tone="muted">{c.currency}</Badge>
                    </TD>
                    <TD className="text-right tabular-nums">{formatAmount(c.available, c.currency)}</TD>
                    <TD className="text-right tabular-nums text-muted-foreground">{formatAmount(c.held, c.currency)}</TD>
                    <TD className="text-right font-medium tabular-nums">{formatCompact(c.usd)}</TD>
                    <TD className="text-right tabular-nums text-muted-foreground">
                      {((c.usd / data.totalUsd) * 100).toFixed(1)}%
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Liquidity distribution" desc="By currency (USD)" />
          <CardBody>
            {loading || !data ? (
              <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
            ) : (
              <ProportionBars data={data.byCurrency.map((c) => ({ label: c.currency, value: c.usd, sub: formatCompact(c.usd) }))} />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
