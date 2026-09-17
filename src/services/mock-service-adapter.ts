import { ServiceError } from './service-error'
import { requestKey, type ServiceAdapter, type ServiceRequest } from './service-adapter'

export type MockHandler = (request: ServiceRequest) => unknown | Promise<unknown>

export class MockServiceAdapter implements ServiceAdapter {
  private readonly handlers = new Map<string, MockHandler>()

  register(method: ServiceRequest['method'], path: ServiceRequest['path'], handler: MockHandler) {
    const key = requestKey({ method, path })
    this.handlers.set(key, handler)
    return () => this.handlers.delete(key)
  }

  async request(request: ServiceRequest) {
    if (request.signal?.aborted) {
      throw request.signal.reason
    }

    const key = requestKey(request)
    const handler = this.handlers.get(key)

    if (!handler) {
      throw new ServiceError({
        code: 'MOCK_ROUTE_NOT_REGISTERED',
        message: `No existe un mock registrado para ${key}.`,
        retryable: false,
        kind: 'configuration',
      })
    }

    return handler(request)
  }
}
