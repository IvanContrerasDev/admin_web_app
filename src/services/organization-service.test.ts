import { describe, expect, it } from 'vitest'
import { registerOrganizationMockRoutes } from '../mocks/organization-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
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
})
