import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createServiceAdapter } from './create-service-adapter'
import { HttpServiceAdapter } from './http-service-adapter'
import { MockServiceAdapter } from './mock-service-adapter'
import { ServiceClient } from './service-client'
import { ServiceError } from './service-error'

const statusSchema = z.object({ status: z.literal('ready') })

describe('service adapters', () => {
  it('uses deterministic mocks by default', async () => {
    const adapter = createServiceAdapter({})
    expect(adapter).toBeInstanceOf(MockServiceAdapter)

    const mock = adapter as MockServiceAdapter
    mock.register('GET', '/status', () => ({ data: { status: 'ready' } }))

    await expect(new ServiceClient(mock).request({ path: '/status' }, statusSchema))
      .resolves.toEqual({ status: 'ready' })
  })

  it('fails explicitly for unregistered mock routes', async () => {
    const client = new ServiceClient(new MockServiceAdapter())

    await expect(client.request({ path: '/missing' }, statusSchema)).rejects.toMatchObject({
      code: 'MOCK_ROUTE_NOT_REGISTERED',
      kind: 'configuration',
    })
  })

  it('rejects invalid envelopes as contract errors', async () => {
    const mock = new MockServiceAdapter()
    mock.register('GET', '/status', () => ({ status: 'ready' }))

    await expect(new ServiceClient(mock).request({ path: '/status' }, statusSchema)).rejects.toMatchObject({
      code: 'INVALID_API_RESPONSE',
      kind: 'contract',
    })
  })

  it('requires a base URL in HTTP mode', () => {
    expect(() => createServiceAdapter({ VITE_SERVICE_MODE: 'http' })).toThrowError(
      expect.objectContaining({ code: 'API_BASE_URL_REQUIRED' }),
    )
  })

  it('normalizes API errors and includes credentials', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      error: { code: 'FORBIDDEN', message: 'No tenés permisos.', retryable: false },
    }), { status: 403, headers: { 'Content-Type': 'application/json' } }))
    const adapter = new HttpServiceAdapter('https://api.example.com', fetcher)

    await expect(adapter.request({ path: '/private' })).rejects.toEqual(
      expect.objectContaining({ code: 'FORBIDDEN', status: 403, retryable: false }),
    )
    expect(fetcher).toHaveBeenCalledWith(new URL('https://api.example.com/private'), expect.objectContaining({
      credentials: 'include',
    }))
  })

  it('preserves network failures as causes', async () => {
    const cause = new TypeError('offline')
    const adapter = new HttpServiceAdapter(
      'https://api.example.com',
      vi.fn<typeof fetch>().mockRejectedValue(cause),
    )

    try {
      await adapter.request({ path: '/status' })
      expect.unreachable('La solicitud debía fallar')
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError)
      expect(error).toMatchObject({ code: 'NETWORK_ERROR', retryable: true })
      expect((error as ServiceError).cause).toBe(cause)
    }
  })
})
