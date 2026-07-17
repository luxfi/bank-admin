// Deterministic sandbox dataset — shapes match bankd's collections exactly, so
// this is a faithful mirror of the live schema (NOT an arbitrary mock, and NEVER
// a Drive export). Used to render the investor demo while the live sandbox DB is
// empty; the data provider prefers live bankd data whenever it is present.
import type {
  Account,
  AccountBalances,
  Balance,
  Card,
  ComplianceCase,
  Overview,
  Transaction,
  Wallet,
} from './types'

// --- deterministic PRNG (mulberry32) so the demo is stable across renders ---
function makeRng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = makeRng(0x9e3779b9)
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (lo: number, hi: number): number => Math.floor(lo + rand() * (hi - lo))
const id = (p: string) => p + Array.from({ length: 12 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(rand() * 36)]).join('')
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000 - between(0, 86400000)).toISOString()

// Approx FX → USD (minor units) for liquidity normalization.
const FX_USD: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, AED: 0.27, SGD: 0.74, JPY: 0.0064, CHF: 1.12, CAD: 0.73,
}
const toUsdMinor = (minor: number, ccy: string) => Math.round(minor * (FX_USD[ccy] ?? 1))

const BUSINESSES = [
  'Meridian Robotics', 'Northwind Freight', 'Halcyon Capital', 'Aperture Studios',
  'Solaris Energy', 'Vector Health', 'Ironwood Timber', 'Cobalt Semiconductors',
  'Lumen Payments', 'Atlas Logistics', 'Cedar Grove Foods', 'Quantum Textiles',
]
const PEOPLE = [
  'Amelia Chen', 'Marcus Delgado', 'Priya Nair', 'Tomás Herrera', 'Yuki Tanaka',
  'Fatima Al-Sayed', 'Lars Eriksson', 'Grace Okafor', 'Daniel Rossi', 'Noor Rahman',
  'Sofia Andersson', 'Elias Weber',
]
const COUNTRIES: Record<string, string> = {
  US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', AE: 'AED', SG: 'SGD', JP: 'JPY', CH: 'CHF', CA: 'CAD',
}
const CHAINS = ['Ethereum (Sepolia)', 'Base (Sepolia)', 'Lux Q-Chain (testnet)', 'Polygon (Amoy)']

function ethAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(rand() * 16)]).join('')
}

// ---- Accounts / Customers ----
function buildAccounts(): Account[] {
  const accounts: Account[] = []
  const countries = Object.keys(COUNTRIES)
  for (let i = 0; i < 26; i++) {
    const isBiz = rand() < 0.55
    const name = isBiz ? BUSINESSES[i % BUSINESSES.length] : PEOPLE[i % PEOPLE.length]
    const country = pick(countries)
    const currency = COUNTRIES[country]
    // KYC distribution: mostly approved, some pending, a few rejected.
    const kr = rand()
    const kycStatus = kr < 0.7 ? 'approved' : kr < 0.88 ? 'pending' : kr < 0.95 ? 'not_started' : 'rejected'
    const riskRating = rand() < 0.72 ? 'low' : rand() < 0.9 ? 'medium' : 'high'
    const status = kycStatus === 'rejected' ? 'suspended' : rand() < 0.96 ? 'active' : 'closed'
    accounts.push({
      id: id('acc_'),
      owner: id('usr_'),
      entityName: name + (isBiz ? '' : ''),
      entityType: isBiz ? 'business' : 'individual',
      country,
      currency,
      status,
      kycStatus,
      riskRating,
      email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
      created: daysAgo(between(2, 420)),
    })
  }
  return accounts.sort((a, b) => (a.created < b.created ? 1 : -1))
}

const ACCOUNTS = buildAccounts()

// ---- Balances (multi-currency per account) ----
function balancesFor(a: Account): Balance[] {
  const set = new Set<string>([a.currency])
  if (rand() < 0.6) set.add('USD')
  if (rand() < 0.35) set.add('EUR')
  if (rand() < 0.2) set.add(pick(['GBP', 'SGD', 'AED']))
  return Array.from(set).map((currency) => {
    const scale = a.entityType === 'business' ? between(2_000_00, 4_800_000_00) : between(50_00, 220_000_00)
    const available = scale
    const held = rand() < 0.4 ? Math.floor(available * (rand() * 0.15)) : 0
    return { currency, available, held }
  })
}
const BALANCES = new Map<string, Balance[]>(ACCOUNTS.map((a) => [a.id, balancesFor(a)]))

// ---- Transactions ----
const TX_TYPES: Transaction['type'][] = ['payment', 'deposit', 'withdrawal', 'conversion', 'transfer', 'fee']
function buildTransactions(): Transaction[] {
  const txs: Transaction[] = []
  for (let i = 0; i < 84; i++) {
    const a = pick(ACCOUNTS)
    const type = pick(TX_TYPES)
    const direction = type === 'deposit' ? 'credit' : type === 'withdrawal' || type === 'fee' ? 'debit' : pick(['debit', 'credit'] as const)
    const sr = rand()
    const status = sr < 0.68 ? 'completed' : sr < 0.82 ? 'processing' : sr < 0.92 ? 'pending' : sr < 0.97 ? 'failed' : 'cancelled'
    const amount = type === 'fee' ? between(2_00, 60_00) : between(120_00, 1_400_000_00)
    txs.push({
      id: id('txn_'),
      account: a.id,
      accountName: a.entityName,
      type,
      direction,
      amount,
      currency: a.currency,
      status,
      reference: pick(['Invoice', 'Payroll', 'Settlement', 'Vendor', 'FX', 'Top-up', 'Refund']) + ' ' + between(1000, 9999),
      counterparty: rand() < 0.5 ? pick(BUSINESSES) : pick(PEOPLE),
      created: daysAgo(between(0, 30)),
    })
  }
  return txs.sort((a, b) => (a.created < b.created ? 1 : -1))
}
const TRANSACTIONS = buildTransactions()

// ---- Cards (issued virtual cards, one or two per active business/individual) ----
function buildCards(): Card[] {
  const cards: Card[] = []
  for (const a of ACCOUNTS) {
    if (a.status !== 'active') continue
    if (rand() < 0.42) continue
    const n = a.entityType === 'business' ? between(1, 4) : 1
    for (let i = 0; i < n; i++) {
      const limit = a.entityType === 'business' ? between(25_000_00, 500_000_00) : between(2_000_00, 25_000_00)
      const cs = rand()
      cards.push({
        id: id('card_'),
        account: a.id,
        accountName: a.entityName,
        brand: rand() < 0.6 ? 'visa' : 'mastercard',
        last4: String(between(1000, 9999)),
        currency: a.currency,
        spendMtd: Math.floor(limit * rand() * 0.7),
        limitMonthly: limit,
        status: cs < 0.8 ? 'active' : cs < 0.93 ? 'frozen' : 'pending',
        expiry: `${String(between(1, 12)).padStart(2, '0')}/${between(27, 31)}`,
        created: daysAgo(between(1, 300)),
      })
    }
  }
  return cards.sort((a, b) => (a.created < b.created ? 1 : -1))
}
const CARDS = buildCards()

// ---- MPC / Safes (custody wallets, testnet) ----
function buildWallets(): Wallet[] {
  const wallets: Wallet[] = []
  for (const a of ACCOUNTS) {
    if (rand() < 0.5) continue
    const ws = rand()
    const currency = pick(['USDC', 'ETH', 'LUX'])
    const bal = between(500_00, 3_200_000_00)
    wallets.push({
      id: id('wal_'),
      account: a.id,
      accountName: a.entityName,
      chain: pick(CHAINS),
      currency,
      address: ethAddress(),
      walletId: 'mpc:' + a.owner,
      threshold: pick(['2/3', '3/5', '2/2']),
      status: ws < 0.78 ? 'active' : ws < 0.92 ? 'provisioning' : 'frozen',
      balance: bal,
      created: daysAgo(between(1, 260)),
    })
  }
  return wallets.sort((a, b) => (a.created < b.created ? 1 : -1))
}
const WALLETS = buildWallets()

// ---- Compliance queue (KYC/AML/sanctions/PEP) ----
function buildCompliance(): ComplianceCase[] {
  const cases: ComplianceCase[] = []
  for (const a of ACCOUNTS) {
    if (a.kycStatus === 'pending' || a.kycStatus === 'not_started') {
      cases.push({
        id: id('cmp_'),
        account: a.id,
        accountName: a.entityName,
        kind: 'kyc',
        severity: a.riskRating === 'high' ? 'high' : 'medium',
        status: 'open',
        detail: 'Identity verification awaiting document review',
        created: daysAgo(between(0, 12)),
      })
    }
  }
  // A few AML / sanctions / PEP hits on high-value flows.
  for (let i = 0; i < 8; i++) {
    const a = pick(ACCOUNTS.filter((x) => x.status === 'active'))
    const kind = pick(['aml', 'sanctions', 'pep'] as const)
    cases.push({
      id: id('cmp_'),
      account: a.id,
      accountName: a.entityName,
      kind,
      severity: pick(['low', 'medium', 'high'] as const),
      status: pick(['open', 'open', 'escalated', 'cleared'] as const),
      detail:
        kind === 'aml'
          ? 'Transaction above $10k AML threshold — screening'
          : kind === 'sanctions'
            ? 'Beneficiary matched watchlist candidate — manual review'
            : 'Politically-exposed person screening triggered',
      created: daysAgo(between(0, 20)),
    })
  }
  return cases.sort((a, b) => (a.created < b.created ? 1 : -1))
}
const COMPLIANCE = buildCompliance()

// ---- Overview / KPIs ----
function buildOverview(): Overview {
  const totalLiquidity = Array.from(BALANCES.values())
    .flat()
    .reduce((sum, b) => sum + toUsdMinor(b.available + b.held, b.currency), 0)
  const completed30d = TRANSACTIONS.filter((t) => t.status === 'completed')
  const volume30d = completed30d.reduce((s, t) => s + toUsdMinor(t.amount, t.currency), 0)

  // 12-bucket volume series (older → newer).
  const buckets = Array.from({ length: 12 }, (_, i) => ({ label: `W${i + 1}`, value: 0 }))
  for (const t of completed30d) {
    const b = between(0, 12)
    buckets[b].value += toUsdMinor(t.amount, t.currency)
  }
  // Smooth an upward trend for the demo.
  buckets.forEach((b, i) => (b.value = Math.max(b.value, Math.round((volume30d / 12) * (0.5 + i * 0.09)))))

  const mixMap = new Map<string, number>()
  for (const b of Array.from(BALANCES.values()).flat()) {
    mixMap.set(b.currency, (mixMap.get(b.currency) ?? 0) + toUsdMinor(b.available + b.held, b.currency))
  }
  const currencyMix = Array.from(mixMap.entries())
    .map(([currency, value]) => ({ currency, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return {
    customers: ACCOUNTS.length,
    customersDelta: between(2, 7),
    accounts: ACCOUNTS.length,
    totalLiquidity,
    volume30d,
    volumeDelta: between(6, 24),
    pendingKyc: ACCOUNTS.filter((a) => a.kycStatus === 'pending' || a.kycStatus === 'not_started').length,
    cardsIssued: CARDS.length,
    mpcWallets: WALLETS.length,
    volumeSeries: buckets,
    currencyMix,
  }
}

export const SANDBOX = {
  accounts: (): Account[] => ACCOUNTS,
  balances: (accountId: string): AccountBalances => ({
    accountId,
    balances: BALANCES.get(accountId) ?? [],
  }),
  allBalances: (): Map<string, Balance[]> => BALANCES,
  transactions: (): Transaction[] => TRANSACTIONS,
  cards: (): Card[] => CARDS,
  wallets: (): Wallet[] => WALLETS,
  compliance: (): ComplianceCase[] => COMPLIANCE,
  overview: (): Overview => buildOverview(),
  toUsdMinor,
}
