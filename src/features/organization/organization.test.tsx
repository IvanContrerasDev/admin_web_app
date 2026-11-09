import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { registerOrganizationMockRoutes } from '../../mocks/organization-handlers'
import { MockServiceAdapter } from '../../services/mock-service-adapter'
import { OrganizationService } from '../../services/organization-service'
import { ServiceError } from '../../services/service-error'
import { organizationService } from '../../services/services'
import { ClientFormPage } from './client-form-page'
import { ClientDetailPage } from './client-detail-page'
import { WorkplaceFormPage } from './workplace-form-page'

beforeEach(() => vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', ''))
afterEach(() => vi.unstubAllEnvs())

function setup(path: string) {
  const adapter = new MockServiceAdapter()
  registerOrganizationMockRoutes(adapter)
  const service = new OrganizationService(adapter)
  for (const key of ['getClient', 'listClients', 'listSites', 'getWorkplace', 'updateClient', 'setClientStatus', 'createWorkplace', 'updateWorkplace'] as const) {
    vi.spyOn(organizationService, key).mockImplementation(service[key].bind(service) as never)
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } } })
  const router = createMemoryRouter([
    { path: '/clientes/:clientId/editar', element: <ClientFormPage /> },
    { path: '/clientes/:clientId', element: <ClientDetailPage /> },
    { path: '/lugares/nuevo', element: <WorkplaceFormPage /> },
    { path: '/lugares/:workplaceId/editar', element: <WorkplaceFormPage /> },
    { path: '/lugares/:workplaceId', element: <h1>Lugar guardado</h1> },
  ], { initialEntries: [path] })
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  return { client, router, service }
}

const clientId = '33000000-0000-4000-8000-000000000001'
const workplaceId = '44000000-0000-4000-8000-000000000001'

describe('organization mutations', () => {
  it.each(['name', 'status'])('invalidates cached workplace details embedding changed client %s', async (field) => {
    const { client } = setup(field === 'name' ? `/clientes/${clientId}/editar` : `/clientes/${clientId}`)
    client.setQueryData(['workplace', workplaceId], { client: { id: clientId, name: 'Andes Logística', status: 'ACTIVE' } })
    const user = userEvent.setup()
    if (field === 'name') {
      const name = await screen.findByRole('textbox', { name: 'Nombre' })
      await user.clear(name)
      await user.type(name, 'Nuevo nombre')
      await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
      await screen.findByRole('heading', { name: 'Nuevo nombre' })
    } else {
      await user.click(await screen.findByRole('button', { name: 'Desactivar cliente' }))
      await user.click(screen.getByRole('button', { name: 'Confirmar' }))
      await screen.findByRole('button', { name: 'Reactivar cliente' })
    }
    await waitFor(() => expect(client.getQueryState(['workplace', workplaceId])?.isInvalidated).toBe(true))
  })

  it('associates a server uniqueness error with the client name', async () => {
    setup(`/clientes/${clientId}/editar`)
    vi.mocked(organizationService.updateClient).mockRejectedValue(new ServiceError({ code: 'CLIENT_NAME_ALREADY_EXISTS', message: 'Duplicado', retryable: false, status: 409, kind: 'api' }))
    const user = userEvent.setup()
    const name = await screen.findByRole('textbox', { name: 'Nombre' })
    await user.clear(name)
    await user.type(name, 'Duplicado')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByText('Ya existe un cliente con ese nombre.')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Ya existe un cliente con ese nombre.')
  })

  it('associates an inactive-client server error with the workplace assignment', async () => {
    setup(`/lugares/${workplaceId}/editar`)
    vi.mocked(organizationService.updateWorkplace).mockRejectedValue(new ServiceError({ code: 'CLIENT_INACTIVE', message: 'Cliente inactivo', retryable: false, status: 409, kind: 'api' }))
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Guardar Lugar' }))
    await screen.findByText('El cliente está inactivo y no admite nuevas asignaciones.')
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('combobox', { name: 'Cliente' })).toHaveAccessibleDescription('El cliente está inactivo y no admite nuevas asignaciones.')
  })

  it('creates a workplace with manual coordinates without a Maps key', async () => {
    const { service, router } = setup('/lugares/nuevo')
    const user = userEvent.setup()
    await screen.findByText('Google Maps no está configurado.')
    await user.type(screen.getByRole('textbox', { name: 'Nombre' }), 'Depósito manual')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Cliente' }), clientId)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Provincia' }), '11000000-0000-4000-8000-000000000005')
    await user.type(screen.getByRole('spinbutton', { name: 'Latitud' }), '-31.54')
    await user.type(screen.getByRole('spinbutton', { name: 'Longitud' }), '-68.52')
    await user.clear(screen.getByRole('spinbutton', { name: 'Radio (m)' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Radio (m)' }), '175')
    expect(screen.getByRole('slider')).toBeValid()
    await user.click(screen.getByRole('button', { name: 'Guardar Lugar' }))
    await screen.findByRole('heading', { name: 'Lugar guardado' })
    const id = router.state.location.pathname.split('/')[2]!
    await expect(service.getWorkplace(id)).resolves.toMatchObject({ id, latitude: -31.54, longitude: -68.52, radiusMeters: 175, gpsAccuracyThreshold: null })
  })
})
