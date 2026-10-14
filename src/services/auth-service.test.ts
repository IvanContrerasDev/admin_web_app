import { describe, expect, it } from 'vitest'
import { registerAuthMockRoutes } from '../mocks/auth-handlers'
import { AuthService } from './auth-service'
import { MockServiceAdapter } from './mock-service-adapter'
import { ServiceError } from './service-error'

function createAuthHarness() {
  const adapter = new MockServiceAdapter()
  registerAuthMockRoutes(adapter, () => new Date('2026-09-17T12:00:00.000Z'))
  return new AuthService(adapter)
}

describe('AuthService with the contractual mock', () => {
  it('does not create a session before the 2FA challenge is verified', async () => {
    const service = createAuthHarness()
    const challenge = await service.login({
      identifier: 'admin@example.test',
      password: 'entrada efímera',
      client: 'ADMIN',
      rememberSession: true,
    })

    expect(challenge).toEqual({
      challengeId: 'mock-challenge-1789646400000',
      expiresAt: '2026-09-17T12:10:00.000Z',
      message: 'Ingresá el código de 6 dígitos que enviamos a tu email.',
    })
    await expect(service.bootstrap()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('keeps the access token in the returned in-memory session and logs out idempotently', async () => {
    const service = createAuthHarness()
    const challenge = await service.login({
      identifier: 'admin@example.test',
      password: 'entrada efímera',
      client: 'ADMIN',
      rememberSession: false,
    })
    const session = await service.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })

    expect(session.user.role).toBe('ADMIN')
    expect(session.rememberSession).toBe(false)
    expect(session.accessToken).toBe('mock-access-1789646400000')

    await service.logout()
    await service.logout()
    await expect(service.bootstrap()).rejects.toBeInstanceOf(ServiceError)
  })

  it('rejects a code that is not exactly 6 digits', async () => {
    const service = createAuthHarness()
    const challenge = await service.login({
      identifier: 'admin@example.test',
      password: 'entrada efímera',
      client: 'ADMIN',
      rememberSession: false,
    })

    await expect(service.verifyLogin({ challengeId: challenge.challengeId, code: '12345' })).rejects.toMatchObject({
      code: 'INVALID_OTP',
    })
  })
  it.each(['ADMIN', 'SUPER_ADMIN'])('accepts the administrative role %s during verification and bootstrap', async (role) => {
    const adapter = new MockServiceAdapter()
    const session = {
      user: { id: 'admin-id', firstName: 'Marina', lastName: 'Quiroga', email: 'admin@example.test', employeeId: 'ADM-014', role },
      sessionExpiresAt: '2026-10-01T12:00:00.000Z',
      rememberSession: false,
    }
    const response = { data: { ...session, tokens: { accessToken: 'access', expiresIn: 1800 } } }
    adapter.register('POST', '/auth/login/2fa/verify', () => response)
    adapter.register('GET', '/auth/web/session', () => ({ data: session }))
    adapter.register('POST', '/auth/web/refresh', () => response)
    const service = new AuthService(adapter)
    await expect(service.verifyLogin({ challengeId: 'challenge', code: '123456' })).resolves.toMatchObject({ user: { role } })
    await expect(service.bootstrap()).resolves.toMatchObject({ user: { role } })
  })

  it('rejects a non-administrative role from API responses', async () => {
    const adapter = new MockServiceAdapter()
    const session = {
      user: { id: 'employee-id', firstName: 'Lucía', lastName: 'Álvarez', email: 'employee@example.test', employeeId: 'EMP-018', role: 'EMPLOYEE' },
      sessionExpiresAt: '2026-10-01T12:00:00.000Z',
      rememberSession: false,
    }
    adapter.register('GET', '/auth/web/session', () => ({ data: session }))
    adapter.register('POST', '/auth/login/2fa/verify', () => ({ data: { ...session, tokens: { accessToken: 'access', expiresIn: 1800 } } }))
    const service = new AuthService(adapter)
    await expect(service.bootstrap()).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE', kind: 'contract' })
    await expect(service.verifyLogin({ challengeId: 'challenge', code: '123456' })).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE', kind: 'contract' })
  })
})
