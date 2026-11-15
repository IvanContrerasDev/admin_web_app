import { describe, expect, it, vi } from 'vitest'
import { registerUserMockRoutes } from '../mocks/user-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { UserService } from './user-service'
import { HttpServiceAdapter } from './http-service-adapter'

function setup(now = () => new Date('2026-09-17T15:00:00.000Z')) {
  const adapter = new MockServiceAdapter()
  registerUserMockRoutes(adapter, now)
  return new UserService(adapter)
}

const newUser = {
  firstName: 'Ana', lastName: 'Pérez', employeeId: 'EMP-051', dni: '41234567', email: 'ANA.PEREZ@example.test', initialPassword: 'frase segura 2026', phone: '2645550199', address: 'Mitre 150', siteId: '11000000-0000-4000-8000-000000000005', birthDate: '2000-05-20',
}

describe('UserService', () => {
  it('lists, searches and filters employees with contractual pagination', async () => {
    const service = setup()
    const result = await service.list({ search: 'camila', accountStatus: 'INACTIVE', page: 1, pageSize: 25 })
    expect(result.pagination).toEqual({ page: 1, pageSize: 25, totalItems: 1, totalPages: 1 })
    expect(result.data[0]).toMatchObject({ firstName: 'Camila', accountStatus: 'INACTIVE' })
  })

  it('creates a normalized active employee without exposing the password', async () => {
    const service = setup()
    const created = await service.create(newUser)
    expect(created).toMatchObject({ email: 'ana.perez@example.test', accountStatus: 'ACTIVE', employeeId: 'EMP-051' })
    expect(created).not.toHaveProperty('initialPassword')
    await expect(service.get(created.id)).resolves.toEqual(created)
  })

  it('maps uniqueness conflicts to stable error codes', async () => {
    const service = setup()
    await expect(service.create({ ...newUser, email: 'lucia.alvarez@example.test' })).rejects.toMatchObject({ code: 'USER_EMAIL_ALREADY_EXISTS', status: 409 })
  })

  it('updates fields and changes account status independently', async () => {
    const service = setup()
    const id = '22000000-0000-4000-8000-000000000001'
    await expect(service.update(id, { position: 'Jefa operativa' })).resolves.toMatchObject({ position: 'Jefa operativa', accountStatus: 'ACTIVE' })
    await expect(service.setAccountStatus(id, 'INACTIVE')).resolves.toMatchObject({ accountStatus: 'INACTIVE' })
  })

  it('clamps out-of-range pages and returns the final page instead of an empty result', async () => {
    const result = await setup().list({ page: 999, pageSize: 2 })
    expect(result.pagination).toEqual({ page: 3, pageSize: 2, totalItems: 6, totalPages: 3 })
    expect(result.data).toHaveLength(2)
    const empty = await setup().list({ search: 'inexistente', page: 999 })
    expect(empty.pagination).toMatchObject({ page: 1, totalItems: 0, totalPages: 0 })
  })

  it.each([NaN, Infinity, -4, 0, 1.9])('normalizes invalid page %s', async (page) => {
    expect((await setup().list({ page })).pagination.page).toBe(1)
  })

  it('validates creation and editing against the injected Argentina calendar date', async () => {
    const service = setup(() => new Date('2026-10-14T01:00:00Z'))
    const created = await service.create({ ...newUser, birthDate: '2026-10-13' })
    expect(created.birthDate).toBe('2026-10-13')
    await expect(service.update(created.id, { hireDate: '2026-10-13' })).resolves.toMatchObject({ hireDate: '2026-10-13' })
    await expect(service.update(created.id, { birthDate: '2026-10-14' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
    await expect(service.update(created.id, { hireDate: '2026-10-14' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
    await expect(service.create({ ...newUser, birthDate: '2026-10-14' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
  })

  it('reads the injected clock anew for each request', async () => {
    let now = new Date('2026-10-13T15:00:00Z')
    const service = setup(() => now)
    await expect(service.create({ ...newUser, birthDate: '2026-10-14' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
    now = new Date('2026-10-14T15:00:00Z')
    await expect(service.create({ ...newUser, birthDate: '2026-10-14' })).resolves.toMatchObject({ birthDate: '2026-10-14' })
  })

  it('rejects invalid civil dates and weak passwords', async () => {
    const service = setup()
    await expect(service.create({ ...newUser, birthDate: '2026-02-31' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
    await expect(service.create({ ...newUser, initialPassword: 'corta' })).rejects.toMatchObject({ code: 'WEAK_PASSWORD' })
  })
})


describe('Public registration catalogue over HTTP', () => {
  it('uses public value/label provinces without requesting protected sites', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: { sites: [{ value: newUser.siteId, label: 'San Juan' }], documentTypes: [] } }))
    const service = new UserService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    await expect(service.listRegistrationSites()).resolves.toEqual([{ id: newUser.siteId, name: 'San Juan' }])
    expect(String(fetcher.mock.calls[0]![0])).toBe('https://api.example.test/api/v1/catalogs')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('accepts empty public provinces but rejects malformed UUIDs and protected DTOs', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: { sites: [] } }))
      .mockResolvedValueOnce(Response.json({ data: { sites: [{ value: 'EMP-051', label: 'San Juan' }] } }))
      .mockResolvedValueOnce(Response.json({ data: { sites: [{ id: newUser.siteId, name: 'San Juan' }] } }))
    const service = new UserService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    await expect(service.listRegistrationSites()).resolves.toEqual([])
    await expect(service.listRegistrationSites()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' })
    await expect(service.listRegistrationSites()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' })
  })
})

describe('employee HTTP contract', () => {
  it('preserves the server UUID, nulls and omitted PATCH fields without mock fallback', async () => {
    const detail = { id: 'a304e546-2257-4e2a-bc59-42d22e16e7c8', firstName: 'Ana', lastName: 'Pérez', employeeId: 'EMP-051', dni: '41234567', email: 'ana@example.test', phone: '2645550199', site: { id: newUser.siteId, name: 'San Juan' }, accountStatus: 'INACTIVE', address: 'Mitre 150', birthDate: '2000-05-20', cuil: null, hireDate: null, position: null, createdAt: '2026-11-04T12:00:00.000Z', updatedAt: '2026-11-04T12:00:00.000Z' }
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ data: detail }))
    const service = new UserService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    const created = await service.create(newUser)
    expect(created.id).toBe(detail.id)
    await expect(service.get(created.id)).resolves.toEqual(detail)
    await service.update(created.id, { cuil: null, position: 'Encargada' })
    await service.setAccountStatus(created.id, 'INACTIVE')
    expect(fetcher.mock.calls.map(([url, init]) => [new URL(String(url)).pathname, init?.method, init?.body ? JSON.parse(String(init.body)) : undefined])).toEqual([
      ['/api/v1/users', 'POST', newUser],
      [`/api/v1/users/${detail.id}`, 'GET', undefined],
      [`/api/v1/users/${detail.id}`, 'PATCH', { cuil: null, position: 'Encargada' }],
      [`/api/v1/users/${detail.id}/account-status`, 'PATCH', { accountStatus: 'INACTIVE' }],
    ])
    fetcher.mockResolvedValueOnce(Response.json({ error: { code: 'USER_EMAIL_ALREADY_EXISTS', message: 'El email ya existe.', retryable: false } }, { status: 409 }))
    await expect(service.create(newUser)).rejects.toMatchObject({ code: 'USER_EMAIL_ALREADY_EXISTS', status: 409 })
  })

  it('sends only supported list filters and preserves inactive employees', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [], pagination: { page: 2, pageSize: 25, totalItems: 30, totalPages: 2 } }))
    const service = new UserService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher))
    await service.list({ search: 'Pérez', accountStatus: 'INACTIVE', page: 2 })
    const url = new URL(String(fetcher.mock.calls[0]![0]))
    expect(Object.fromEntries(url.searchParams)).toEqual({ search: 'Pérez', accountStatus: 'INACTIVE', page: '2', pageSize: '25' })
  })
})

it.each([[7, false], [8, true], [30, true], [31, false]] as const)('mock employee creation enforces %s code points: %s', async (length, accepted) => {
  const result = setup().create({ ...newUser, initialPassword: '😀'.repeat(length) })
  if (accepted) await expect(result).resolves.toMatchObject({ firstName: 'Ana' })
  else await expect(result).rejects.toMatchObject({ code: 'WEAK_PASSWORD' })
})


it('filters province before counting/paginating and combines search and status', async () => {
  const service = setup()
  const siteId = newUser.siteId
  expect((await service.list({ siteId, pageSize: 1 })).pagination.totalItems).toBe(1)
  expect((await service.list({ siteId, search: 'Tomás', accountStatus: 'ACTIVE' })).data).toEqual([])
  await expect(service.list({ siteId: 'invalid' })).rejects.toMatchObject({ code: 'INVALID_SITE' })
})


it('serializes siteId alongside supported HTTP filters', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [], pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 0 } }))
  await new UserService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher)).list({ siteId: newUser.siteId, search: 'Ana', accountStatus: 'ACTIVE' })
  expect(Object.fromEntries(new URL(String(fetcher.mock.calls[0]![0])).searchParams)).toEqual({ siteId: newUser.siteId, search: 'Ana', accountStatus: 'ACTIVE', page: '1', pageSize: '25' })
})
