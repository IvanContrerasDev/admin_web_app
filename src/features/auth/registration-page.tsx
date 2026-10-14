import { Navigate } from 'react-router-dom'
import { LoadingSkeleton } from '../../app/loading-skeleton'
import { AuthLayout } from './auth-layout'
import { RegistrationForm } from './registration-form'
import { useAuth } from './use-auth'

export function RegistrationPage() {
  const { status } = useAuth()
  if (status === 'checking') return <main className="flex min-h-dvh items-center justify-center bg-background px-4"><LoadingSkeleton label="Verificando sesión…" variant="session" /></main>
  if (status === 'authenticated') return <Navigate to="/" replace />
  return <AuthLayout registration><RegistrationForm /></AuthLayout>
}
