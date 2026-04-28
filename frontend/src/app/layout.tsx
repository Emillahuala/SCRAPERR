import { Outlet, Link, NavLink } from 'react-router-dom'
import { useAuth, signOut } from '@/features/auth/useAuth'
import { useAlertNotifications } from '@/features/alerts/useAlertNotifications'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'text-sm font-medium transition-colors hover:text-foreground',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )
      }
    >
      {children}
    </NavLink>
  )
}

export function AppLayout() {
  const { user } = useAuth()
  // Wire up Realtime notifications (no-op in mock mode)
  useAlertNotifications(user?.id)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-lg tracking-tight">
              🎯 OfferHunter
            </Link>
            <nav className="hidden sm:flex items-center gap-5">
              <NavItem to="/">Ofertas</NavItem>
              <NavItem to="/alerts">Mis alertas</NavItem>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                  Salir
                </Button>
              </>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t px-4 py-2 gap-4">
          <NavItem to="/">Ofertas</NavItem>
          <NavItem to="/alerts">Mis alertas</NavItem>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        OfferHunter — datos de cruceros.cl · actualizados cada hora
      </footer>
    </div>
  )
}
