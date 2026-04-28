import { Outlet, Link } from 'react-router-dom'
import { useAuth, signOut } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/button'

export function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
          <Link to="/" className="font-bold text-lg tracking-tight">
            🎯 OfferHunter
          </Link>
          <nav className="flex items-center gap-2">
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
          </nav>
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
