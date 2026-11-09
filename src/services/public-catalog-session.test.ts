import { describe, expect, it, vi } from 'vitest'
import { AuthService } from './auth-service'
import { HttpServiceAdapter } from './http-service-adapter'
import { UserService } from './user-service'

describe('public catalogue through the shared session adapter', () => {
  it('loads registration provinces anonymously and keeps protected sites behind a session', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: { sites: [{ value: '11000000-0000-4000-8000-000000000005', label: 'San Juan' }] } }))
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    const users = new UserService(auth.adapter)
    await expect(users.listRegistrationSites()).resolves.toEqual([{ id: '11000000-0000-4000-8000-000000000005', name: 'San Juan' }])
    await expect(users.listSites()).rejects.toMatchObject({ code: 'SESSION_REAUTH_REQUIRED' })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(new Headers(fetcher.mock.calls[0]![1]?.headers).has('Authorization')).toBe(false)
  })

  it('uses Bearer for the administrative province endpoint after verification', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ data: { csrfToken: 'preauth' } }))
      .mockResolvedValueOnce(Response.json({ data: {
        user: { id: '22000000-0000-4000-8000-000000000001', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', employeeId: 'EMP-051', role: 'ADMIN' },
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(), rememberSession: false,
        tokens: { accessToken: 'verified-access', expiresIn: 1800 },
      } }))
      .mockResolvedValueOnce(Response.json({ data: { csrfToken: 'authenticated-csrf' } }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: '11000000-0000-4000-8000-000000000005', name: 'San Juan' }] }))
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    await auth.verifyLogin({ challengeId: 'challenge', code: '123456' })
    await expect(new UserService(auth.adapter).listSites()).resolves.toHaveLength(1)
    expect(String(fetcher.mock.calls[3]![0])).toBe('https://api.example.test/api/v1/sites')
    expect(new Headers(fetcher.mock.calls[3]![1]?.headers).get('Authorization')).toBe('Bearer verified-access')
  })
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

const province = { id: '11000000-0000-4000-8000-000000000005', name: 'San Juan' }
const catalogResponse = () => Response.json({ data: { sites: [{ value: province.id, label: province.name }] } })

describe('catalogue cancellation independent of session generation', () => {
  it('finishes the public catalogue while anonymous bootstrap returns 401 without refreshing', async () => {
    const bootstrapResponse = deferred<Response>()
    const publicResponse = deferred<Response>()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      if (new URL(String(url)).pathname === '/api/v1/auth/web/session') return bootstrapResponse.promise
      if (new URL(String(url)).pathname === '/api/v1/catalogs') return publicResponse.promise
      throw new Error('Unexpected authentication or refresh request')
    })
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    const bootstrap = auth.bootstrap()
    const catalog = new UserService(auth.adapter).listRegistrationSites().then((data) => ({ data }), (error: unknown) => ({ error }))
    bootstrapResponse.resolve(Response.json({ error: { code: 'INVALID_TOKEN', message: 'Sin sesión', retryable: false } }, { status: 401 }))
    await expect(bootstrap).resolves.toBeNull()
    publicResponse.resolve(catalogResponse())
    await expect(catalog).resolves.toEqual({ data: [province] })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual(['/api/v1/auth/web/session', '/api/v1/catalogs'])
    expect(auth.getSession()).toBeNull()
  })

  it('still cancels a public catalogue with its own AbortSignal and ignores its late response', async () => {
    const response = deferred<Response>()
    const fetcher = vi.fn<typeof fetch>().mockReturnValue(response.promise)
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    const controller = new AbortController()
    const pending = new UserService(auth.adapter).listRegistrationSites(controller.signal)
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejected
    expect(fetcher.mock.calls[0]![1]?.signal?.aborted).toBe(true)
    response.resolve(catalogResponse())
    expect(auth.getSession()).toBeNull()
  })

  it('cancels a private site request on logout and refuses its late successful response', async () => {
    const response = deferred<Response>()
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => {
      const path = new URL(String(url)).pathname
      if (path === '/api/v1/auth/web/csrf') return Response.json({ data: { csrfToken: 'test-csrf' } })
      if (path === '/api/v1/auth/login/2fa/verify') return Response.json({ data: {
        user: { id: '22000000-0000-4000-8000-000000000001', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', employeeId: 'EMP-051', role: 'ADMIN' },
        sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(), rememberSession: false,
        tokens: { accessToken: 'verified-access', expiresIn: 1800 },
      } })
      if (path === '/api/v1/sites') return response.promise
      if (path === '/api/v1/auth/web/logout') return new Response(null, { status: 204 })
      throw new Error(`Unexpected request ${path}`)
    })
    const auth = new AuthService(new HttpServiceAdapter('https://api.example.test/api/v1', fetcher), null)
    await auth.verifyLogin({ challengeId: 'challenge', code: '123456' })
    const pending = new UserService(auth.adapter).listSites()
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    await auth.logout()
    await rejected
    const siteRequest = fetcher.mock.calls.find(([url]) => new URL(String(url)).pathname === '/api/v1/sites')!
    expect(siteRequest[1]?.signal?.aborted).toBe(true)
    response.resolve(Response.json({ data: [province] }))
    expect(auth.getSession()).toBeNull()
  })
})
