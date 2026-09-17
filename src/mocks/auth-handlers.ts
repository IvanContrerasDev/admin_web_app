import type { AuthUser, LoginInput, VerifyLoginInput, WebSession } from '../types/auth'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import { ServiceError } from '../services/service-error'

const MOCK_USER: AuthUser = {
  id: 'a1000000-0000-4000-8000-000000000001',
  firstName: 'Marina',
  lastName: 'Quiroga',
  email: 'marina.quiroga@example.test',
  employeeId: 'ADM-014',
  role: 'ADMIN',
}

function requireBody<T>(request: ServiceRequest): T {
  if (!request.body || typeof request.body !== 'object') {
    throw new ServiceError({
      code: 'VALIDATION_ERROR',
      message: 'Revisá los datos ingresados.',
      retryable: false,
      kind: 'api',
      status: 400,
    })
  }
  return request.body as T
}

function unauthorized(message = 'La sesión no está disponible.') {
  return new ServiceError({
    code: 'UNAUTHORIZED',
    message,
    retryable: false,
    kind: 'api',
    status: 401,
  })
}

export function registerAuthMockRoutes(adapter: MockServiceAdapter, now: () => Date = () => new Date()) {
  let activeChallenge: { id: string; rememberSession: boolean } | null = null
  let activeSession: WebSession | null = null

  adapter.register('POST', '/auth/login', (request) => {
    const input = requireBody<LoginInput>(request)

    if (input.client !== 'ADMIN') {
      throw new ServiceError({
        code: 'ROLE_NOT_ALLOWED',
        message: 'Esta cuenta no tiene acceso a la aplicación administrativa.',
        retryable: false,
        kind: 'api',
        status: 403,
      })
    }

    if (input.identifier.toLowerCase() === 'pendiente@example.test') {
      throw new ServiceError({
        code: 'ADMIN_ACCESS_PENDING',
        message: 'Su solicitud de acceso administrativo se encuentra pendiente de aprobación.',
        retryable: false,
        kind: 'api',
        status: 403,
      })
    }

    if (!input.identifier || !input.password) {
      throw unauthorized('El email o la contraseña no son correctos.')
    }

    const challengeId = `mock-challenge-${now().getTime()}`
    activeChallenge = { id: challengeId, rememberSession: input.rememberSession }

    return {
      data: {
        challengeId,
        expiresAt: new Date(now().getTime() + 10 * 60 * 1000).toISOString(),
        message: 'Ingresá el código de 6 dígitos que enviamos a tu email.',
      },
    }
  })

  adapter.register('POST', '/auth/login/2fa/verify', (request) => {
    const input = requireBody<VerifyLoginInput>(request)

    if (!activeChallenge || input.challengeId !== activeChallenge.id) {
      throw unauthorized('El desafío de acceso venció. Volvé a iniciar sesión.')
    }

    if (!/^\d{6}$/.test(input.code)) {
      throw new ServiceError({
        code: 'INVALID_OTP',
        message: 'El código debe contener 6 dígitos.',
        retryable: false,
        kind: 'api',
        status: 400,
      })
    }

    activeSession = {
      user: MOCK_USER,
      rememberSession: activeChallenge.rememberSession,
      sessionExpiresAt: new Date(now().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
    activeChallenge = null

    return {
      data: {
        ...activeSession,
        tokens: { accessToken: `mock-access-${now().getTime()}`, expiresIn: 1800 },
      },
    }
  })

  adapter.register('GET', '/auth/web/session', () => {
    if (!activeSession) throw unauthorized()
    return { data: activeSession }
  })

  adapter.register('POST', '/auth/web/refresh', () => {
    if (!activeSession) throw unauthorized()
    return {
      data: {
        ...activeSession,
        tokens: { accessToken: `mock-access-${now().getTime()}`, expiresIn: 1800 },
      },
    }
  })

  adapter.register('POST', '/auth/web/logout', () => {
    activeChallenge = null
    activeSession = null
    return undefined
  })
}
