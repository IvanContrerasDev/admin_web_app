import { ServiceError } from './service-error'
import { requestKey, type ServiceAdapter, type ServiceRequest } from './service-adapter'

export type MockHandler = (request: ServiceRequest) => unknown | Promise<unknown>

interface PatternHandler {
  method: ServiceRequest['method']
  path: RegExp
  handler: MockHandler
}

export class MockServiceAdapter implements ServiceAdapter {
  private readonly handlers = new Map<string, MockHandler>()
  private readonly patternHandlers: PatternHandler[] = []

  register(method: ServiceRequest['method'], path: ServiceRequest['path'], handler: MockHandler) {
    const key = requestKey({ method, path })
    this.handlers.set(key, handler)
    return () => this.handlers.delete(key)
  }

  registerPattern(method: ServiceRequest['method'], path: RegExp, handler: MockHandler) {
    const entry = { method, path, handler }
    this.patternHandlers.push(entry)
    return () => {
      const index = this.patternHandlers.indexOf(entry)
      if (index >= 0) this.patternHandlers.splice(index, 1)
    }
  }

  async request(request: ServiceRequest) {
    if (request.signal?.aborted) {
      throw request.signal.reason
    }

    const key = requestKey(request)
    const handler = this.handlers.get(key) ?? this.patternHandlers.find(
      (entry) => (entry.method ?? 'GET') === (request.method ?? 'GET') && entry.path.test(request.path),
    )?.handler

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
