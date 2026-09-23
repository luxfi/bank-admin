import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark } from '@/components/Brand'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons'
import { useBrand } from '@/lib/brand'

// One way in: Lux ID. Native Hanzo IAM (lux.id) OIDC + PKCE — the identity
// bankd validates. There is no password form here; a password checked in the
// browser is a password shipped to every visitor.
export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const brand = useBrand()

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/', { replace: true })
  }, [isLoading, isAuthenticated, navigate])

  return (
    <div className="bg-radial-glow grid min-h-full place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <Wordmark className="text-base" />
          <div className="mt-6">
            <h1 className="text-lg font-semibold text-foreground">Admin console</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage customers, treasury, cards, and compliance.
            </p>
          </div>

          <Button variant="primary" className="mt-6 h-10 w-full" onClick={() => login()} disabled={isLoading}>
            <Icon name="shield" size={16} />
            {isLoading ? 'Loading…' : 'Sign in with Lux ID'}
          </Button>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/[0.06] px-3 py-2 text-xs text-warning">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            Sandbox environment — non-production demo data. No real money.
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {brand.legal} · {brand.tagline}
        </p>
      </div>
    </div>
  )
}
