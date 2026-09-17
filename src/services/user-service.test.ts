import { describe, expect, it } from 'vitest'
import { registerUserMockRoutes } from '../mocks/user-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { UserService } from './user-service'

function setup() {
  const adapter = new MockServiceAdapter()
  registerUserMockRoutes(adapter, () => new Date('2026-09-17T15:00:00.000Z'))
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

  it('rejects invalid civil dates and weak passwords', async () => {
    const service = setup()
    await expect(service.create({ ...newUser, birthDate: '2026-02-31' })).rejects.toMatchObject({ code: 'INVALID_USER_DATA' })
    await expect(service.create({ ...newUser, initialPassword: 'corta' })).rejects.toMatchObject({ code: 'WEAK_PASSWORD' })
  })
})
