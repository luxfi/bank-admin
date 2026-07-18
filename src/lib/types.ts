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
export type KeyShareHealth = 'healthy' | 'degraded' | 'rotating'

// MPC custody wallet: the signing key is split across N parties via threshold
// MPC — no single party ever holds the whole key.
export interface Wallet {
  id: string
  account: string
  accountName?: string
  chain: string
  currency: string
  address: string
  walletId: string // mpc:<principal>
  threshold: string // e.g. "2/3"
  parties: string[] // signer / party set holding the key shares
  keyShareHealth: KeyShareHealth
  lastSigned: string // ISO
  status: WalletStatus
  balance: number // minor units of `currency`
  created: string
}

// On-chain M-of-N multisig safe (Gnosis-Safe style). DIFFERENT from MPC:
// multisig owners are distinct on-chain signers; MPC is off-chain key-sharing.
export interface Safe {
  id: string
  account: string
  accountName: string
  chain: string
  address: string // 0x… contract address
  owners: string[] // 0x… owner addresses
  threshold: string // e.g. "3-of-5"
  currency: string
  balance: number // minor units
  pendingTx: number // queued transactions awaiting signatures
  nonce: number
  created: string
}

// KMS secret / passphrase / API key. Values are always masked (sandbox).
export type SecretType =
  | 'api_key'
  | 'passphrase'
  | 'signing_key'
  | 'certificate'
  | 'webhook_secret'
  | 'db_credential'
export type SecretStatus = 'active' | 'rotating' | 'revoked'

export interface KmsSecret {
  id: string
  name: string
  type: SecretType
  maskedValue: string // never a real value
  version: number
  rotation: string // e.g. "auto · 90d" | "manual"
  lastAccessed: string // ISO
  scope: string // policy / scope
  status: SecretStatus
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

// The tenant's own chain (a white-label bank can run its own L1).
export type NodeStatus = 'healthy' | 'syncing' | 'degraded' | 'offline'
export type NodeRole = 'validator' | 'full'

export interface ChainNode {
  id: string // NodeID-…
  region: string
  role: NodeRole
  status: NodeStatus
  version: string
  uptimePct: number
  peers: number
  blockHeight: number
}

export interface RecentBlock {
  height: number
  txs: number
  ageSec: number
  proposer: string
}

export interface ChainInfo {
  chainId: number
  consensus: string
  consensusHealth: 'healthy' | 'degraded'
  blockHeight: number
  blockTimeMs: number
  tps: number
  validators: number
  fullNodes: number
  finalizedPct: number
  rpcEndpoints: string[]
  throughput: number[] // recent tps buckets (sparkline)
  recentBlocks: RecentBlock[]
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
  safes: number
  secrets: number
  volumeSeries: { label: string; value: number }[] // 12 buckets, minor units
  currencyMix: { currency: string; value: number }[] // minor units USD-normalized
}
