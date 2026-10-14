import { describe, expect, it } from 'vitest'
import { registerUserMockRoutes } from '../mocks/user-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { UserService } from './user-service'

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
