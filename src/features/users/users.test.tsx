import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getArgentinaCivilDate } from '../../lib/dates'
import { registerUserMockRoutes } from '../../mocks/user-handlers'
import { MockServiceAdapter } from '../../services/mock-service-adapter'
import { ServiceError } from '../../services/service-error'
import { userService } from '../../services/services'
import { UserService } from '../../services/user-service'
import { ToastProvider } from '../toasts/toast-provider'
import { UserDetailPage } from './user-detail-page'
import { UserFormPage } from './user-form-page'
import { UsersPage } from './users-page'

const firstId = '22000000-0000-4000-8000-000000000001'
const secondId = '22000000-0000-4000-8000-000000000002'

function renderUsers(path = '/usuarios') {
  const router = createMemoryRouter([
    { path: '/usuarios', element: <UsersPage /> },
    { path: '/usuarios/nuevo', element: <UserFormPage /> },
    { path: '/usuarios/:userId/editar', element: <UserFormPage /> },
    { path: '/usuarios/:userId', element: <UserDetailPage /> },
  ], { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(<QueryClientProvider client={queryClient}><ToastProvider><RouterProvider router={router} /></ToastProvider></QueryClientProvider>)
  return router
}

beforeEach(() => {
  const adapter = new MockServiceAdapter()
  registerUserMockRoutes(adapter)
  const service = new UserService(adapter)
  vi.spyOn(userService, 'list').mockImplementation(service.list.bind(service))
  vi.spyOn(userService, 'listSites').mockImplementation(service.listSites.bind(service))
  vi.spyOn(userService, 'get').mockImplementation(service.get.bind(service))
  vi.spyOn(userService, 'create').mockImplementation(service.create.bind(service))
  vi.spyOn(userService, 'update').mockImplementation(service.update.bind(service))
  vi.spyOn(userService, 'setAccountStatus').mockImplementation(service.setAccountStatus.bind(service))
})

async function fillNewUser() {
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Agregar empleado' })
  for (const [label, value] of [['Nombre', ' Ana '], ['Apellido', ' Pérez '], ['Legajo', 'EMP-051'], ['DNI', '41234567'], ['Email', 'ANA.PEREZ@example.test'], ['Teléfono', '2645550199'], ['Domicilio', 'Mitre 150'], ['Contraseña inicial', 'frase segura 2026']]) {
    await user.type(screen.getByLabelText(label!), value!)
  }
  await user.type(screen.getByLabelText('Fecha de nacimiento'), '2000-05-20')
  await user.selectOptions(screen.getByLabelText('Provincia'), '11000000-0000-4000-8000-000000000005')
  return user
}

describe('F-011 employee regressions', () => {
  it('shows all required data in both desktop rows and mobile cards', async () => {
    renderUsers()
    const table = await screen.findByRole('table')
    expect(within(table).getByRole('columnheader', { name: 'DNI' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Teléfono' })).toBeInTheDocument()
    for (const container of [table, screen.getByRole('list', { name: 'Empleados encontrados' })]) {
      for (const text of ['EMP-018', '32145876', 'lucia.alvarez@example.test', '2645550148', 'San Juan', 'Activo']) expect(within(container).getByText(text)).toBeInTheDocument()
      expect(container).toHaveTextContent('Lucía')
      expect(container).toHaveTextContent('Álvarez')
    }
  })

  it('keeps related links scoped to the employee UUID', async () => {
    renderUsers(`/usuarios/${firstId}`)
    expect(await screen.findByRole('link', { name: 'Ver planillas' })).toHaveAttribute('href', `/planillas?employeeId=${firstId}`)
    expect(screen.getByRole('link', { name: 'Ver legajo digital' })).toHaveAttribute('href', `/usuarios/${firstId}/legajo`)
  })

  it('validates required fields inline with focus before submitting', async () => {
    const user = userEvent.setup()
    renderUsers('/usuarios/nuevo')
    await screen.findByRole('heading', { name: 'Agregar empleado' })
    await user.click(screen.getByRole('button', { name: 'Crear empleado' }))
    expect(await screen.findByText('Ingresá el nombre.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
    expect(userService.create).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Fecha de nacimiento')).toHaveAttribute('max', getArgentinaCivilDate())
  })

  it('creates a normalized employee and displays the success toast after navigation', async () => {
    renderUsers('/usuarios/nuevo')
    const user = await fillNewUser()
    await user.click(screen.getByRole('button', { name: 'Crear empleado' }))
    expect(await screen.findByRole('heading', { name: 'Ana Pérez' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('El empleado se creó correctamente.')
    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'Ana', lastName: 'Pérez', email: 'ana.perez@example.test' }))
  })

  it('maps uniqueness errors to the field and focuses it', async () => {
    renderUsers('/usuarios/nuevo')
    const user = await fillNewUser()
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'lucia.alvarez@example.test')
    await user.click(screen.getByRole('button', { name: 'Crear empleado' }))
    expect(await screen.findByText('Ya existe un empleado con ese email.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('remounts edit fields when navigating between employee IDs', async () => {
    const user = userEvent.setup()
    const router = renderUsers(`/usuarios/${firstId}/editar`)
    await screen.findByRole('heading', { name: 'Editar a Lucía Álvarez' })
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'No conservar')
    await act(() => router.navigate(`/usuarios/${secondId}/editar`))
    await screen.findByRole('heading', { name: 'Editar a Tomás Benítez' })
    expect(screen.getByLabelText('Nombre')).toHaveValue('Tomás')
    expect(screen.getByLabelText('DNI')).toHaveValue('34781290')
    expect(screen.getByLabelText('Email')).toHaveValue('tomas.benitez@example.test')
    expect(screen.queryByLabelText('Contraseña inicial')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Los cambios se guardaron correctamente.')
    expect(userService.update).toHaveBeenCalledWith(secondId, expect.objectContaining({ firstName: 'Tomás' }))
  })

  it('maps identifiable INVALID_USER_DATA without changing the API error envelope', async () => {
    vi.mocked(userService.update).mockRejectedValueOnce(new ServiceError({ code: 'INVALID_USER_DATA', message: 'El CUIL debe contener 11 dígitos.', retryable: false, kind: 'api', status: 400 }))
    const user = userEvent.setup()
    renderUsers(`/usuarios/${firstId}/editar`)
    await screen.findByRole('heading', { name: 'Editar a Lucía Álvarez' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('El CUIL debe contener 11 dígitos.')).toBeInTheDocument()
    expect(screen.getByLabelText('CUIL (opcional)')).toHaveFocus()
  })

  it('preserves a general error when INVALID_USER_DATA has no identifiable field', async () => {
    vi.mocked(userService.update).mockRejectedValueOnce(new ServiceError({ code: 'INVALID_USER_DATA', message: 'Revisá los datos ingresados.', retryable: false, kind: 'api', status: 400 }))
    const user = userEvent.setup()
    renderUsers(`/usuarios/${firstId}/editar`)
    await screen.findByRole('heading', { name: 'Editar a Lucía Álvarez' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Revisá los datos ingresados.')).toHaveAttribute('role', 'alert')
  })

  it('confirms deactivation and reactivation and reports both successes', async () => {
    const user = userEvent.setup()
    renderUsers(`/usuarios/${firstId}`)
    await user.click(await screen.findByRole('button', { name: 'Desactivar cuenta' }))
    expect(userService.setAccountStatus).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('La cuenta se desactivó correctamente.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reactivar cuenta' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('La cuenta se reactivó correctamente.')).toBeInTheDocument()
  })

  it('restores the search on history navigation and resets empty-result filters', async () => {
    const user = userEvent.setup()
    const router = renderUsers('/usuarios?search=Lucía')
    await screen.findByRole('table')
    await user.clear(screen.getByLabelText('Buscar empleado'))
    await user.type(screen.getByLabelText('Buscar empleado'), 'inexistente')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await screen.findByRole('heading', { name: 'No hay resultados' })
    await act(() => router.navigate(-1))
    expect(screen.getByLabelText('Buscar empleado')).toHaveValue('Lucía')
    await act(() => router.navigate(1))
    expect(screen.getByLabelText('Buscar empleado')).toHaveValue('inexistente')
    await user.click(await screen.findByRole('button', { name: 'Limpiar filtros' }))
    await screen.findByRole('table')
    expect(screen.getByLabelText('Buscar empleado')).toHaveValue('')
    expect(router.state.location.search).toBe('')
  })

  it('replaces an out-of-range URL with the valid page without showing a false empty state', async () => {
    const router = renderUsers('/usuarios?page=999')
    await screen.findByRole('table')
    await waitFor(() => expect(router.state.location.search).toBe('?page=1'))
    expect(screen.queryByRole('heading', { name: 'No hay resultados' })).not.toBeInTheDocument()
  })
})
