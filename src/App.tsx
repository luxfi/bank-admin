import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Callback } from '@/pages/Callback'
import { Overview } from '@/pages/Overview'
import { Customers } from '@/pages/Customers'
import { Accounts } from '@/pages/Accounts'
import { Treasury } from '@/pages/Treasury'
import { Cards } from '@/pages/Cards'
import { Transactions } from '@/pages/Transactions'
import { Compliance } from '@/pages/Compliance'
import { MPC } from '@/pages/MPC'
import { Safes } from '@/pages/Safes'
import { KMS } from '@/pages/KMS'
import { Nodes } from '@/pages/Nodes'
import { LuxMark } from '@/components/Brand'

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <LuxMark size={28} className="animate-pulse text-muted-foreground" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<Callback />} />
          <Route
            element={
              <Protected>
                <Layout />
              </Protected>
            }
          >
            <Route index element={<Overview />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/treasury" element={<Treasury />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/mpc" element={<MPC />} />
            <Route path="/safes" element={<Safes />} />
            <Route path="/kms" element={<KMS />} />
            <Route path="/nodes" element={<Nodes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
