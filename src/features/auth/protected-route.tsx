import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './use-auth'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4" aria-live="polite">
        <div className="flex items-center gap-3 font-sans text-base font-medium text-foreground">
          <span className="size-3 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Verificando sesión…
        </div>
      </main>
    )
  }

  if (status !== 'authenticated') {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  return <Outlet />
}
