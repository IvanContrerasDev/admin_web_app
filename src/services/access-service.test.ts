import { describe, expect, it, vi } from 'vitest'
import { AccessService } from './access-service'
import { AuthService } from './auth-service'
import { HttpServiceAdapter } from './http-service-adapter'

const challenge = { challengeId: 'c1', expiresAt: '2026-11-05T14:10:00Z', resendAvailableAt: '2026-11-05T14:01:00Z', message: 'Revisá tu email' }
const input = { firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', password: ' x ', phone: '2645550199', dni: '41234567', employeeId: 'EMP-051', address: 'Mitre 150', siteId: '11000000-0000-4000-8000-000000000005', birthDate: '2000-05-20' }
describe('public access contract', () => {
  it('sends the ten fields unchanged, replaces challenge and submits PENDING', async () => {
    const request = vi.fn().mockResolvedValueOnce({ data: challenge }).mockResolvedValueOnce({ data: { ...challenge, challengeId: 'c2' } }).mockResolvedValueOnce({ data: { status: 'PENDING', message: 'Pendiente' } })
    const service = new AccessService({ request })
    expect(await service.requestAccess(input)).toEqual(challenge)
    expect(request.mock.calls[0]![0]).toMatchObject({ method: 'POST', path: '/auth/admin-access-request', body: input })
    expect((await service.resend('c1')).challengeId).toBe('c2')
    expect(await service.verify('c2', '123456')).toEqual({ status: 'PENDING', message: 'Pendiente' })
    expect(request.mock.calls[2]![0].body).toEqual({ challengeId: 'c2', code: '123456' })
  })
  it('validates response shapes and preserves API error codes', async () => {
    const service = new AccessService({ request: vi.fn().mockResolvedValue({ data: { challengeId: 'c' } }) })
    await expect(service.resend('c')).rejects.toMatchObject({ code: 'INVALID_API_RESPONSE' })
  })
  it.each(['/auth/password-reset', '/auth/admin-access/confirm', '/auth/password-recovery', '/auth/admin-access-request'])('keeps %s alive across anonymous bootstrap401, while honoring its own cancellation', async (path) => {
    let finish!: (value: Response) => void
    let session!: (value: Response) => void
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => new URL(String(url)).pathname.endsWith('/web/session') ? new Promise((resolve) => { session = resolve }) : new Promise((resolve) => { finish = resolve }))
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    const bootstrap = auth.bootstrap()
    const controller = new AbortController()
    const pending = auth.adapter.request({ method: 'POST', path: path as '/auth/password-reset', body: {}, signal: controller.signal })
    session(Response.json({ error: { code: 'INVALID_TOKEN', message: 'Sin sesión', retryable: false } }, { status: 401 }))
    await bootstrap
    finish(Response.json({ data: { updated: true } }))
    await expect(pending).resolves.toEqual({ data: { updated: true } })
    expect(new Headers(fetcher.mock.calls[1]![1]?.headers).has('Authorization')).toBe(false)
    const cancelled = auth.adapter.request({ method: 'POST', path: path as '/auth/password-reset', signal: controller.signal })
    const assertion = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
  })
})

it('recovery/reset/decision use exact public POST DTOs; only confirmed reset clears local session', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ data: { sent: true } })).mockResolvedValueOnce(Response.json({ data: { updated: true } })).mockResolvedValueOnce(Response.json({ data: { decision: 'APPROVED' } }))
  const invalidated = vi.fn()
  const service = new AccessService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), invalidated)
  await service.recover('ana@example.test')
  expect(invalidated).not.toHaveBeenCalled()
  await service.reset('secret', ' nueva frase segura ')
  expect(invalidated).toHaveBeenCalledOnce()
  await service.confirm('decision-token', 'APPROVE')
  expect(fetcher.mock.calls.map(([url, init]) => [String(url), init?.method, JSON.parse(String(init?.body))])).toEqual([
    ['https://api.example.test/api/v1/auth/password-recovery', 'POST', { email: 'ana@example.test' }],
    ['https://api.example.test/api/v1/auth/password-reset', 'POST', { token: 'secret', newPassword: ' nueva frase segura ' }],
    ['https://api.example.test/api/v1/auth/admin-access/confirm', 'POST', { token: 'decision-token', decision: 'APPROVE' }],
  ])
})
it.each([['INVALID_TOKEN', 401], ['TOKEN_EXPIRED', 410], ['REQUEST_ALREADY_DECIDED', 409], ['VALIDATION_ERROR', 422]] as const)('preserves %s and does not invalidate on failed reset', async (code, status) => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: { code, message: 'Revisá el enlace o los datos.', retryable: false } }, { status }))
  const invalidated = vi.fn()
  await expect(new AccessService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), invalidated).reset('token', 'nueva frase segura')).rejects.toMatchObject({ code, status })
  expect(invalidated).not.toHaveBeenCalled()
})

it('a confirmed reset invalidates an authenticated local session and notifies consumers', async () => {
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => {
    const path = new URL(String(url)).pathname
    if (path.endsWith('/web/csrf')) return Response.json({ data: { csrfToken: 'csrf' } })
    if (path.endsWith('/2fa/verify')) return Response.json({ data: {
      user: { id: 'admin', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', employeeId: 'ADM1', role: 'ADMIN' },
      sessionExpiresAt: new Date(Date.now()+3600000).toISOString(), rememberSession: false, tokens: { accessToken: 'access', expiresIn: 1800 },
    } })
    if (path.endsWith('/password-reset')) return Response.json({ data: { updated: true } })
    throw new Error('Unexpected request')
  })
  const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
  await auth.verifyLogin({ challengeId: 'c', code: '123456' })
  expect(auth.getSession()).not.toBeNull()
  const listener = vi.fn()
  auth.subscribe(listener)
  await new AccessService(auth.adapter, () => auth.invalidateAfterPasswordReset()).reset('reset-token', 'una frase segura')
  expect(auth.getSession()).toBeNull()
  expect(listener).toHaveBeenLastCalledWith(null)
  await expect(auth.adapter.request({ path: '/sites' })).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED' })
})
