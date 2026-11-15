import { describe, expect, it, vi } from 'vitest'
import { HttpServiceAdapter } from './http-service-adapter'

describe('HTTP transport', () => {
  it('uses the global receiver for the default browser fetch', async () => {
    const fetcher = vi.fn<typeof fetch>(function (this: unknown) {
      if (this !== globalThis) throw new TypeError('Illegal invocation')
      return Promise.resolve(Response.json({ data: [] }))
    })
    vi.stubGlobal('fetch', fetcher)
    try {
      const adapter = new HttpServiceAdapter('https://localhost/api/v1')
      await expect(adapter.request({ path: '/users' })).resolves.toEqual({ data: [] })
      expect(fetcher).toHaveBeenCalledOnce()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('calls injected fetch without the adapter receiver', async () => {
    const fetcher = vi.fn<typeof fetch>(function (this: unknown) {
      expect(this).toBeUndefined()
      return Promise.resolve(Response.json({ data: [] }))
    })
    const adapter = new HttpServiceAdapter('https://localhost/api/v1', fetcher)
    await expect(adapter.request({ path: '/users' })).resolves.toEqual({ data: [] })
  })

  it('preserves the API prefix and escapes query values', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [] }))
    const adapter = new HttpServiceAdapter('https://localhost:3000/api/v1', fetcher)
    await adapter.request({ path: '/users', query: { search: 'á &/?', empty: null } })
    const [url, options] = fetcher.mock.calls[0]!
    expect(String(url)).toBe('https://localhost:3000/api/v1/users?search=%C3%A1+%26%2F%3F')
    expect(options?.credentials).toBe('include')
  })
  it('rejects paths which escape the configured API', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const adapter = new HttpServiceAdapter('https://localhost:3000/api/v1/', fetcher)
    await expect(adapter.request({ path: '//evil.test/users' })).rejects.toMatchObject({ code: 'INVALID_API_PATH' })
    await expect(adapter.request({ path: '/../users' })).rejects.toMatchObject({ code: 'INVALID_API_PATH' })
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('handles 204, error envelopes, JSON and cancellation without mock fallback', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(Response.json({ error: { code: 'DENIED', message: 'Sin acceso', retryable: false } }, { status: 403 }))
      .mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
    const adapter = new HttpServiceAdapter('https://localhost/api/v1', fetcher)
    await expect(adapter.request({ path: '/users', method: 'POST', body: { value: 'á' } })).resolves.toBeUndefined()
    expect(fetcher.mock.calls[0]![1]?.body).toBe('{"value":"á"}')
    await expect(adapter.request({ path: '/users' })).rejects.toMatchObject({ code: 'DENIED', status: 403 })
    const controller = new AbortController()
    controller.abort()
    await expect(adapter.request({ path: '/users', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })
})

it('transmits memory credentials through real HTTP calls with no-store auth and included cookies', async () => {
  const { AuthService } = await import('./auth-service')
  let authenticated = false
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, options) => {
    const path = new URL(String(url)).pathname
    expect(options?.credentials).toBe('include')
    if (path.includes('/auth/')) expect(options?.cache).toBe('no-store')
    if (path.endsWith('/csrf')) return Response.json({ data: { csrfToken: authenticated ? 'session-csrf' : 'preauth-csrf' } })
    const headers = new Headers(options?.headers)
    if (path.endsWith('/login')) {
      expect(headers.get('X-CSRF-Token')).toBe('preauth-csrf')
      return Response.json({ data: { twoFactorRequired: true, challengeId: 'id' } }, { status: 202 })
    }
    if (path.endsWith('/verify')) {
      expect(headers.get('X-CSRF-Token')).toBe('preauth-csrf')
      authenticated = true
      return Response.json({ data: {
        user: { id: 'id', firstName: 'Marina', lastName: 'Quiroga', employeeId: 'ADM', email: 'admin@example.test', role: 'ADMIN' },
        rememberSession: false, sessionExpiresAt: '2030-11-01T00:00:00.000Z', tokens: { accessToken: 'memory', expiresIn: 1800 },
      } })
    }
    expect(path).toBe('/api/v1/users')
    expect(headers.get('Authorization')).toBe('Bearer memory')
    expect(headers.get('X-CSRF-Token')).toBe('session-csrf')
    return new Response(null, { status: 204 })
  })
  const auth = new AuthService(new HttpServiceAdapter('http://localhost:3000/api/v1', fetcher), null)
  const challenge = await auth.login({ identifier: 'admin@example.test', password: 'secret', client: 'ADMIN', rememberSession: false })
  await auth.verifyLogin({ challengeId: challenge.challengeId, code: '123456' })
  await expect(auth.adapter.request({ method: 'POST', path: '/users', body: { firstName: 'Ana' } })).resolves.toBeUndefined()
})
