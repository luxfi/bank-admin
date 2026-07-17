import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark } from '@/components/Brand'
import { Button } from '@/components/ui'
import { Icon } from '@/components/icons'
import { SANDBOX_LOGIN_ENABLED, setSandboxSession, verifyPasscode } from '@/lib/session'
import { cn } from '@/lib/cn'

// Admin sign-in hands off to native Hanzo IAM (lux.id) via OIDC + PKCE — the
// only auth source bankd accepts. No local password. Superuser access to the
// admin collections is governed by IAM identity. A sandbox passcode gate
// (optional) lets investors reach the demo without a lux.id account.
export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [passcode, setPasscode] = useState('')
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/', { replace: true })
  }, [isLoading, isAuthenticated, navigate])

  function enterSandbox(e: React.FormEvent) {
    e.preventDefault()
    if (verifyPasscode(passcode)) {
      setSandboxSession()
      navigate('/', { replace: true })
    } else {
      setErr(true)
    }
  }

  return (
    <div className="bg-radial-glow grid min-h-full place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-2xl">
          <Wordmark className="text-base" />
          <div className="mt-6">
            <h1 className="text-lg font-semibold text-foreground">Admin console</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with Lux ID to manage customers, treasury, cards, and compliance.
            </p>
          </div>
          <Button
            variant="primary"
            className="mt-6 h-10 w-full"
            onClick={() => login()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading…' : 'Sign in with Lux ID'}
            {!isLoading && <Icon name="chevronRight" size={16} />}
          </Button>
          {SANDBOX_LOGIN_ENABLED && (
            <form onSubmit={enterSandbox} className="mt-6 border-t border-border pt-5">
              <label className="text-xs font-medium text-muted-foreground">Sandbox demo access</label>
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value)
                    setErr(false)
                  }}
                  placeholder="Demo passcode"
                  className={cn(
                    'h-9 w-full rounded-lg border bg-secondary/30 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring',
                    err ? 'border-destructive' : 'border-border',
                  )}
                />
                <Button type="submit" variant="secondary" className="h-9 shrink-0">
                  Enter
                </Button>
              </div>
              {err && <p className="mt-1.5 text-xs text-destructive">Incorrect passcode.</p>}
            </form>
          )}

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
