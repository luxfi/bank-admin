import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader, CardBody, Stat, Skeleton, Table, THead, TH, TBody, TR, TD, Avatar, Button } from '@/components/ui'
import { AreaTrend, ProportionBars } from '@/components/charts'
import { StatusBadge } from '@/components/StatusBadge'
import { useAsync } from '@/hooks/useAsync'
import { getOverview, getTransactions } from '@/lib/data'
import { formatCompact, formatNumber, formatAmount, relativeTime, initials } from '@/lib/format'
import { Icon } from '@/components/icons'
import { useBrand } from '@/lib/brand'

export function Overview() {
  const { data: ov, loading } = useAsync(getOverview)
  const { data: txs } = useAsync(getTransactions)
  const brand = useBrand()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        desc={`Portfolio health across the ${brand.product} sandbox.`}
        action={
          <Button icon="external" variant="secondary" onClick={() => window.open(`https://${brand.domain}`, '_blank')}>
            View bank
          </Button>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading || !ov ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Customers" value={formatNumber(ov.customers)} delta={{ value: `+${ov.customersDelta} wk`, up: true }} icon="users" />
            <Stat label="Total liquidity" value={formatCompact(ov.totalLiquidity)} icon="treasury" hint="USD-normalized" />
            <Stat label="30d volume" value={formatCompact(ov.volume30d)} delta={{ value: `${ov.volumeDelta}%`, up: true }} icon="tx" />
            <Stat label="Pending KYC" value={formatNumber(ov.pendingKyc)} icon="shield" hint="in review queue" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Volume trend */}
        <Card className="lg:col-span-2">
          <CardHeader title="Payment volume" desc="Settled volume, trailing 12 weeks (USD)" />
          <CardBody>
            {loading || !ov ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="mb-3 flex items-end gap-2">
                  <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatCompact(ov.volume30d)}</span>
                  <span className="mb-1 inline-flex items-center gap-0.5 text-xs font-medium text-success">
                    <Icon name="arrowUp" size={12} /> {ov.volumeDelta}%
                  </span>
                </div>
                <AreaTrend data={ov.volumeSeries} />
              </>
            )}
          </CardBody>
        </Card>

        {/* Currency mix */}
        <Card>
          <CardHeader title="Currency mix" desc="Liquidity by currency" />
          <CardBody>
            {loading || !ov ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
            ) : (
              <ProportionBars
                data={ov.currencyMix.map((c) => ({ label: c.currency, value: c.value, sub: formatCompact(c.value) }))}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {loading || !ov ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[104px]" />)
        ) : (
          <>
            <Stat label="Accounts" value={formatNumber(ov.accounts)} icon="wallet" />
            <Stat label="Cards issued" value={formatNumber(ov.cardsIssued)} icon="card" />
            <Stat label="MPC wallets" value={formatNumber(ov.mpcWallets)} icon="cpu" hint="testnet custody" />
            <Stat label="Safes" value={formatNumber(ov.safes)} icon="lock" hint="on-chain multisig" />
            <Stat label="Secrets" value={formatNumber(ov.secrets)} icon="key" hint="KMS · MPC-sharded" />
          </>
        )}
      </div>

      <Card>
        <CardHeader
          title="Recent activity"
          desc="Latest payments across all customers"
          action={
            <Link to="/transactions">
              <Button size="sm" variant="ghost" icon="chevronRight">
                All
              </Button>
            </Link>
          }
        />
        <Table>
          <THead>
            <TH>Customer</TH>
            <TH>Reference</TH>
            <TH className="text-right">Amount</TH>
            <TH>Status</TH>
            <TH className="text-right">When</TH>
          </THead>
          <TBody>
            {(txs ?? []).slice(0, 8).map((t) => (
              <TR key={t.id}>
                <TD>
                  <div className="flex items-center gap-2.5">
                    <Avatar label={initials(t.accountName ?? '?')} />
                    <span className="font-medium">{t.accountName}</span>
                  </div>
                </TD>
                <TD className="text-muted-foreground">{t.reference}</TD>
                <TD className="text-right font-medium tabular-nums">
                  <span className={t.direction === 'credit' ? 'text-success' : ''}>
                    {t.direction === 'credit' ? '+' : '−'}
                    {formatAmount(t.amount, t.currency)}
                  </span>
                </TD>
                <TD>
                  <StatusBadge status={t.status} />
                </TD>
                <TD className="text-right text-muted-foreground">{relativeTime(t.created)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  )
}
