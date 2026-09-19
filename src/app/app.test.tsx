import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../features/auth/auth-provider'
import { createQueryClient } from './query-client'
import { createAppRouter } from './router'

function renderApplication(path = '/') {
  window.history.pushState({}, '', path)
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={createAppRouter()} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('administrative authentication and navigation', () => {
  it('protects private routes and completes login with 2FA before showing the dashboard', async () => {
    const user = userEvent.setup()
    renderApplication('/registros')

    expect(await screen.findByRole('heading', { name: /ingresá a administración/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Registros mensuales' })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'admin@example.test')
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña temporal')
    await user.click(screen.getByRole('button', { name: /continuar con código/i }))

    expect(await screen.findByRole('heading', { name: /revisá tu email/i })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /navegación principal/i })).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Código de verificación'), '123456')
    await user.click(screen.getByRole('button', { name: /ingresar a administración/i }))

    expect(await screen.findByRole('heading', { name: 'Registros mensuales' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(await screen.findByRole('heading', { name: /ingresá a administración/i })).toBeInTheDocument()
  })

  it('shows the contractual pending-approval message', async () => {
    const user = userEvent.setup()
    renderApplication('/login')

    await screen.findByRole('heading', { name: /ingresá a administración/i })
    await user.type(screen.getByLabelText('Email'), 'pendiente@example.test')
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña temporal')
    await user.click(screen.getByRole('button', { name: /continuar con código/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Su solicitud de acceso administrativo se encuentra pendiente de aprobación.')
  })
})
