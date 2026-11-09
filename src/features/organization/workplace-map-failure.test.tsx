import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { registerOrganizationMockRoutes } from '../../mocks/organization-handlers'
import { MockServiceAdapter } from '../../services/mock-service-adapter'
import { OrganizationService } from '../../services/organization-service'
import { organizationService } from '../../services/services'
import { WorkplaceFormPage } from './workplace-form-page'

const loader = vi.hoisted(() => ({ importLibrary: vi.fn(), setOptions: vi.fn() }))
vi.mock('@googlemaps/js-api-loader', () => loader)
afterEach(() => vi.unstubAllEnvs())

it('preserves manual coordinates and saves edits after Maps fails to load', async () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
  let fail!: (reason: Error) => void
  const pending = new Promise<never>((_, reject) => { fail = reject })
  loader.importLibrary.mockReturnValue(pending)
  const adapter = new MockServiceAdapter()
  registerOrganizationMockRoutes(adapter)
  const service = new OrganizationService(adapter)
  for (const key of ['listClients', 'listSites', 'getWorkplace', 'updateWorkplace'] as const) vi.spyOn(organizationService, key).mockImplementation(service[key].bind(service) as never)
  const id = '44000000-0000-4000-8000-000000000001'
  const router = createMemoryRouter([
    { path: '/lugares/:workplaceId/editar', element: <WorkplaceFormPage /> },
    { path: '/lugares/:workplaceId', element: <h1>Lugar guardado</h1> },
  ], { initialEntries: [`/lugares/${id}/editar`] })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  const user = userEvent.setup()
  const lat = await screen.findByRole('spinbutton', { name: 'Latitud' })
  const lng = screen.getByRole('spinbutton', { name: 'Longitud' })
  await user.clear(lat)
  await user.type(lat, '-32.25')
  await user.clear(lng)
  await user.type(lng, '-69.5')
  const radius = screen.getByRole('spinbutton', { name: 'Radio (m)' })
  await user.clear(radius)
  await user.type(radius, '175')
  fail(new Error('Maps unavailable'))
  await screen.findByText(/No pudimos cargar Google Maps/)
  expect(lat).toHaveValue(-32.25)
  expect(lng).toHaveValue(-69.5)
  expect(radius).toHaveValue(175)
  await user.click(screen.getByRole('button', { name: 'Guardar Lugar' }))
  await screen.findByRole('heading', { name: 'Lugar guardado' })
  await expect(service.getWorkplace(id)).resolves.toMatchObject({ id, latitude: -32.25, longitude: -69.5, radiusMeters: 175 })
})
