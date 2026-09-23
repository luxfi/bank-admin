// Native Hanzo IAM (lux.id) — the ONLY auth source for the bank (bankd logs
// "IAM is the only auth source"). OIDC + PKCE via @hanzo/iam. The console signs
// in through `lux-financial`, the public client every Lux Financial browser
// surface shares (luxfi/universe infra/k8s/iam/provision.yaml); `lux-bank` is
// bankd's service identity, never a browser's. Discovery/token/userinfo resolve
// through bankd's transparent /v1/iam proxy at api.lux.financial so no
// hand-rolled OAuth and no cross-origin surprises (proxy is CORS `*`).
import type { IAMConfig } from '@hanzo/iam/browser'

const API_BASE = (import.meta.env.VITE_BANK_API_URL as string) || 'https://api.lux.financial'
const origin = typeof window !== 'undefined' ? window.location.origin : 'https://admin.lux.financial'

export const IAM_CONFIG: IAMConfig = {
  serverUrl: `${API_BASE}/v1/iam`,
  clientId: 'lux-financial',
  redirectUri: `${origin}/auth/callback`,
  scope: 'openid profile email',
  proxyBaseUrl: API_BASE,
}

// The SDK stores the access token under this key (sessionStorage by default);
// the API client reads it to authorize requests to bankd.
export const IAM_TOKEN_KEY = 'hanzo_iam_access_token'
