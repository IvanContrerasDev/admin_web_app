import { registerAuthMockRoutes } from '../mocks/auth-handlers'
import { registerOrganizationMockRoutes } from '../mocks/organization-handlers'
import { registerUserMockRoutes } from '../mocks/user-handlers'
import { HttpServiceAdapter } from './http-service-adapter'
import { MockServiceAdapter } from './mock-service-adapter'
import type { ServiceAdapter } from './service-adapter'
import { ServiceError } from './service-error'

export interface ServiceEnvironment {
  VITE_SERVICE_MODE?: string
  VITE_API_BASE_URL?: string
}

export function createServiceAdapter(environment: ServiceEnvironment): ServiceAdapter {
  const mode = environment.VITE_SERVICE_MODE ?? 'mock'

  if (mode === 'mock') {
    const adapter = new MockServiceAdapter()
    registerAuthMockRoutes(adapter)
    registerUserMockRoutes(adapter)
    registerOrganizationMockRoutes(adapter)
    return adapter
  }

  if (mode === 'http') {
    if (!environment.VITE_API_BASE_URL) {
      throw new ServiceError({
        code: 'API_BASE_URL_REQUIRED',
        message: 'Falta configurar la URL base de la API.',
        retryable: false,
        kind: 'configuration',
      })
    }

    return new HttpServiceAdapter(environment.VITE_API_BASE_URL)
  }

  throw new ServiceError({
    code: 'INVALID_SERVICE_MODE',
    message: 'El modo de servicios configurado no es válido.',
    retryable: false,
    kind: 'configuration',
  })
}
