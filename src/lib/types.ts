// Domain types mirror bankd's Base collections (accounts, balances,
// transactions, wallets, beneficiaries, conversions, audit_log, fees). The
// sandbox provider produces these exact shapes so switching VITE_DATA_SOURCE to
// `live` renders identically against api.lux.financial.

export type EntityType = 'individual' | 'business'
export type AccountStatus = 'active' | 'suspended' | 'closed'
export type KycStatus = 'approved' | 'pending' | 'rejected' | 'not_started'
export type RiskRating = 'low' | 'medium' | 'high'

export interface Account {
  id: string
  owner: string
  entityName: string
  entityType: EntityType
  country: string
  currency: string
  status: AccountStatus
  kycStatus: KycStatus
  riskRating: RiskRating
  email?: string
  created: string
}

export interface Balance {
  currency: string
  available: number // minor units
  held: number // minor units
}

export interface AccountBalances {
  accountId: string
  balances: Balance[]
}

export type TxType = 'payment' | 'deposit' | 'withdrawal' | 'conversion' | 'transfer' | 'fee'
export type TxStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Transaction {
  id: string
  account: string
  accountName?: string
  type: TxType
  direction: 'debit' | 'credit'
  amount: number // minor units
  currency: string
  status: TxStatus
  reference: string
  counterparty?: string
  created: string
}

export type WalletStatus = 'active' | 'provisioning' | 'frozen'

export interface Wallet {
  id: string
  account: string
  accountName?: string
  chain: string
  currency: string
  address: string
  walletId: string // mpc:<principal>
  threshold: string // e.g. "2/3"
  status: WalletStatus
  balance: number // minor units of `currency`
  created: string
}

export type CardStatus = 'active' | 'frozen' | 'pending'

export interface Card {
  id: string
  account: string
  accountName: string
  brand: 'visa' | 'mastercard'
  last4: string
  currency: string
  spendMtd: number // minor units
  limitMonthly: number // minor units
  status: CardStatus
  expiry: string // MM/YY
  created: string
}

export type ComplianceKind = 'kyc' | 'aml' | 'sanctions' | 'pep'
export type ComplianceStatus = 'open' | 'cleared' | 'escalated'

export interface ComplianceCase {
  id: string
  account: string
  accountName: string
  kind: ComplianceKind
  severity: 'low' | 'medium' | 'high'
  status: ComplianceStatus
  detail: string
  created: string
}

export interface Overview {
  customers: number
  customersDelta: number
  accounts: number
  totalLiquidity: number // minor units USD-normalized
  volume30d: number // minor units
  volumeDelta: number // percent
  pendingKyc: number
  cardsIssued: number
  mpcWallets: number
  volumeSeries: { label: string; value: number }[] // 12 buckets, minor units
  currencyMix: { currency: string; value: number }[] // minor units USD-normalized
}
