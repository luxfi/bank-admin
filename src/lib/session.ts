// Sandbox admin session. The admin's first-class auth is Hanzo IAM (lux.id) —
// see hooks/useAuth. This env-gated email+password gate lets the demo admin sign
// in without a browser OIDC round-trip (investors don't hold lux.id accounts).
// It accepts exactly the configured admin credential and is sandbox-only: it
// grants nothing but the sandbox console (no bearer, no write access to bankd).
import { getBrand } from './brand'

const KEY = 'lux_admin_session'
const EMAIL_KEY = 'lux_admin_email'

export const SANDBOX_LOGIN_ENABLED = String(import.meta.env.VITE_SANDBOX_LOGIN ?? 'true') === 'true'
// Brand-derived admin identity (runtime `?brand=`): lux → z@lux.financial,
// acm → z@acmglobaltech.com. An explicit VITE_SANDBOX_EMAIL still overrides.
export const ADMIN_EMAIL = (import.meta.env.VITE_SANDBOX_EMAIL as string) || `z@${getBrand().domain}`
const ADMIN_PASSWORD = (import.meta.env.VITE_SANDBOX_PASSWORD as string) || 'IloveLux2026!!!'

export function verifyCredentials(email: string, password: string): boolean {
  return (
    SANDBOX_LOGIN_ENABLED &&
    email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
    password === ADMIN_PASSWORD
  )
}

export function setSession(email: string): void {
  try {
    sessionStorage.setItem(KEY, '1')
    sessionStorage.setItem(EMAIL_KEY, email)
  } catch {
    /* ignore */
  }
}

export function hasSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function sessionEmail(): string | null {
  try {
    return sessionStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY)
    sessionStorage.removeItem(EMAIL_KEY)
  } catch {
    /* ignore */
  }
}
