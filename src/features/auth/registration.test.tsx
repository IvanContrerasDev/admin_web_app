import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accessService, authService, userService } from '../../services/services'
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
  vi.spyOn(userService, 'listRegistrationSites').mockResolvedValue([{ id: siteId, name: 'San Juan' }])
  vi.spyOn(userService, 'listSites').mockRejectedValue(new Error('Ruta protegida'))
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
    await user.click(screen.getByRole('button', { name: 'Solicitar acceso administrativo' }))
    expect(await screen.findByText('Ingresá el nombre.')).toHaveAttribute('role', 'alert')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-describedby', 'registration-firstName-error')
  })

  it('sends a legacy password, replaces the challenge on resend and submits PENDING without granting access', async () => {
    const initial = { challengeId: 'one', expiresAt: new Date(Date.now()+600000).toISOString(), resendAvailableAt: new Date(0).toISOString(), message: 'Ingresá el código' }
    const request = vi.spyOn(accessService, 'requestAccess').mockResolvedValue(initial)
    vi.spyOn(accessService, 'resend').mockResolvedValue({ ...initial, challengeId: 'two' })
    const submit = vi.spyOn(accessService, 'verify').mockResolvedValue({ status: 'PENDING', message: 'Solicitud pendiente' })
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
    await user.click(screen.getByRole('button', { name: 'Solicitar acceso administrativo' }))
    await screen.findByLabelText('Código de verificación')
    expect(request.mock.calls[0]![0]).toEqual({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', phone: '2645550199', dni: '41234567', employeeId: 'EMP-051', address: 'Mitre 150', birthDate: '2000-05-20', siteId, password: 'frase segura 2026' })
    await user.click(screen.getByRole('button', { name: 'Reenviar código' }))
    await user.type(screen.getByLabelText('Código de verificación'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verificar email' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Solicitud pendiente')
    expect(submit.mock.calls[0]!.slice(0,2)).toEqual(['two', '123456'])
    expect(create).not.toHaveBeenCalled()
    expect(login).not.toHaveBeenCalled()
    expect(verify).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/registro')
  })

  it('recovers a failed province catalogue and never submits while unavailable', async () => {
    vi.mocked(userService.listRegistrationSites).mockRejectedValueOnce(new Error('Sin catálogo'))
    const user = userEvent.setup()
    renderAccess()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las provincias.')
    expect(screen.getByLabelText('Provincia')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Solicitar acceso administrativo' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('option', { name: 'San Juan' })
    expect(screen.getByLabelText('Provincia')).toBeEnabled()
  })

  it('keeps registration unavailable when the public catalogue is empty', async () => {
    vi.mocked(userService.listRegistrationSites).mockResolvedValue([])
    renderAccess()
    expect(await screen.findByText('No hay provincias disponibles para el registro.')).toBeInTheDocument()
    expect(screen.getByLabelText('Provincia')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Solicitar acceso administrativo' })).toBeDisabled()
    expect(userService.listSites).not.toHaveBeenCalled()
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
    expect(schema.safeParse({ ...validFields, initialPassword: ' x ', confirmPassword: ' x ' }).success).toBe(true)
    expect(schema.parse({ ...validFields, initialPassword: '😀'.repeat(128), confirmPassword: '😀'.repeat(128) }).initialPassword).toBe('😀'.repeat(128))
  })
})

it('accepts 128 non-BMP password characters through the input without trimming secrets', async () => {
  const challenge = { challengeId: 'unicode', expiresAt: new Date(Date.now()+600000).toISOString(), resendAvailableAt: new Date(Date.now()+60000).toISOString(), message: 'Código enviado' }
  const request = vi.spyOn(accessService, 'requestAccess').mockResolvedValue(challenge)
  renderAccess()
  await screen.findByRole('option', { name: 'San Juan' })
  const user = userEvent.setup()
  const secret = '😀'.repeat(128)
  for (const [label, value] of [['Nombre', 'Ana'], ['Apellido', 'Pérez'], ['Email', 'ana@example.test'], ['Teléfono', '2645550199'], ['DNI', '41234567'], ['Número de legajo', 'EMP-051'], ['Domicilio', 'Mitre 150'], ['Fecha de nacimiento', '2000-05-20'], ['Contraseña', secret], ['Confirmar contraseña', secret]]) {
    await user.type(screen.getByLabelText(label!), value!)
  }
  expect(screen.getByLabelText('Contraseña')).toHaveValue(secret)
  await user.selectOptions(screen.getByLabelText('Provincia'), siteId)
  await user.click(screen.getByRole('button', { name: 'Solicitar acceso administrativo' }))
  await screen.findByLabelText('Código de verificación')
  expect(request.mock.calls[0]![0].password).toBe(secret)
  expect(screen.getByRole('button', { name: /Reenviar código en/ })).toBeDisabled()
})
