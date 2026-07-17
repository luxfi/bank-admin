// Data provider. One source of truth for every page. Prefers LIVE bankd when
// VITE_DATA_SOURCE=live (fetches api.lux.financial collections + /v1/bank);
// otherwise serves the faithful Sandbox mirror. Sandbox-safe mutations
// (KYC approve/reject, card freeze, wallet freeze) update an in-memory overlay
// and, in live mode, PATCH bankd. No real money moves — sandbox only.
import { listRecords, getAccountBalances as fetchBalances, updateRecord } from './api'
import { SANDBOX } from './sandbox'
import type {
  Account, AccountBalances, Card, ComplianceCase, KycStatus, Overview, Transaction, Wallet,
} from './types'

export type DataSource = 'sandbox' | 'live'
export const DATA_SOURCE: DataSource =
  (import.meta.env.VITE_DATA_SOURCE as DataSource) === 'live' ? 'live' : 'sandbox'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

// In-memory sandbox overlays so admin actions reflect immediately.
const kycOverlay = new Map<string, KycStatus>()
const acctStatusOverlay = new Map<string, Account['status']>()
const cardOverlay = new Map<string, Card['status']>()
const walletOverlay = new Map<string, Wallet['status']>()

function applyAccount(a: Account): Account {
  return {
    ...a,
    kycStatus: kycOverlay.get(a.id) ?? a.kycStatus,
    status: acctStatusOverlay.get(a.id) ?? a.status,
  }
}

// ---- Reads ----

export async function getOverview(): Promise<Overview> {
  await delay(120)
  return SANDBOX.overview()
}

export interface CustomerRow extends Account {
  totalUsd: number
  currencies: number
}

export async function getCustomers(): Promise<CustomerRow[]> {
  if (DATA_SOURCE === 'live') {
    const res = await listRecords<Account>('accounts', { perPage: 200, sort: '-created' })
    if (res.items.length > 0) {
      return res.items.map((a) => ({ ...a, totalUsd: 0, currencies: 1 }))
    }
  }
  await delay(120)
  return SANDBOX.accounts().map((a) => {
    const bals = SANDBOX.balances(a.id).balances
    const totalUsd = bals.reduce((s, b) => s + SANDBOX.toUsdMinor(b.available + b.held, b.currency), 0)
    return { ...applyAccount(a), totalUsd, currencies: bals.length }
  })
}

export async function getAccounts(): Promise<CustomerRow[]> {
  return getCustomers()
}

export async function getBalances(accountId: string): Promise<AccountBalances> {
  if (DATA_SOURCE === 'live') {
    try {
      const raw = await fetchBalances(accountId)
      if (raw.length) return { accountId, balances: raw }
    } catch {
      /* fall through to sandbox */
    }
  }
  await delay(80)
  return SANDBOX.balances(accountId)
}

export interface TreasuryView {
  byCurrency: { currency: string; available: number; held: number; usd: number }[]
  totalUsd: number
  heldUsd: number
  accounts: number
}

export async function getTreasury(): Promise<TreasuryView> {
  await delay(120)
  const map = new Map<string, { available: number; held: number }>()
  for (const bals of SANDBOX.allBalances().values()) {
    for (const b of bals) {
      const cur = map.get(b.currency) ?? { available: 0, held: 0 }
      cur.available += b.available
      cur.held += b.held
      map.set(b.currency, cur)
    }
  }
  const byCurrency = Array.from(map.entries())
    .map(([currency, v]) => ({
      currency,
      available: v.available,
      held: v.held,
      usd: SANDBOX.toUsdMinor(v.available + v.held, currency),
    }))
    .sort((a, b) => b.usd - a.usd)
  return {
    byCurrency,
    totalUsd: byCurrency.reduce((s, c) => s + c.usd, 0),
    heldUsd: byCurrency.reduce((s, c) => s + SANDBOX.toUsdMinor(c.held, c.currency), 0),
    accounts: SANDBOX.allBalances().size,
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  if (DATA_SOURCE === 'live') {
    const res = await listRecords<Transaction>('transactions', { perPage: 200, sort: '-created' })
    if (res.items.length > 0) return res.items
  }
  await delay(120)
  return SANDBOX.transactions()
}

export async function getCards(): Promise<Card[]> {
  await delay(120)
  return SANDBOX.cards().map((c) => ({ ...c, status: cardOverlay.get(c.id) ?? c.status }))
}

export async function getWallets(): Promise<Wallet[]> {
  if (DATA_SOURCE === 'live') {
    const res = await listRecords<Wallet>('wallets', { perPage: 200, sort: '-created' })
    if (res.items.length > 0) return res.items
  }
  await delay(120)
  return SANDBOX.wallets().map((w) => ({ ...w, status: walletOverlay.get(w.id) ?? w.status }))
}

export async function getCompliance(): Promise<ComplianceCase[]> {
  await delay(120)
  return SANDBOX.compliance()
}

// ---- Sandbox-safe mutations ----

export async function setKyc(accountId: string, status: KycStatus): Promise<void> {
  kycOverlay.set(accountId, status)
  if (status === 'rejected') acctStatusOverlay.set(accountId, 'suspended')
  if (status === 'approved') acctStatusOverlay.set(accountId, 'active')
  if (DATA_SOURCE === 'live') {
    try {
      await updateRecord('accounts', accountId, { kycStatus: status })
    } catch {
      /* sandbox overlay already applied */
    }
  }
  await delay(200)
}

export async function setCardStatus(cardId: string, status: Card['status']): Promise<void> {
  cardOverlay.set(cardId, status)
  await delay(180)
}

export async function setWalletStatus(walletId: string, status: Wallet['status']): Promise<void> {
  walletOverlay.set(walletId, status)
  await delay(180)
}
