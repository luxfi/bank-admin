# bank-admin

White-label BaaS **admin console** for Lux Financial → `admin.lux.financial`
(deployment `lux-bank/bank-admin`, image `ghcr.io/luxfi/bank-admin`).
Investor demo, **sandbox only** — no real money, no real customer records.

## Stack

- Vite + React 19 + TypeScript + react-router v7
- Tailwind CSS v4 (`@tailwindcss/vite`)
- **@hanzo/ui design system** — true-black token set (oklch), Geist type,
  hairline borders. Tokens are lifted verbatim from `@hanzo/ui`
  `hanzo-default-colors.css` into `src/styles/theme.css`.
- **@hanzo/iam** — OIDC + PKCE against lux.id (the only auth source bankd
  accepts). Client `lux-bank`, redirect `${origin}/callback`, IAM proxied
  same-domain through bankd at `api.lux.financial/v1/iam`.

## Backend

`bankd` (github.com/luxfi/bank, Hanzo Base) at `api.lux.financial`:
- Base collections REST: `GET /v1/collections/{col}/records`
- Custom: `GET /v1/bank/accounts/{id}/balances`, `/v1/bank/health`
- Auth: Bearer IAM JWT (validated via lux.id JWKS). `balances/audit_log/fees`
  are superuser-only; `accounts/transactions/wallets/...` are public-read.

## Data

`src/lib/data.ts` is the one data provider. `VITE_DATA_SOURCE`:
- `sandbox` (default, deployed): faithful in-app dataset in bankd's exact
  collection shapes (`src/lib/sandbox.ts`). Never a Drive export.
- `live`: fetches bankd collections; falls back to sandbox when a collection
  is empty/forbidden so the demo never renders blank.

Sandbox-safe mutations (KYC approve/reject, card freeze, wallet freeze) update
an in-memory overlay and, in live mode, PATCH bankd.

## Modules

Overview · Customers (+KYC approve/reject) · Accounts (+balances) · Treasury ·
Cards (freeze/unfreeze) · Transactions · Compliance (read-only queue) ·
MPC·Safes (custody, testnet). All mobile-responsive.

## Build / deploy

- `pnpm install && pnpm build` → static `dist/`, served by `serve.mjs`
  (zero-dep Node static server, SPA fallback — no nginx/caddy) on `:3000`.
- CI: `.github/workflows/docker.yml` builds `ghcr.io/luxfi/bank-admin:vX.Y.Z`
  on `v*` tags (runs-on `lux-build-linux-amd64`). Semver only.
- Manifest: `universe/k8s/lux-k8s/bank-admin/deployment.yaml` — pin the semver
  tag (never sha, never latest).
