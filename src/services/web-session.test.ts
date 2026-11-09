import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth-service'
import { MockServiceAdapter } from './mock-service-adapter'
import { registerAuthMockRoutes } from '../mocks/auth-handlers'
import { ServiceError } from './service-error'
import { createBrowserSessionCoordination } from './session-coordination'
import { installSessionBrowser } from '../test/session-browser'
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}
const input = { identifier: 'admin@example.test', password: 'secret', client: 'ADMIN' as const, rememberSession: false }
async function harness() {
  const raw = new MockServiceAdapter()
  registerAuthMockRoutes(raw)
  const auth = new AuthService(raw)
  const challenge = await auth.login(input)
  const session = await auth.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })
  return { raw, auth, session }
}
const unauthorized = () => new ServiceError({ code: 'INVALID_TOKEN', message: 'Venció', status: 401, retryable: false, kind: 'api' })

describe('in-memory web session', () => {
  it('sends Bearer and renewed session CSRF to protected mutations', async () => {
    const { raw, auth, session } = await harness()
    raw.register('POST', '/users', (request) => ({ headers: request.headers }))
    const result = await auth.adapter.request({ method: 'POST', path: '/users', body: {} })
    expect(result).toMatchObject({ headers: { Authorization: `Bearer ${session.accessToken}`, 'X-CSRF-Token': 'mock-session-csrf' } })
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
  it('joins concurrent 401 renewals and retries each protected request only once', async () => {
    const { raw, auth, session } = await harness()
    const gate = deferred<unknown>()
    let refreshes = 0
    let calls = 0
    raw.register('GET', '/users', (request) => {
      calls++
      if (request.headers?.Authorization === `Bearer ${session.accessToken}`) throw unauthorized()
      return { data: ['ok'] }
    })
    raw.register('POST', '/auth/web/refresh', () => { refreshes++; return gate.promise })
    const a = auth.adapter.request({ path: '/users' })
    const b = auth.adapter.request({ path: '/users' })
    await vi.waitFor(() => expect(refreshes).toBe(1))
    gate.resolve({ data: { user: session.user, sessionExpiresAt: session.sessionExpiresAt, rememberSession: false, tokens: { accessToken: 'renewed', expiresIn: 1800 } } })
    await expect(Promise.all([a, b])).resolves.toEqual([{ data: ['ok'] }, { data: ['ok'] }])
    expect(refreshes).toBe(1)
    expect(calls).toBe(4)
  })
  it('requires relogin after ambiguous refresh and does not retry rotation', async () => {
    const { raw, auth } = await harness()
    let refreshes = 0
    raw.register('POST', '/auth/web/refresh', () => { refreshes++; throw new Error('Lost response') })
    await expect(auth.refresh()).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED', retryable: false })
    await expect(auth.refresh()).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED' })
    expect(refreshes).toBe(1)
    expect(auth.getSession()).toBeNull()
  })
  it('ignores verification responses which arrive after logout', async () => {
    const raw = new MockServiceAdapter()
    registerAuthMockRoutes(raw)
    const auth = new AuthService(raw)
    const challenge = await auth.login(input)
    const response = deferred<unknown>()
    raw.register('POST', '/auth/login/2fa/verify', () => response.promise)
    const verify = auth.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })
    const rejected = expect(verify).rejects.toMatchObject({ name: 'AbortError' })
    await auth.logout()
    response.resolve({ data: {} })
    await rejected
    expect(auth.getSession()).toBeNull()
  })
  it('does not reopen a session when refresh finishes after logout', async () => {
    const { raw, auth, session } = await harness()
    const response = deferred<unknown>()
    raw.register('POST', '/auth/web/refresh', () => response.promise)
    const refresh = auth.refresh()
    const rejected = expect(refresh).rejects.toMatchObject({ name: 'AbortError' })
    await auth.logout()
    response.resolve({ data: { ...session, tokens: { accessToken: 'late', expiresIn: 1800 } } })
    await rejected
    expect(auth.getSession()).toBeNull()
  })
  it('never refreshes an invalid OTP', async () => {
    const { raw, auth } = await harness()
    const refresh = vi.fn(() => { throw new Error('Unexpected refresh') })
    raw.register('POST', '/auth/web/refresh', refresh)
    raw.register('POST', '/auth/login/2fa/verify', () => { throw unauthorized() })
    await expect(auth.verifyLogin({ challengeId: 'x', code: '000000' })).rejects.toMatchObject({ status: 401 })
    expect(refresh).not.toHaveBeenCalled()
  })
})

it('renews an expired access before sending the protected request', async () => {
  const { raw, auth, session } = await harness()
  const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31 * 60 * 1000)
  let refreshed = false
  raw.register('POST', '/auth/web/refresh', () => {
    refreshed = true
    return { data: { ...session, tokens: { accessToken: 'fresh', expiresIn: 1800 } } }
  })
  raw.register('GET', '/users', (request) => {
    expect(refreshed).toBe(true)
    return request.headers?.Authorization
  })
  await expect(auth.adapter.request({ path: '/users' })).resolves.toBe('Bearer fresh')
  clock.mockRestore()
})

it('stops a hanging refresh after timeout without a second rotation', async () => {
  const { raw, auth } = await harness()
  vi.useFakeTimers()
  let calls = 0
  raw.register('POST', '/auth/web/refresh', () => { calls++; return new Promise(() => undefined) })
  const refresh = auth.refresh()
  const rejected = expect(refresh).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED', retryable: false })
  await vi.advanceTimersByTimeAsync(15_001)
  await rejected
  await expect(auth.refresh()).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED' })
  expect(calls).toBe(1)
  vi.useRealTimers()
})


it('shares a single rotation across two tabs and propagates online logout', async () => {
  installSessionBrowser()
  const a = createBrowserSessionCoordination('shared-api')
  const b = createBrowserSessionCoordination('shared-api')
  const raw = new MockServiceAdapter()
  registerAuthMockRoutes(raw)
  const first = new AuthService(raw, a)
  const second = new AuthService(raw, b)
  try {
    const challenge = await first.login(input)
    const session = await first.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })
    await vi.waitFor(() => expect(second.getSession()?.accessToken).toBe(session.accessToken))
    let rotations = 0
    raw.register('POST', '/auth/web/refresh', () => {
      rotations++
      return { data: { ...session, tokens: { accessToken: 'shared-renewed', expiresIn: 1800 } } }
    })
    const readResponse = deferred<unknown>()
    raw.register('GET', '/users', () => readResponse.promise)
    const pendingRead = second.adapter.request({ path: '/users' })
    const successfulRead = expect(pendingRead).resolves.toEqual({ data: ['still valid'] })
    const results = await Promise.all([first.refresh(), second.refresh()])
    readResponse.resolve({ data: ['still valid'] })
    await successfulRead
    expect(results.map((value) => value.accessToken)).toEqual(['shared-renewed', 'shared-renewed'])
    expect(rotations).toBe(1)
    await first.logout()
    await vi.waitFor(() => expect(second.getSession()).toBeNull())
  } finally { a.close(); b.close() }
})

it('rejects repeated protected 401 after one renewal and clears the session', async () => {
  const { raw, auth } = await harness()
  let reads = 0
  raw.register('GET', '/users', () => { reads++; throw unauthorized() })
  await expect(auth.adapter.request({ path: '/users' })).rejects.toMatchObject({ status: 401 })
  expect(reads).toBe(2)
  expect(auth.getSession()).toBeNull()
})

it('clears the session if cross-tab coordination cannot confirm safe renewal', async () => {
  const raw = new MockServiceAdapter()
  registerAuthMockRoutes(raw)
  const auth = new AuthService(raw, {
    exclusive: async () => { throw new ServiceError({ code: 'SESSION_COORDINATION_UNAVAILABLE', message: 'Sin coordinación', retryable: false, kind: 'configuration' }) },
    publish() {}, subscribe() {}, close() {},
  })
  const challenge = await auth.login(input)
  await auth.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })
  await expect(auth.refresh()).rejects.toMatchObject({ code: 'SESSION_COORDINATION_UNAVAILABLE' })
  expect(auth.getSession()).toBeNull()
})
