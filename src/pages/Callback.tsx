import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { LuxMark } from '@/components/Brand'
import { Button } from '@/components/ui'

// OIDC redirect target. Exchanges the authorization code (PKCE) via the IAM SDK,
// then returns to the dashboard.
export function Callback() {
  const { handleCallback } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    handleCallback()
      .then(() => navigate('/', { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Sign-in failed'))
  }, [handleCallback, navigate])

  return (
    <div className="grid h-full place-items-center p-4">
      {error ? (
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-medium text-foreground">Sign-in could not complete</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <LuxMark size={28} className="animate-pulse text-foreground" />
          <p className="text-sm">Completing sign-in…</p>
        </div>
      )}
    </div>
  )
}
