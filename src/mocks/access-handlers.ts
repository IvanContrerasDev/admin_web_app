import { MockServiceAdapter } from '../services/mock-service-adapter'
import { ServiceError } from '../services/service-error'

/** UI simulation only. Does not send email, store profiles or prove identity. */
export function registerAccessMockRoutes(adapter: MockServiceAdapter) {
  let sequence = 0
  let active: { id: string; resendAt: number } | null = null
  const decided = new Set<string>()
  const fail = (code: string, message: string, status: number): never => { throw new ServiceError({ code, message, status, retryable: false, kind: 'api' }) }
  const challenge = () => {
    active = { id: `mock-admin-${++sequence}`, resendAt: Date.now() + 60_000 }
    return { data: { challengeId: active.id, expiresAt: new Date(Date.now() + 600_000).toISOString(), resendAvailableAt: new Date(active.resendAt).toISOString(), message: 'Simulación local: ingresá 123456. No se envía correo.' } }
  }
  adapter.register('POST', '/auth/admin-access-request', challenge)
  adapter.register('POST', '/auth/admin-access-request/resend', (request) => {
    const body = request.body as { challengeId?: string }
    if (body?.challengeId !== active?.id) fail('INVALID_OTP', 'Volvé a iniciar la solicitud.', 401)
    if (active && Date.now() < active.resendAt) fail('OTP_RESEND_TOO_SOON', 'Esperá antes de reenviar el código.', 429)
    return challenge()
  })
  adapter.register('POST', '/auth/admin-access-request/verify', (request) => {
    const body = request.body as { challengeId?: string; code?: string }
    if (!active || body?.challengeId !== active.id || body.code !== '123456') fail('INVALID_OTP', 'Revisá el código de verificación.', 401)
    return { data: { status: 'PENDING', message: 'Simulación local: solicitud pendiente. No se crea cuenta ni se envía correo.' } }
  })
  adapter.register('POST', '/auth/password-recovery', () => ({ data: { sent: true } }))
  adapter.register('POST', '/auth/password-reset', (request) => {
    const body = request.body as { token?: string; newPassword?: string }
    if (!body?.token) fail('INVALID_TOKEN', 'El enlace no es válido.', 401)
    if (typeof body.newPassword !== 'string' || [...body.newPassword].length < 8 || [...body.newPassword].length > 30) fail('WEAK_PASSWORD', 'La contraseña debe tener entre 8 y 30 caracteres.', 400)
    return { data: { updated: true } }
  })
  adapter.register('POST', '/auth/admin-access/confirm', (request) => {
    const body = request.body as { token?: string; decision?: string }
    if (!body?.token || !['APPROVE', 'REJECT'].includes(body.decision ?? '')) fail('INVALID_TOKEN', 'El enlace no es válido.', 401)
    if (decided.has(body.token!)) fail('REQUEST_ALREADY_DECIDED', 'La solicitud ya fue decidida.', 409)
    decided.add(body.token!)
    return { data: { decision: body.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' } }
  })
}
