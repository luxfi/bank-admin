// Data provider. One cached dataset backs every page. In live mode it reads
// bankd's public-read collections (accounts/transactions/wallets from
// api.lux.financial) and derives the gated bits (balances/cards/compliance)
// deterministically over the live records — so the whole console reflects the
// seeded customers the moment they land. If live has no accounts yet (empty
// shared DB), it falls back to the full Sandbox dataset so the demo never
// blanks. Sandbox-safe mutations (KYC approve/reject, card/wallet freeze) apply
// an in-memory overlay and, in live mode, PATCH bankd. No real money moves.
import { listRecords, updateRecord } from './api'
import {
  buildSandboxAccounts,
  deriveBalances,
  deriveCards,
  deriveCompliance,
  deriveTransactions,
  deriveWallets,
  computeOverview,
  toUsdMinor,
} from './sandbox'
import type {
  Account, Balance, Card, ComplianceCase, KycStatus, Overview, Transaction, Wallet,
} from './types'

export type DataSource = 'sandbox' | 'live'
const CONFIGURED: DataSource =
  (import.meta.env.VITE_DATA_SOURCE as DataSource) === 'live' ? 'live' : 'sandbox'

interface Dataset {
  source: DataSource
  accounts: Account[]
  balancesByAccount: Map<string, Balance[]>
  transactions: Transaction[]
  cards: Card[]
  wallets: Wallet[]
  compliance: ComplianceCase[]
  overview: Overview
}

// Normalize a raw bankd account record into our Account shape (defaults for any
// fields a lean onboarding seed may omit).
function normalizeAccount(r: Record<string, unknown>): Account {
  const s = (k: string, d = '') => (typeof r[k] === 'string' ? (r[k] as string) : d)
  const entityType = s('entityType') === 'business' ? 'business' : 'individual'
  const currency = s('currency', 'USD') || 'USD'
  return {
    id: s('id'),
    owner: s('owner'),
    entityName: s('entityName') || s('name') || s('email') || 'Account',
    entityType,
    country: s('country', 'US') || 'US',
    currency,
    status: (['active', 'suspended', 'closed'].includes(s('status')) ? s('status') : 'active') as Account['status'],
    kycStatus: (['approved', 'pending', 'rejected', 'not_started'].includes(s('kycStatus')) ? s('kycStatus') : 'pending') as KycStatus,
    riskRating: (['low', 'medium', 'high'].includes(s('riskRating')) ? s('riskRating') : 'low') as Account['riskRating'],
    email: s('email') || undefined,
    created: s('created') || new Date().toISOString(),
  }
}

function assemble(source: DataSource, accounts: Account[], liveTx?: Transaction[], liveWallets?: Wallet[]): Dataset {
  const balancesByAccount = new Map<string, Balance[]>(accounts.map((a) => [a.id, deriveBalances(a)]))
  const transactions = liveTx && liveTx.length ? liveTx : deriveTransactions(accounts)
  const wallets = liveWallets && liveWallets.length ? liveWallets : deriveWallets(accounts)
  const cards = deriveCards(accounts)
  const compliance = deriveCompliance(accounts)
  const overview = computeOverview(accounts, balancesByAccount, transactions, cards, wallets)
  return { source, accounts, balancesByAccount, transactions, cards, wallets, compliance, overview }
}

function sandboxDataset(): Dataset {
  return assemble('sandbox', buildSandboxAccounts())
}

async function liveDataset(): Promise<Dataset | null> {
  // accounts are public-read; if empty the seed hasn't landed → caller falls back.
  const acctRes = await listRecords<Record<string, unknown>>('accounts', { perPage: 200, sort: '-created' })
  if (!acctRes.items || acctRes.items.length === 0) return null
  const accounts = acctRes.items.map(normalizeAccount).filter((a) => a.id)

  let liveTx: Transaction[] | undefined
  let liveWallets: Wallet[] | undefined
  const nameById = new Map(accounts.map((a) => [a.id, a.entityName]))
  try {
    const txRes = await listRecords<Record<string, unknown>>('transactions', { perPage: 200, sort: '-created' })
    if (txRes.items?.length) {
      liveTx = txRes.items.map((r) => {
        const g = (k: string, d = '') => (typeof r[k] === 'string' ? (r[k] as string) : d)
        const acct = g('account')
        return {
          id: g('id'), account: acct, accountName: nameById.get(acct) || g('accountName') || '—',
          type: (g('type', 'payment') as Transaction['type']),
          direction: (g('direction') === 'credit' ? 'credit' : 'debit') as Transaction['direction'],
          amount: Number(r['amount'] ?? 0), currency: g('currency', 'USD') || 'USD',
          status: (g('status', 'completed') as Transaction['status']),
          reference: g('reference') || g('type', 'Payment'), counterparty: g('counterparty') || undefined,
          created: g('created') || new Date().toISOString(),
        }
      })
    }
  } catch { /* transactions gated/absent → derive */ }
  try {
    const wRes = await listRecords<Record<string, unknown>>('wallets', { perPage: 200, sort: '-created' })
    if (wRes.items?.length) {
      liveWallets = wRes.items.map((r) => {
        const g = (k: string, d = '') => (typeof r[k] === 'string' ? (r[k] as string) : d)
        const acct = g('account')
        return {
          id: g('id'), account: acct, accountName: nameById.get(acct) || '—',
          chain: g('chain', 'Lux Q-Chain (testnet)') || 'Lux Q-Chain (testnet)',
          currency: g('currency', 'USDC') || 'USDC', address: g('address') || g('walletId'),
          walletId: g('walletId'), threshold: g('threshold', '2/3') || '2/3',
          status: (['active', 'provisioning', 'frozen'].includes(g('status')) ? g('status') : 'active') as Wallet['status'],
          balance: Number(r['balance'] ?? 0), created: g('created') || new Date().toISOString(),
        }
      })
    }
  } catch { /* wallets gated/absent → derive */ }

  return assemble('live', accounts, liveTx, liveWallets)
}

// Cached dataset (rebuilt on refresh()).
let cache: Promise<Dataset> | null = null
async function dataset(): Promise<Dataset> {
  if (!cache) {
    cache = (async () => {
      if (CONFIGURED === 'live') {
        try {
          const live = await liveDataset()
          if (live) return live
        } catch {
          /* live unreachable → sandbox */
        }
      }
      return sandboxDataset()
    })()
  }
  return cache
}
export function refresh(): void {
  cache = null
}

// Overlays for sandbox-safe admin actions.
const kycOverlay = new Map<string, KycStatus>()
const acctStatusOverlay = new Map<string, Account['status']>()
const cardOverlay = new Map<string, Card['status']>()
const walletOverlay = new Map<string, Wallet['status']>()

function applyAccount(a: Account): Account {
  return { ...a, kycStatus: kycOverlay.get(a.id) ?? a.kycStatus, status: acctStatusOverlay.get(a.id) ?? a.status }
}

// Resolved source (for the environment banner). Undefined until first load.
export async function getResolvedSource(): Promise<DataSource> {
  return (await dataset()).source
}
export const CONFIGURED_SOURCE = CONFIGURED

// ---- Reads ----

export async function getOverview(): Promise<Overview> {
  return (await dataset()).overview
}

export interface CustomerRow extends Account {
  totalUsd: number
  currencies: number
}

export async function getCustomers(): Promise<CustomerRow[]> {
  const d = await dataset()
  return d.accounts.map((a) => {
    const bals = d.balancesByAccount.get(a.id) ?? []
    const totalUsd = bals.reduce((s, b) => s + toUsdMinor(b.available + b.held, b.currency), 0)
    return { ...applyAccount(a), totalUsd, currencies: bals.length }
  })
}

export async function getAccounts(): Promise<CustomerRow[]> {
  return getCustomers()
}

export async function getBalances(accountId: string): Promise<{ accountId: string; balances: Balance[] }> {
  const d = await dataset()
  return { accountId, balances: d.balancesByAccount.get(accountId) ?? [] }
}

export interface TreasuryView {
  byCurrency: { currency: string; available: number; held: number; usd: number }[]
  totalUsd: number
  heldUsd: number
  accounts: number
}

export async function getTreasury(): Promise<TreasuryView> {
  const d = await dataset()
  const map = new Map<string, { available: number; held: number }>()
  for (const bals of d.balancesByAccount.values()) {
    for (const b of bals) {
      const cur = map.get(b.currency) ?? { available: 0, held: 0 }
      cur.available += b.available
      cur.held += b.held
      map.set(b.currency, cur)
    }
  }
  const byCurrency = Array.from(map.entries())
    .map(([currency, v]) => ({ currency, available: v.available, held: v.held, usd: toUsdMinor(v.available + v.held, currency) }))
    .sort((a, b) => b.usd - a.usd)
  return {
    byCurrency,
    totalUsd: byCurrency.reduce((s, c) => s + c.usd, 0),
    heldUsd: byCurrency.reduce((s, c) => s + toUsdMinor(c.held, c.currency), 0),
    accounts: d.balancesByAccount.size,
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  return (await dataset()).transactions
}

export async function getCards(): Promise<Card[]> {
  const d = await dataset()
  return d.cards.map((c) => ({ ...c, status: cardOverlay.get(c.id) ?? c.status }))
}

export async function getWallets(): Promise<Wallet[]> {
  const d = await dataset()
  return d.wallets.map((w) => ({ ...w, status: walletOverlay.get(w.id) ?? w.status }))
}

export async function getCompliance(): Promise<ComplianceCase[]> {
  return (await dataset()).compliance
}

// ---- Sandbox-safe mutations ----

export async function setKyc(accountId: string, status: KycStatus): Promise<void> {
  kycOverlay.set(accountId, status)
  if (status === 'rejected') acctStatusOverlay.set(accountId, 'suspended')
  if (status === 'approved') acctStatusOverlay.set(accountId, 'active')
  if (CONFIGURED === 'live') {
    try {
      await updateRecord('accounts', accountId, { kycStatus: status })
    } catch {
      /* overlay already applied; superuser bearer may be required for the write */
    }
  }
}

export async function setCardStatus(cardId: string, status: Card['status']): Promise<void> {
  cardOverlay.set(cardId, status)
}

export async function setWalletStatus(walletId: string, status: Wallet['status']): Promise<void> {
  walletOverlay.set(walletId, status)
}
