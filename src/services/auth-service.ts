import { z } from 'zod'
import type {
  AuthenticatedSession,
  LoginChallenge,
  LoginInput,
  VerifyLoginInput,
  WebSession,
  WebTokenResponse,
} from '../types/auth'
import type { ServiceAdapter, ServiceRequest } from './service-adapter'
import { ServiceError } from './service-error'
import { HttpServiceAdapter } from './http-service-adapter'
import { createBrowserSessionCoordination, type SessionCoordination, type SessionSnapshot } from './session-coordination'
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
  twoFactorRequired: z.literal(true).optional(),
  expiresAt: z.string().datetime().optional(),
  message: z.string().min(1).optional(),
})

const csrfSchema = z.object({ csrfToken: z.string().min(1) })
const abortError = () => new DOMException('La sesión cambió o la operación se canceló.', 'AbortError')
const reauthError = () => new ServiceError({ code: 'SESSION_REAUTH_REQUIRED', message: 'Volvé a iniciar sesión para continuar.', retryable: false, kind: 'api', status: 401 })

export class AuthService {
  readonly adapter: ServiceAdapter
  private readonly client: ServiceClient
  private readonly coordination: SessionCoordination | null
  private session: AuthenticatedSession | null = null
  private csrfToken: string | null = null
  private accessExpiresAt = 0
  private generation = 0
  private controller = new AbortController()
  private refreshPromise: Promise<AuthenticatedSession> | null = null
  private bootstrapPromise: Promise<AuthenticatedSession | null> | null = null
  private needsLogin = false
  private listeners = new Set<(session: AuthenticatedSession | null) => void>()

  constructor(private readonly raw: ServiceAdapter, coordination?: SessionCoordination | null) {
    this.coordination = coordination === undefined && raw instanceof HttpServiceAdapter
      ? createBrowserSessionCoordination(raw.coordinationKey)
      : coordination ?? null
    this.client = new ServiceClient({ request: (request) => this.send(request) })
    this.adapter = { request: (request) => this.requestProtected(request) }
    this.coordination?.subscribe((snapshot) => {
      // Once closed, a queued peer response cannot restore this tab's session.
      if (snapshot && (this.needsLogin || (snapshot.accessExpiresAt < this.accessExpiresAt || (snapshot.accessExpiresAt === this.accessExpiresAt && snapshot.session.accessToken === this.session?.accessToken)))) return
      if (snapshot) {
        this.session = snapshot.session
        this.csrfToken = snapshot.csrfToken
        this.accessExpiresAt = snapshot.accessExpiresAt
        this.needsLogin = false
      } else this.invalidate(false)
      this.notify()
    }, () => this.snapshot())
  }

  getSession() { return this.session }

  invalidateAfterPasswordReset() { this.invalidate(); this.notify() }

  refreshDelay(session: AuthenticatedSession) {
    const now = Date.now()
    const expiresAt = this.session === session ? this.accessExpiresAt : now + session.accessExpiresIn * 1000
    const absolute = Date.parse(session.sessionExpiresAt)
    return Math.max(0, expiresAt - now - (expiresAt < absolute ? 30_000 : 0))
  }

  subscribe(listener: (session: AuthenticatedSession | null) => void) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private snapshot(): SessionSnapshot | null {
    return this.session && this.csrfToken
      ? { session: this.session, csrfToken: this.csrfToken, accessExpiresAt: this.accessExpiresAt }
      : null
  }

  private notify() { this.listeners.forEach((listener) => listener(this.session)) }

  private invalidate(broadcast = true) {
    this.generation++
    this.controller.abort()
    this.controller = new AbortController()
    this.session = null
    this.csrfToken = null
    this.accessExpiresAt = 0
    this.needsLogin = true
    this.refreshPromise = null
    this.bootstrapPromise = null
    if (broadcast) this.coordination?.publish(null)
  }

  private commit(response: WebTokenResponse) {
    this.session = {
      user: response.user, sessionExpiresAt: response.sessionExpiresAt,
      rememberSession: response.rememberSession, accessToken: response.tokens.accessToken,
      accessExpiresIn: response.tokens.expiresIn,
    }
    this.accessExpiresAt = Math.min(Date.now() + response.tokens.expiresIn * 1000, Date.parse(response.sessionExpiresAt))
    this.needsLogin = false
    this.coordination?.publish(this.snapshot())
    this.notify()
    return this.session
  }

  private async send(request: ServiceRequest, sessionBound = true): Promise<unknown> {
    const generation = this.generation
    const sessionSignal = sessionBound ? this.controller.signal : undefined
    const signal = request.signal
    if (sessionSignal?.aborted || signal?.aborted) throw abortError()
    const controller = new AbortController()
    const abort = () => controller.abort()
    sessionSignal?.addEventListener('abort', abort, { once: true })
    signal?.addEventListener('abort', abort, { once: true })
    let rejectAbort!: (reason: unknown) => void
    const cancelled = new Promise<never>((_, reject) => { rejectAbort = reject })
    const reject = () => rejectAbort(abortError())
    controller.signal.addEventListener('abort', reject, { once: true })
    try {
      const result = await Promise.race([this.raw.request({
        ...request, signal: controller.signal,
        headers: {
          ...(sessionBound && this.session ? { Authorization: `Bearer ${this.session.accessToken}` } : {}),
          ...(sessionBound && this.csrfToken && request.method && request.method !== 'GET' ? { 'X-CSRF-Token': this.csrfToken } : {}),
          ...request.headers,
        },
      }), cancelled])
      if (sessionBound && generation !== this.generation) throw abortError()
      return result
    } finally {
      sessionSignal?.removeEventListener('abort', abort)
      signal?.removeEventListener('abort', abort)
      controller.signal.removeEventListener('abort', reject)
    }
  }

  private async csrf() {
    const generation = this.generation
    const { csrfToken } = await this.client.request({ path: '/auth/web/csrf' }, csrfSchema)
    if (generation !== this.generation) throw abortError()
    this.csrfToken = csrfToken
  }

  async login(input: LoginInput): Promise<LoginChallenge> {
    const generation = this.generation
    await this.csrf()
    if (generation !== this.generation) throw abortError()
    return this.client.request({ method: 'POST', path: '/auth/login', body: input }, loginChallengeSchema)
  }

  async verifyLogin(input: VerifyLoginInput): Promise<AuthenticatedSession> {
    const generation = this.generation
    await this.csrf()
    if (generation !== this.generation) throw abortError()
    const response = await this.client.request({ method: 'POST', path: '/auth/login/2fa/verify', body: input }, tokenResponseSchema)
    await this.csrf()
    if (generation !== this.generation) throw abortError()
    return this.commit(response)
  }

  bootstrap(): Promise<AuthenticatedSession | null> {
    if (this.bootstrapPromise) return this.bootstrapPromise
    const operation = this.doBootstrap()
    this.bootstrapPromise = operation
    void operation.finally(() => { if (this.bootstrapPromise === operation) this.bootstrapPromise = null }).catch(() => undefined)
    return operation
  }

  private async doBootstrap(): Promise<AuthenticatedSession | null> {
    if (this.needsLogin) return null
    try {
      await this.client.request<WebSession>({ path: '/auth/web/session' }, webSessionSchema)
      if (this.session && this.accessExpiresAt > Date.now()) return this.session
      return await this.refresh()
    } catch (error) {
      if (error instanceof ServiceError && error.status === 401) {
        this.invalidate()
        return null
      }
      throw error
    }
  }

  refresh(rejectedAccess?: string): Promise<AuthenticatedSession> {
    if (this.refreshPromise) return this.refreshPromise
    if (this.needsLogin) return Promise.reject(reauthError())
    const generation = this.generation
    const previousAccess = rejectedAccess ?? this.session?.accessToken
    const operation = async () => {
      // A peer may have renewed while this tab was waiting for the origin lock.
      if (this.session && this.session.accessToken !== previousAccess && this.accessExpiresAt > Date.now()) return this.session
      if (generation !== this.generation || this.needsLogin) throw abortError()
      try {
        if (this.session && Date.parse(this.session.sessionExpiresAt) <= Date.now()) throw reauthError()
        await this.csrf()
        const timeout = new AbortController()
        const timer = setTimeout(() => timeout.abort(), 15_000)
        let response: WebTokenResponse
        try {
          response = await this.client.request({ method: 'POST', path: '/auth/web/refresh', body: {}, signal: timeout.signal }, tokenResponseSchema)
        } finally { clearTimeout(timer) }
        if (generation !== this.generation) throw abortError()
        return this.commit(response)
      } catch (error) {
        if (generation !== this.generation) throw abortError()
        this.invalidate()
        this.notify()
        throw new ServiceError({ code: 'SESSION_REAUTH_REQUIRED', message: 'No se pudo confirmar la renovación. Volvé a iniciar sesión.', retryable: false, kind: 'api', status: 401, cause: error })
      }
    }
    const pending = this.coordination ? this.coordination.exclusive(operation) : operation()
    const promise = pending.catch((error: unknown) => {
      if (generation === this.generation) {
        this.invalidate()
        this.notify()
      }
      throw error
    })
    this.refreshPromise = promise
    void promise.finally(() => { if (this.refreshPromise === promise) this.refreshPromise = null }).catch(() => undefined)
    return promise
  }

  private async requestProtected(request: ServiceRequest): Promise<unknown> {
    if (request.signal?.aborted) throw abortError()
    // Catalogue lifetime belongs to its caller, including during anonymous bootstrap.
    if ((request.method ?? 'GET') === 'GET' && request.path === '/catalogs') return this.send(request, false)
    if (request.method === 'POST' && ['/auth/password-recovery', '/auth/password-reset', '/auth/admin-access/confirm', '/auth/admin-access-request', '/auth/admin-access-request/verify', '/auth/admin-access-request/resend'].includes(request.path)) return this.send(request, false)
    // Auth keeps session generation checks without refresh/OTP replay.
    if (request.path.startsWith('/auth/')) return this.send(request)
    if (!this.session || this.needsLogin) throw reauthError()
    if (this.accessExpiresAt <= Date.now()) await this.refresh()
    const access = this.session?.accessToken
    const generation = this.generation
    try { return await this.send(request) } catch (error) {
      if (!(error instanceof ServiceError) || error.status !== 401 || generation !== this.generation) throw error
      await this.refresh(access)
      if (request.signal?.aborted) throw abortError()
      try { return await this.send(request) } catch (retryError) {
        if (retryError instanceof ServiceError && retryError.status === 401) {
          this.invalidate()
          this.notify()
        }
        throw retryError
      }
    }
  }

  async logout(): Promise<void> {
    const csrfToken = this.csrfToken
    this.invalidate()
    this.notify()
    // Serialize revocation with rotation. A late rotation cannot repopulate local state.
    const revoke = async () => {
      if (!csrfToken) await this.csrf()
      await this.client.requestVoid({ method: 'POST', path: '/auth/web/logout', body: {}, headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : undefined })
      this.csrfToken = null
    }
    if (this.coordination) await this.coordination.exclusive(revoke)
    else await revoke()
  }
}
