// Auth is native Hanzo IAM (lux.id) only — OIDC + PKCE via @hanzo/iam. Thin shim
// over the IAM React context, same shape the dash uses. No local password path.
import { createElement, type ReactNode } from 'react'
import { IamProvider, useIam } from '@hanzo/iam/react'
import { IAM_CONFIG } from '@/lib/iam'

export function AuthProvider({ children }: { children: ReactNode }) {
  return createElement(IamProvider, { config: IAM_CONFIG, children })
}

export function useAuth() {
  const iam = useIam()
  return {
    token: iam.accessToken,
    user: iam.user as Record<string, unknown> | null,
    isAuthenticated: iam.isAuthenticated,
    isLoading: iam.isLoading,
    login: () => iam.login(),
    logout: iam.logout,
    handleCallback: iam.handleCallback,
  }
}
