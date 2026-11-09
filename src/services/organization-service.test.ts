import { describe, expect, it, vi } from 'vitest'
import { registerOrganizationMockRoutes } from '../mocks/organization-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { HttpServiceAdapter } from './http-service-adapter'
import { OrganizationService } from './organization-service'

function setup() {
  const adapter = new MockServiceAdapter()
  registerOrganizationMockRoutes(adapter, () => new Date('2026-09-17T15:00:00.000Z'))
  return new OrganizationService(adapter)
}

const workplaceInput = { clientId: '33000000-0000-4000-8000-000000000001', siteId: '11000000-0000-4000-8000-000000000005', name: 'Depósito Este', latitude: -31.54, longitude: -68.52, radiusMeters: 120, gpsAccuracyThreshold: 50 }

describe('OrganizationService', () => {
  it('lists clients with normalized search, status and pagination', async () => {
    const result = await setup().listClients({ search: 'andes', status: 'ACTIVE', page: 1, pageSize: 25 })
    expect(result.pagination).toEqual({ page: 1, pageSize: 25, totalItems: 1, totalPages: 1 })
    expect(result.data[0]).toMatchObject({ name: 'Andes Logística', status: 'ACTIVE' })
  })

  it('creates, updates and deactivates a client without cascading workplaces', async () => {
    const service = setup()
    const created = await service.createClient({ name: '  Energía   Federal  ' })
    expect(created).toMatchObject({ name: 'Energía Federal', status: 'ACTIVE' })
    await expect(service.updateClient(created.id, { name: 'Energía Cuyo' })).resolves.toMatchObject({ name: 'Energía Cuyo' })
    await expect(service.setClientStatus(created.id, 'INACTIVE')).resolves.toMatchObject({ status: 'INACTIVE' })
  })

  it('enforces normalized client-name uniqueness', async () => {
    await expect(setup().createClient({ name: '  ANDES   LOGÍSTICA ' })).rejects.toMatchObject({ code: 'CLIENT_NAME_ALREADY_EXISTS', status: 409 })
  })

  it('lists workplaces with combined server-side filters', async () => {
    const result = await setup().listWorkplaces({ clientId: workplaceInput.clientId, siteId: workplaceInput.siteId, status: 'ACTIVE', pageSize: 25 })
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({ name: 'Centro de distribución San Juan', shapeType: 'CIRCLE' })
  })

  it('creates a workplace and validates geographic limits', async () => {
    const service = setup()
    await expect(service.createWorkplace(workplaceInput)).resolves.toMatchObject({ name: 'Depósito Este', radiusMeters: 120, status: 'ACTIVE' })
    await expect(service.createWorkplace({ ...workplaceInput, name: 'Radio inválido', radiusMeters: 9 })).rejects.toMatchObject({ code: 'INVALID_GEO_CONFIGURATION' })
  })

  it('rejects assignments to inactive clients and scoped duplicate names', async () => {
    const service = setup()
    await expect(service.createWorkplace({ ...workplaceInput, clientId: '33000000-0000-4000-8000-000000000004' })).rejects.toMatchObject({ code: 'CLIENT_INACTIVE' })
    await expect(service.createWorkplace({ ...workplaceInput, name: 'Centro de distribución San Juan' })).rejects.toMatchObject({ code: 'WORKPLACE_NAME_ALREADY_EXISTS' })
  })
  it('uses the resource-specific error for malformed bodies', async () => {
    const adapter = new MockServiceAdapter()
    registerOrganizationMockRoutes(adapter)
    for (const body of [undefined, null, 'invalid', []]) {
      await expect(adapter.request({ method: 'POST', path: '/clients', body })).rejects.toMatchObject({ code: 'INVALID_CLIENT_DATA', status: 400 })
      await expect(adapter.request({ method: 'POST', path: '/workplaces', body })).rejects.toMatchObject({ code: 'INVALID_WORKPLACE_DATA', status: 400 })
      await expect(adapter.request({ method: 'PUT', path: '/workplaces/44000000-0000-4000-8000-000000000001', body })).rejects.toMatchObject({ code: 'INVALID_WORKPLACE_DATA' })
      await expect(adapter.request({ method: 'PATCH', path: '/workplaces/44000000-0000-4000-8000-000000000001/status', body })).rejects.toMatchObject({ code: 'INVALID_WORKPLACE_DATA' })
    }
  })
})

describe('organization HTTP contract', () => {
  it('uses server UUIDs and complete PUT inputs with nullable accuracy and independent status', async () => {
    const detail = { id: 'd67f8e4a-80cf-4754-8f69-206f282192b0', name: workplaceInput.name, client: { id: workplaceInput.clientId, name: 'Cliente', status: 'ACTIVE' }, site: { id: workplaceInput.siteId, name: 'San Juan' }, status: 'INACTIVE', shapeType: 'CIRCLE', latitude: -31.54, longitude: -68.52, radiusMeters: 175, gpsAccuracyThreshold: null, createdAt: '2026-11-04T12:00:00.000Z', updatedAt: '2026-11-04T12:00:00.000Z' }
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ data: detail }))
    const service = new OrganizationService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    const input = { ...workplaceInput, radiusMeters: 175, gpsAccuracyThreshold: null }
    const created = await service.createWorkplace(input)
    expect(created.id).toBe(detail.id)
    await expect(service.getWorkplace(created.id)).resolves.toMatchObject({ id: detail.id, gpsAccuracyThreshold: null })
    await service.updateWorkplace(created.id, input)
    await service.setWorkplaceStatus(created.id, 'INACTIVE')
    expect(fetcher.mock.calls.map(([url, init]) => [new URL(String(url)).pathname, init?.method, init?.body ? JSON.parse(String(init.body)) : undefined])).toEqual([
      ['/api/v1/workplaces', 'POST', input],
      [`/api/v1/workplaces/${detail.id}`, 'GET', undefined],
      [`/api/v1/workplaces/${detail.id}`, 'PUT', input],
      [`/api/v1/workplaces/${detail.id}/status`, 'PATCH', { status: 'INACTIVE' }],
    ])
    fetcher.mockResolvedValueOnce(Response.json({ error: { code: 'CLIENT_INACTIVE', message: 'El cliente está inactivo.', retryable: false } }, { status: 409 }))
    await expect(service.createWorkplace(input)).rejects.toMatchObject({ code: 'CLIENT_INACTIVE', status: 409 })
  })

  it('combines workplace filters on the server without hiding inactive historical relationships', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [], pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 } }))
    const service = new OrganizationService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    await service.listWorkplaces({ search: 'Depósito', clientId: workplaceInput.clientId, siteId: workplaceInput.siteId, status: 'INACTIVE' })
    expect(Object.fromEntries(new URL(String(fetcher.mock.calls[0]![0])).searchParams)).toEqual({ search: 'Depósito', clientId: workplaceInput.clientId, siteId: workplaceInput.siteId, status: 'INACTIVE', page: '1', pageSize: '25' })
  })
})
