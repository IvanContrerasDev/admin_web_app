import { z } from 'zod'
import type {
  AuthenticatedSession,
  LoginChallenge,
  LoginInput,
  VerifyLoginInput,
  WebSession,
  WebTokenResponse,
} from '../types/auth'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

const adminRoleSchema = z.enum(['ADMIN', 'SUPER_ADMIN'])

const authUserSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  employeeId: z.string().min(1),
  role: adminRoleSchema,
})

const webSessionSchema = z.object({
  user: authUserSchema,
  sessionExpiresAt: z.string().datetime(),
  rememberSession: z.boolean(),
})

const tokenResponseSchema = webSessionSchema.extend({
  tokens: z.object({
    accessToken: z.string().min(1),
    expiresIn: z.number().int().positive(),
  }),
})

const loginChallengeSchema = z.object({
  challengeId: z.string().min(1),
  expiresAt: z.string().datetime(),
  message: z.string().min(1),
})

export class AuthService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  login(input: LoginInput): Promise<LoginChallenge> {
    return this.client.request({ method: 'POST', path: '/auth/login', body: input }, loginChallengeSchema)
  }

  async verifyLogin(input: VerifyLoginInput): Promise<AuthenticatedSession> {
    const response = await this.client.request<WebTokenResponse>(
      { method: 'POST', path: '/auth/login/2fa/verify', body: input },
      tokenResponseSchema,
    )

    return {
      user: response.user,
      sessionExpiresAt: response.sessionExpiresAt,
      rememberSession: response.rememberSession,
      accessToken: response.tokens.accessToken,
      accessExpiresIn: response.tokens.expiresIn,
    }
  }

  async bootstrap(): Promise<AuthenticatedSession> {
    await this.client.request<WebSession>({ path: '/auth/web/session' }, webSessionSchema)
    const response = await this.client.request<WebTokenResponse>(
      { method: 'POST', path: '/auth/web/refresh', body: {} },
      tokenResponseSchema,
    )

    return {
      user: response.user,
      sessionExpiresAt: response.sessionExpiresAt,
      rememberSession: response.rememberSession,
      accessToken: response.tokens.accessToken,
      accessExpiresIn: response.tokens.expiresIn,
    }
  }

  logout(): Promise<void> {
    return this.client.requestVoid({ method: 'POST', path: '/auth/web/logout', body: {} })
  }
}
