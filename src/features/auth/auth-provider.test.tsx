import { QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './login-page'
import { createQueryClient } from '../../app/query-client'
import { authService } from '../../services/services'
import type { AuthenticatedSession } from '../../types/auth'
import { AuthProvider } from './auth-provider'
import { useAuth } from './use-auth'

const session: AuthenticatedSession = {
  user: { id: 'id', employeeId: 'ADM', firstName: 'Marina', lastName: 'Quiroga', email: 'admin@example.test', role: 'ADMIN' },
  rememberSession: false, sessionExpiresAt: '2030-01-01T00:00:00.000Z', accessToken: 'memory', accessExpiresIn: 1800,
}
function Controls() {
  const auth = useAuth()
  return <><span>{auth.status}</span>{auth.logoutWarning ? <p role="alert">{auth.logoutWarning}</p> : null}<button onClick={() => void auth.logout().catch(() => undefined)}>Logout</button></>
}
function setup() {
  const query = createQueryClient()
  render(<QueryClientProvider client={query}><AuthProvider><Controls /></AuthProvider></QueryClientProvider>)
  return query
}
describe('session lifecycle in the provider', () => {
  it('clears private cached data immediately while remote logout is still pending', async () => {
    vi.spyOn(authService, 'bootstrap').mockResolvedValue(session)
    let finish!: () => void
    vi.spyOn(authService, 'logout').mockImplementation(() => new Promise<void>((resolve) => { finish = resolve }))
    const query = setup()
    await screen.findByText('authenticated')
    query.setQueryData(['private'], { secret: true })
    fireEvent.click(screen.getByText('Logout'))
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())
    expect(query.getQueryData(['private'])).toBeUndefined()
    await act(async () => finish())
  })
  it('updates the rendered session and clears cache on remote-tab logout', async () => {
    vi.spyOn(authService, 'bootstrap').mockResolvedValue(session)
    let receive!: (session: AuthenticatedSession | null) => void
    vi.spyOn(authService, 'subscribe').mockImplementation((callback) => { receive = callback; return () => undefined })
    const query = setup()
    await screen.findByText('authenticated')
    query.setQueryData(['private'], 'secret')
    act(() => receive(null))
    await screen.findByText('anonymous')
    expect(screen.getByRole('alert')).toHaveTextContent('confirmar el cierre remoto')
    expect(query.getQueryData(['private'])).toBeUndefined()
  })
})


it('renders the minimal challenge without inventing a backend expiration', async () => {
  vi.spyOn(authService, 'bootstrap').mockResolvedValue(null)
  vi.spyOn(authService, 'login').mockResolvedValue({ twoFactorRequired: true, challengeId: 'minimum' })
  const query = createQueryClient()
  const user = userEvent.setup()
  render(<QueryClientProvider client={query}><AuthProvider><MemoryRouter><LoginPage /></MemoryRouter></AuthProvider></QueryClientProvider>)
  await screen.findByRole('heading', { name: 'Ingresar' })
  await user.type(screen.getByLabelText('Email'), 'admin@example.test')
  await user.type(screen.getByLabelText('Contraseña'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Continuar con código' }))
  await screen.findByRole('heading', { name: 'Revisá tu email' })
  expect(screen.getByText('Ingresá el código recibido por email.')).toBeInTheDocument()
  expect(screen.queryByText(/El código vence el/)).not.toBeInTheDocument()
})
