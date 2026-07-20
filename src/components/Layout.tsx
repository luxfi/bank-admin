import { useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { Wordmark, LuxMark } from './Brand'
import { Icon, type IconName } from './icons'
import { Avatar } from './ui'
import { CONFIGURED_SOURCE, getResolvedSource } from '@/lib/data'
import { clearSession, hasSession, sessionEmail } from '@/lib/session'
import { useBrand } from '@/lib/brand'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const nav: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Overview', icon: 'overview' },
  { to: '/customers', label: 'Customers', icon: 'users' },
  { to: '/accounts', label: 'Accounts', icon: 'wallet' },
  { to: '/treasury', label: 'Treasury', icon: 'treasury' },
  { to: '/cards', label: 'Cards', icon: 'card' },
  { to: '/transactions', label: 'Transactions', icon: 'tx' },
  { to: '/compliance', label: 'Compliance', icon: 'shield' },
  { to: '/mpc', label: 'MPC', icon: 'cpu' },
  { to: '/safes', label: 'Safes', icon: 'lock' },
  { to: '/kms', label: 'KMS', icon: 'key' },
  { to: '/nodes', label: 'Nodes', icon: 'server' },
]

function NavItem({ to, label, icon, onClick }: { to: string; label: string; icon: IconName; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
        )
      }
    >
      <Icon name={icon} size={17} />
      {label}
    </NavLink>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-14 items-center px-5">
        <Link to="/" onClick={onNavigate}>
          <Wordmark className="text-2xl" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((n) => (
          <NavItem key={n.to} {...n} onClick={onNavigate} />
        ))}
      </nav>
      <div className="px-4 py-3">
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">Environment</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
            Sandbox · testnet
          </p>
        </div>
      </div>
    </>
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const brand = useBrand()
  const mode = useAsync(getResolvedSource)
  const sandbox = hasSession()
  const email = (user?.email as string) || sessionEmail() || `admin@${brand.domain}`
  const name = (user?.name as string) || (sandbox ? 'Admin' : email)

  function signOut() {
    clearSession()
    if (!sandbox) logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/40 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" size={18} />
          </button>
          <div className="lg:hidden">
            <LuxMark size={18} className="text-foreground" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> Sandbox
            </span>
            <div className="flex items-center gap-2">
              <Avatar label={initials(name)} />
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[160px] truncate text-xs font-medium text-foreground">{name}</p>
                <p className="max-w-[160px] truncate text-[11px] text-muted-foreground">{email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
              title="Sign out"
            >
              <Icon name="logout" size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8">
            {/* Sandbox notice — hidden on ?render (clean product-shot mode). */}
            {!(typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('render')) &&
              (mode.data === 'live' ? (
                <div className="flex items-start gap-2 rounded-lg border border-info/25 bg-info/[0.06] px-4 py-2.5 text-xs text-info">
                  <Icon name="dot" size={14} className="mt-0.5" />
                  <p>
                    <span className="font-semibold">Live.</span>{' '}
                    <span className="text-info/80">
                      Sandbox environment — no real money or production records.
                    </span>
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/[0.06] px-4 py-2.5 text-xs text-warning">
                  <Icon name="dot" size={14} className="mt-0.5" />
                  <p>
                    <span className="font-semibold">Sandbox environment.</span>{' '}
                    <span className="text-warning/80">No real money or production records.</span>
                  </p>
                </div>
              ))}
            <Outlet />
            <footer className="flex flex-col items-center justify-between gap-1 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row">
              <span>© {new Date().getFullYear()} {brand.legal} · Sandbox</span>
              <span>{brand.domain}</span>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}
