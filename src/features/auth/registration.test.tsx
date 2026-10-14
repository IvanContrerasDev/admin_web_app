import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService, userService } from '../../services/services'
import { AuthProvider } from './auth-provider'
import { LoginPage } from './login-page'
import { RegistrationPage } from './registration-page'
import { createRegistrationSchema } from './registration-schema'

const siteId = '11000000-0000-4000-8000-000000000005'
const validFields = { firstName: ' Ana ', lastName: ' Pérez ', email: 'ANA@example.test', initialPassword: 'frase segura 2026', confirmPassword: 'frase segura 2026', phone: '2645550199', dni: '41234567', employeeId: 'EMP-051', address: 'Mitre 150', birthDate: '2000-05-20', siteId }

function renderAccess(path = '/registro') {
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/registro', element: <RegistrationPage /> },
    { path: '/', element: <h1>Administración</h1> },
  ], { initialEntries: [path] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={client}><AuthProvider><RouterProvider router={router} /></AuthProvider></QueryClientProvider>)
  return router
}

beforeEach(() => {
  vi.spyOn(authService, 'bootstrap').mockRejectedValue(new Error('Sin sesión'))
  vi.spyOn(userService, 'listSites').mockResolvedValue([{ id: siteId, name: 'San Juan' }])
})

describe('Administrative registration screen', () => {
  it('links the welcome screen to registration and back without authenticating', async () => {
    const user = userEvent.setup()
    const router = renderAccess('/login')
    await user.click(await screen.findByRole('link', { name: 'Crear cuenta o registrarse' }))
    expect(await screen.findByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/registro')
    expect(screen.getByText(/requiere la aprobación del SuperAdmin/)).toBeInTheDocument()
    expect(screen.getByLabelText('Provincia')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Iniciar sesión' }))
    expect(await screen.findByRole('heading', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('focuses the first invalid field and links accessible errors', async () => {
    const user = userEvent.setup()
    renderAccess()
    await screen.findByRole('option', { name: 'San Juan' })
    await user.click(screen.getByRole('button', { name: 'Validar datos de registro' }))
    expect(await screen.findByText('Ingresá el nombre.')).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-describedby', 'registration-firstName-error')
  })

  it('validates without persisting, sending a request or granting access', async () => {
    const create = vi.spyOn(userService, 'create')
    const login = vi.spyOn(authService, 'login')
    const verify = vi.spyOn(authService, 'verifyLogin')
    const user = userEvent.setup()
    const router = renderAccess()
    await screen.findByRole('option', { name: 'San Juan' })
    for (const [label, value] of [['Nombre', 'Ana'], ['Apellido', 'Pérez'], ['Email', 'ana@example.test'], ['Teléfono', '2645550199'], ['DNI', '41234567'], ['Número de legajo', 'EMP-051'], ['Domicilio', 'Mitre 150'], ['Fecha de nacimiento', '2000-05-20'], ['Contraseña', 'frase segura 2026'], ['Confirmar contraseña', 'frase segura 2026']]) {
      await user.type(screen.getByLabelText(label!), value!)
    }
    await user.selectOptions(screen.getByLabelText('Provincia'), siteId)
    await user.click(screen.getByRole('button', { name: 'Validar datos de registro' }))
    const notice = await screen.findByRole('status')
    expect(notice).toHaveTextContent('Datos validados. Solicitud no enviada.')
    await waitFor(() => expect(notice).toHaveFocus())
    expect(create).not.toHaveBeenCalled()
    expect(login).not.toHaveBeenCalled()
    expect(verify).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/registro')
    await user.type(screen.getByLabelText('Nombre'), ' María')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('recovers a failed province catalogue and never submits while unavailable', async () => {
    vi.mocked(userService.listSites).mockRejectedValueOnce(new Error('Sin catálogo'))
    const user = userEvent.setup()
    renderAccess()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las provincias.')
    expect(screen.getByLabelText('Provincia')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Validar datos de registro' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('option', { name: 'San Juan' })
    expect(screen.getByLabelText('Provincia')).toBeEnabled()
  })

  it('toggles both password fields without changing their values', async () => {
    const user = userEvent.setup()
    renderAccess()
    await screen.findByRole('heading', { name: 'Crear cuenta' })
    const password = screen.getByLabelText('Contraseña')
    await user.type(password, 'frase segura 2026')
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('checkbox', { name: 'Mostrar contraseñas' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('frase segura 2026')
  })

  it('normalizes identity fields and rejects mismatched passwords and future dates', () => {
    const schema = createRegistrationSchema(() => new Date('2026-10-14T02:00:00Z'))
    expect(schema.parse(validFields)).toMatchObject({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test' })
    expect(schema.safeParse({ ...validFields, confirmPassword: 'otra contraseña' }).success).toBe(false)
    expect(schema.safeParse({ ...validFields, birthDate: '2026-10-14' }).success).toBe(false)
    expect(schema.safeParse({ ...validFields, birthDate: '2026-02-30' }).success).toBe(false)
    expect(schema.safeParse({ ...validFields, initialPassword: 'corta', confirmPassword: 'corta' }).success).toBe(false)
  })
})
