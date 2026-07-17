// Sandbox demo session. The admin's first-class auth is Hanzo IAM (lux.id) —
// see hooks/useAuth. But this is an investor SANDBOX demo, and investors do not
// hold lux.id accounts, so an optional passcode gate (enabled by
// VITE_SANDBOX_LOGIN) grants a sandbox-only session. It is still a gate (shared
// secret) — never unauthenticated — and unlocks nothing but sandbox data.
const KEY = 'lux_admin_sandbox_session'

export const SANDBOX_LOGIN_ENABLED = String(import.meta.env.VITE_SANDBOX_LOGIN ?? 'true') === 'true'
const PASSCODE = (import.meta.env.VITE_SANDBOX_PASSCODE as string) || 'lux-sandbox'

export function verifyPasscode(input: string): boolean {
  return SANDBOX_LOGIN_ENABLED && input.trim() === PASSCODE
}

export function setSandboxSession(): void {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* ignore */
  }
}

export function hasSandboxSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function clearSandboxSession(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
