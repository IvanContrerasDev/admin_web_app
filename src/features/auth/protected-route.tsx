import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './use-auth'
import { LoadingSkeleton } from '../../app/loading-skeleton'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4" aria-live="polite">
        <LoadingSkeleton label="Verificando sesión…" variant="session" />
      </main>
    )
  }

  if (status !== 'authenticated') {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  return <Outlet />
}
