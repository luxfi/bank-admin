// Deterministic data builders. Shapes match bankd's collections exactly. These
// pure builders are keyed off an accounts array so BOTH modes share them:
//   - sandbox mode: builds its own demo accounts, then derives the rest.
//   - live mode: passes the live bankd accounts, then derives the gated bits
//     (balances/cards/compliance) deterministically over the live records.
// Never a Drive export.
import { getBrand } from './brand'
import type {
  Account,
  AccountBalances,
  Balance,
  Card,
  ChainInfo,
  ChainNode,
  ComplianceCase,
  KmsSecret,
  Overview,
  Safe,
  Transaction,
  Wallet,
} from './types'

// --- deterministic PRNG, seedable per-key so derivations are stable ---
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Approx FX → USD (minor units) for liquidity normalization.
const FX_USD: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, AED: 0.27, SGD: 0.74, JPY: 0.0064, CHF: 1.12, CAD: 0.73, USDC: 1,
}
export const toUsdMinor = (minor: number, ccy: string) =>
  Math.round(minor * (FX_USD[(ccy || 'USD').toUpperCase()] ?? 1))

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
const COUNTRY_CCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', DE: 'EUR', FR: 'EUR', AE: 'AED', SG: 'SGD', JP: 'JPY', CH: 'CHF', CA: 'CAD',
}
const CHAINS = ['Ethereum (Sepolia)', 'Base (Sepolia)', 'Lux Q-Chain (testnet)', 'Polygon (Amoy)']

function ethAddress(r: () => number): string {
  return '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
}

// ---- Sandbox demo accounts (26) ----
export function buildSandboxAccounts(): Account[] {
  const r = mulberry32(0x9e3779b9)
  const id = (p: string) =>
    p + Array.from({ length: 12 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(r() * 36)]).join('')
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000 - Math.floor(r() * 86400000)).toISOString()
  const countries = Object.keys(COUNTRY_CCY)
  const out: Account[] = []
  for (let i = 0; i < 26; i++) {
    const isBiz = r() < 0.55
    const name = isBiz ? BUSINESSES[i % BUSINESSES.length] : PEOPLE[i % PEOPLE.length]
    const country = countries[Math.floor(r() * countries.length)]
    const currency = COUNTRY_CCY[country]
    const kr = r()
    const kycStatus = kr < 0.7 ? 'approved' : kr < 0.88 ? 'pending' : kr < 0.95 ? 'not_started' : 'rejected'
    const riskRating = r() < 0.72 ? 'low' : r() < 0.9 ? 'medium' : 'high'
    const status = kycStatus === 'rejected' ? 'suspended' : r() < 0.96 ? 'active' : 'closed'
    out.push({
      id: id('acc_'), owner: id('usr_'), entityName: name, entityType: isBiz ? 'business' : 'individual',
      country, currency, status, kycStatus, riskRating,
      email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
      created: daysAgo(2 + Math.floor(r() * 418)),
    })
  }
  return out.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- Balances (deterministic per account; balances collection is superuser-gated) ----
export function deriveBalances(a: Account): Balance[] {
  const r = mulberry32(hashSeed('bal:' + a.id))
  const set = new Set<string>([a.currency || 'USD'])
  if (r() < 0.6) set.add('USD')
  if (r() < 0.35) set.add('EUR')
  if (r() < 0.2) set.add(['GBP', 'SGD', 'AED'][Math.floor(r() * 3)])
  return Array.from(set).map((currency) => {
    const scale = a.entityType === 'business'
      ? 2_000_00 + Math.floor(r() * 4_798_000_00)
      : 50_00 + Math.floor(r() * 219_950_00)
    const held = r() < 0.4 ? Math.floor(scale * (r() * 0.15)) : 0
    return { currency, available: scale, held }
  })
}

// ---- Transactions (2–5 per account, deterministic) ----
const TX_TYPES: Transaction['type'][] = ['payment', 'deposit', 'withdrawal', 'conversion', 'transfer', 'fee']
export function deriveTransactions(accounts: Account[]): Transaction[] {
  const txs: Transaction[] = []
  for (const a of accounts) {
    const r = mulberry32(hashSeed('tx:' + a.id))
    const n = 2 + Math.floor(r() * 4)
    for (let i = 0; i < n; i++) {
      const type = TX_TYPES[Math.floor(r() * TX_TYPES.length)]
      const direction = type === 'deposit' ? 'credit' : type === 'withdrawal' || type === 'fee' ? 'debit' : r() < 0.5 ? 'debit' : 'credit'
      const sr = r()
      const status = sr < 0.68 ? 'completed' : sr < 0.82 ? 'processing' : sr < 0.92 ? 'pending' : sr < 0.97 ? 'failed' : 'cancelled'
      const amount = type === 'fee' ? 2_00 + Math.floor(r() * 58_00) : 120_00 + Math.floor(r() * 1_399_880_00)
      txs.push({
        id: 'txn_' + hashSeed(a.id + i).toString(36), account: a.id, accountName: a.entityName,
        type, direction, amount, currency: a.currency || 'USD', status,
        reference: ['Invoice', 'Payroll', 'Settlement', 'Vendor', 'FX', 'Top-up', 'Refund'][Math.floor(r() * 7)] + ' ' + (1000 + Math.floor(r() * 8999)),
        counterparty: r() < 0.5 ? BUSINESSES[Math.floor(r() * BUSINESSES.length)] : PEOPLE[Math.floor(r() * PEOPLE.length)],
        created: new Date(Date.now() - Math.floor(r() * 30) * 86400000 - Math.floor(r() * 86400000)).toISOString(),
      })
    }
  }
  return txs.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- Cards (deterministic per account) ----
export function deriveCards(accounts: Account[]): Card[] {
  const cards: Card[] = []
  for (const a of accounts) {
    if (a.status !== 'active') continue
    const r = mulberry32(hashSeed('card:' + a.id))
    if (r() < 0.42) continue
    const n = a.entityType === 'business' ? 1 + Math.floor(r() * 3) : 1
    for (let i = 0; i < n; i++) {
      const limit = a.entityType === 'business' ? 25_000_00 + Math.floor(r() * 475_000_00) : 2_000_00 + Math.floor(r() * 23_000_00)
      const cs = r()
      cards.push({
        id: 'card_' + hashSeed(a.id + 'c' + i).toString(36), account: a.id, accountName: a.entityName,
        brand: r() < 0.6 ? 'visa' : 'mastercard', last4: String(1000 + Math.floor(r() * 8999)),
        currency: a.currency || 'USD', spendMtd: Math.floor(limit * r() * 0.7), limitMonthly: limit,
        status: cs < 0.8 ? 'active' : cs < 0.93 ? 'frozen' : 'pending',
        expiry: `${String(1 + Math.floor(r() * 11)).padStart(2, '0')}/${27 + Math.floor(r() * 4)}`,
        created: new Date(Date.now() - Math.floor(r() * 300) * 86400000).toISOString(),
      })
    }
  }
  return cards.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- MPC custody wallets (threshold key-sharing; no single party holds the key) ----
const MPC_PARTIES = [
  'Lux Node α', 'Lux Node β', 'Custody HSM', 'Partner Co-signer',
  'Recovery Vault', 'Compliance Signer', 'Cold Reserve',
]
export function deriveWallets(accounts: Account[]): Wallet[] {
  const wallets: Wallet[] = []
  for (const a of accounts) {
    const r = mulberry32(hashSeed('wal:' + a.id))
    if (r() < 0.5) continue
    const ws = r()
    const threshold = ['2/3', '3/5', '2/2'][Math.floor(r() * 3)]
    const n = Number(threshold.split('/')[1])
    const parties = MPC_PARTIES.slice(0, n)
    const hr = r()
    wallets.push({
      id: 'wal_' + hashSeed(a.id + 'w').toString(36),
      account: a.id,
      accountName: a.entityName,
      chain: CHAINS[Math.floor(r() * CHAINS.length)],
      currency: ['USDC', 'ETH', 'LUX'][Math.floor(r() * 3)],
      address: ethAddress(r),
      walletId: 'mpc:' + a.owner,
      threshold,
      parties,
      keyShareHealth: hr < 0.82 ? 'healthy' : hr < 0.93 ? 'rotating' : 'degraded',
      lastSigned: new Date(Date.now() - Math.floor(r() * 72) * 3600000).toISOString(),
      status: ws < 0.78 ? 'active' : ws < 0.92 ? 'provisioning' : 'frozen',
      balance: 500_00 + Math.floor(r() * 3_199_500_00),
      created: new Date(Date.now() - Math.floor(r() * 260) * 86400000).toISOString(),
    })
  }
  return wallets.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- Safes (on-chain M-of-N multisig; distinct on-chain owners) ----
// The bank runs its own treasury multisigs (always present) plus per-customer
// safes derived over the accounts.
const HOUSE_SAFES = [
  { name: 'Operating Treasury', threshold: '3-of-5', n: 5 },
  { name: 'Settlement Reserve', threshold: '4-of-7', n: 7 },
  { name: 'Fee Collection', threshold: '2-of-3', n: 3 },
]
export function deriveSafes(accounts: Account[]): Safe[] {
  const safes: Safe[] = HOUSE_SAFES.map((h) => {
    const r = mulberry32(hashSeed('house:' + h.name))
    return {
      id: 'safe_' + hashSeed(h.name).toString(36),
      account: 'house',
      accountName: h.name,
      chain: CHAINS[Math.floor(r() * CHAINS.length)],
      address: ethAddress(r),
      owners: Array.from({ length: h.n }, () => ethAddress(r)),
      threshold: h.threshold,
      currency: ['USDC', 'ETH', 'LUX', 'DAI'][Math.floor(r() * 4)],
      balance: 500_000_00 + Math.floor(r() * 24_000_000_00),
      pendingTx: r() < 0.6 ? Math.floor(r() * 3) : 0,
      nonce: Math.floor(r() * 500),
      created: new Date(Date.now() - Math.floor(r() * 400) * 86400000).toISOString(),
    }
  })
  for (const a of accounts) {
    const r = mulberry32(hashSeed('safe:' + a.id))
    // Businesses commonly run a treasury multisig; a few individuals too.
    if (a.entityType === 'business' ? r() < 0.4 : r() < 0.85) continue
    const nOwners = [3, 4, 5, 5, 7][Math.floor(r() * 5)]
    const m = Math.max(2, Math.min(nOwners, Math.round(nOwners * (0.55 + r() * 0.15))))
    const owners = Array.from({ length: nOwners }, () => ethAddress(r))
    safes.push({
      id: 'safe_' + hashSeed(a.id + 's').toString(36),
      account: a.id,
      accountName: a.entityName,
      chain: CHAINS[Math.floor(r() * CHAINS.length)],
      address: ethAddress(r),
      owners,
      threshold: `${m}-of-${nOwners}`,
      currency: ['USDC', 'ETH', 'LUX', 'DAI'][Math.floor(r() * 4)],
      balance: 10_000_00 + Math.floor(r() * 8_400_000_00),
      pendingTx: r() < 0.55 ? Math.floor(r() * 4) : 0,
      nonce: Math.floor(r() * 240),
      created: new Date(Date.now() - Math.floor(r() * 300) * 86400000).toISOString(),
    })
  }
  return safes.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- KMS secrets (org-level; values always masked; master key is MPC-sharded) ----
export const KMS_MASTER = {
  scheme: 'MPC 3-of-5',
  detail: 'Master key is threshold-sharded across 5 custodians — no single party holds it.',
  custodians: ['Lux Node α', 'Lux Node β', 'Custody HSM', 'Partner Co-signer', 'Recovery Vault'],
}
type SecretSeed = { name: string; type: KmsSecret['type']; scope: string; prefix: string }
const KMS_SEEDS: SecretSeed[] = [
  { name: 'bankd-jwt-signing', type: 'signing_key', scope: 'bankd · global', prefix: 'ed25519' },
  { name: 'currencycloud-api', type: 'api_key', scope: 'payments', prefix: 'cc_live' },
  { name: 'ifx-settlement-hmac', type: 'webhook_secret', scope: 'payments', prefix: 'whsec' },
  { name: 'sendgrid-api', type: 'api_key', scope: 'notifications', prefix: 'SG' },
  { name: 'kyc-provider-key', type: 'api_key', scope: 'compliance', prefix: 'kyc_live' },
  { name: 'postgres-primary', type: 'db_credential', scope: 'data', prefix: 'pg' },
  { name: 'recaptcha-secret', type: 'passphrase', scope: 'onboarding', prefix: 'rc' },
  { name: 'tls-lux-financial', type: 'certificate', scope: 'edge', prefix: 'x509' },
  { name: 'mpc-coordinator-key', type: 'signing_key', scope: 'custody · mpc', prefix: 'mldsa' },
  { name: 'webhook-payments-callback', type: 'webhook_secret', scope: 'payments', prefix: 'whsec' },
  { name: 'sanctions-screening-api', type: 'api_key', scope: 'compliance', prefix: 'san_live' },
  { name: 'backup-encryption-pass', type: 'passphrase', scope: 'data · backups', prefix: 'age' },
]
function mask(prefix: string, r: () => number): string {
  const tail = Array.from({ length: 4 }, () => '0123456789abcdef'[Math.floor(r() * 16)]).join('')
  return `${prefix}_••••••••${tail}`
}
export function deriveKmsSecrets(): KmsSecret[] {
  return KMS_SEEDS.map((s) => {
    const r = mulberry32(hashSeed('kms:' + s.name))
    const sr = r()
    return {
      id: 'sec_' + hashSeed(s.name).toString(36),
      name: s.name,
      type: s.type,
      maskedValue: mask(s.prefix, r),
      version: 1 + Math.floor(r() * 9),
      rotation: r() < 0.6 ? `auto · ${[30, 60, 90][Math.floor(r() * 3)]}d` : 'manual',
      lastAccessed: new Date(Date.now() - Math.floor(r() * 96) * 3600000).toISOString(),
      scope: s.scope,
      status: sr < 0.8 ? 'active' : sr < 0.94 ? 'rotating' : 'revoked',
      created: new Date(Date.now() - Math.floor(r() * 400) * 86400000).toISOString(),
    }
  })
}

// ---- Compliance queue ----
export function deriveCompliance(accounts: Account[]): ComplianceCase[] {
  const cases: ComplianceCase[] = []
  for (const a of accounts) {
    if (a.kycStatus === 'pending' || a.kycStatus === 'not_started') {
      cases.push({
        id: 'cmp_' + hashSeed('k' + a.id).toString(36), account: a.id, accountName: a.entityName,
        kind: 'kyc', severity: a.riskRating === 'high' ? 'high' : 'medium', status: 'open',
        detail: 'Identity verification awaiting document review',
        created: new Date(Date.now() - (hashSeed(a.id) % 12) * 86400000).toISOString(),
      })
    }
  }
  const active = accounts.filter((x) => x.status === 'active')
  for (let i = 0; i < Math.min(8, active.length); i++) {
    const a = active[(i * 3 + 1) % active.length]
    const r = mulberry32(hashSeed('aml:' + a.id + i))
    const kind = (['aml', 'sanctions', 'pep'] as const)[Math.floor(r() * 3)]
    cases.push({
      id: 'cmp_' + hashSeed('a' + a.id + i).toString(36), account: a.id, accountName: a.entityName,
      kind, severity: (['low', 'medium', 'high'] as const)[Math.floor(r() * 3)],
      status: (['open', 'open', 'escalated', 'cleared'] as const)[Math.floor(r() * 4)],
      detail: kind === 'aml' ? 'Transaction above $10k AML threshold — screening'
        : kind === 'sanctions' ? 'Beneficiary matched watchlist candidate — manual review'
          : 'Politically-exposed person screening triggered',
      created: new Date(Date.now() - Math.floor(r() * 20) * 86400000).toISOString(),
    })
  }
  return cases.sort((a, b) => (a.created < b.created ? 1 : -1))
}

// ---- Nodes / tenant chain (the bank's own L1; testnet, sandbox) ----
const REGIONS = ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-southeast-1', 'sa-east-1', 'me-central-1']
const NODE_VERSION = 'luxd v1.13.4'
function nodeId(r: () => number): string {
  return 'NodeID-' + Array.from({ length: 16 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'[Math.floor(r() * 32)]).join('')
}
export function deriveNodes(): ChainNode[] {
  const r = mulberry32(hashSeed('nodes:v1'))
  const height = 4_812_000 + Math.floor(r() * 40_000)
  const nodes: ChainNode[] = []
  const layout: ChainNode['role'][] = ['validator', 'validator', 'validator', 'validator', 'validator', 'full', 'full']
  layout.forEach((role, i) => {
    const sr = r()
    const status: ChainNode['status'] = sr < 0.82 ? 'healthy' : sr < 0.92 ? 'syncing' : sr < 0.98 ? 'degraded' : 'offline'
    nodes.push({
      id: nodeId(r),
      region: REGIONS[i % REGIONS.length],
      role,
      status,
      version: NODE_VERSION,
      uptimePct: status === 'offline' ? 0 : 99.0 + r(),
      peers: 8 + Math.floor(r() * 40),
      blockHeight: status === 'syncing' ? height - Math.floor(r() * 2000) : height - Math.floor(r() * 6),
    })
  })
  return nodes
}

export function deriveChainInfo(): ChainInfo {
  const r = mulberry32(hashSeed('chain:v1'))
  const dom = getBrand().domain
  const nodes = deriveNodes()
  const height = Math.max(...nodes.map((n) => n.blockHeight))
  const validators = nodes.filter((n) => n.role === 'validator').length
  const proposers = nodes.filter((n) => n.role === 'validator').map((n) => n.id)
  const recentBlocks = Array.from({ length: 8 }, (_, i) => ({
    height: height - i,
    txs: Math.floor(r() * 240),
    ageSec: i * 2 + Math.floor(r() * 2),
    proposer: proposers[Math.floor(r() * proposers.length)],
  }))
  const throughput = Array.from({ length: 24 }, () => Math.floor(40 + r() * 200))
  return {
    chainId: 88153,
    consensus: 'Lux · Snowman++ (BFT)',
    consensusHealth: nodes.filter((n) => n.status === 'offline').length > 1 ? 'degraded' : 'healthy',
    blockHeight: height,
    blockTimeMs: 1800 + Math.floor(r() * 400),
    tps: throughput[throughput.length - 1],
    validators,
    fullNodes: nodes.length - validators,
    finalizedPct: 100,
    rpcEndpoints: [`https://rpc.testnet.${dom}/v1/chain/C/rpc`, `wss://rpc.testnet.${dom}/v1/chain/C/ws`],
    throughput,
    recentBlocks,
  }
}

// ---- Overview KPIs (computed from whatever dataset is active) ----
export function computeOverview(
  accounts: Account[],
  balancesByAccount: Map<string, Balance[]>,
  transactions: Transaction[],
  cards: Card[],
  wallets: Wallet[],
  safes: number,
  secrets: number,
): Overview {
  const totalLiquidity = Array.from(balancesByAccount.values()).flat()
    .reduce((s, b) => s + toUsdMinor(b.available + b.held, b.currency), 0)
  const completed = transactions.filter((t) => t.status === 'completed')
  const volume30d = completed.reduce((s, t) => s + toUsdMinor(t.amount, t.currency), 0)

  const buckets = Array.from({ length: 12 }, (_, i) => ({ label: `W${i + 1}`, value: 0 }))
  completed.forEach((t, i) => {
    buckets[i % 12].value += toUsdMinor(t.amount, t.currency)
  })
  buckets.forEach((b, i) => (b.value = Math.max(b.value, Math.round((volume30d / 12) * (0.5 + i * 0.09)))))

  const mix = new Map<string, number>()
  for (const b of Array.from(balancesByAccount.values()).flat()) {
    mix.set(b.currency, (mix.get(b.currency) ?? 0) + toUsdMinor(b.available + b.held, b.currency))
  }
  const currencyMix = Array.from(mix.entries())
    .map(([currency, value]) => ({ currency, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return {
    customers: accounts.length,
    customersDelta: 2 + (hashSeed('delta' + accounts.length) % 6),
    accounts: accounts.length,
    totalLiquidity,
    volume30d,
    volumeDelta: 6 + (hashSeed('vd' + accounts.length) % 18),
    pendingKyc: accounts.filter((a) => a.kycStatus === 'pending' || a.kycStatus === 'not_started').length,
    cardsIssued: cards.length,
    mpcWallets: wallets.length,
    safes,
    secrets,
    volumeSeries: buckets,
    currencyMix,
  }
}

export type { AccountBalances }
