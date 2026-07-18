import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark } from '@/components/Brand'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons'
import { ADMIN_EMAIL, SANDBOX_LOGIN_ENABLED, setSession, verifyCredentials } from '@/lib/session'
import { cn } from '@/lib/cn'

// Two ways in, one identity. "Sign in with Lux ID" runs native Hanzo IAM
// (lux.id) OIDC + PKCE — the auth source bankd validates, and the path to a
// superuser bearer. The email + password form is an env-gated admin gate for
// the sandbox demo (accepts the configured admin credential only).
export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/', { replace: true })
  }, [isLoading, isAuthenticated, navigate])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (verifyCredentials(email, password)) {
      setSession(email.trim())
      navigate('/', { replace: true })
    } else {
      setErr(true)
    }
  }

  const field =
    'h-10 w-full rounded-lg border bg-secondary/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring'

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

          {SANDBOX_LOGIN_ENABLED && (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <div>
                <label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErr(false)
                  }}
                  placeholder={ADMIN_EMAIL}
                  className={cn('mt-1', field, err ? 'border-destructive' : 'border-border')}
                />
              </div>
              <div>
                <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErr(false)
                  }}
                  placeholder="••••••••••"
                  className={cn('mt-1', field, err ? 'border-destructive' : 'border-border')}
                />
              </div>
              {err && <p className="text-xs text-destructive">Incorrect email or password.</p>}
              <Button type="submit" variant="primary" className="h-10 w-full">
                Sign in
                <Icon name="chevronRight" size={16} />
              </Button>
            </form>
          )}

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="secondary" className="h-10 w-full" onClick={() => login()} disabled={isLoading}>
            <Icon name="shield" size={16} />
            {isLoading ? 'Loading…' : 'Sign in with Lux ID'}
          </Button>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/[0.06] px-3 py-2 text-xs text-warning">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            Sandbox environment — non-production demo data. No real money.
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Lux Financial · white-label banking-as-a-service
        </p>
      </div>
    </div>
  )
}
