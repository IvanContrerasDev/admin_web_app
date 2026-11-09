import { z } from 'zod'
import type { AdminAccessDecision, AdminAccessRequest } from '../types/access'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

const challengeSchema = z.object({ challengeId: z.string().min(1), expiresAt: z.string().datetime(), resendAvailableAt: z.string().datetime(), message: z.string().min(1) })
export class AccessService {
  private readonly client: ServiceClient
  constructor(adapter: ServiceAdapter, private readonly resetConfirmed: () => void = () => {}) { this.client = new ServiceClient(adapter) }
  requestAccess(input: AdminAccessRequest, signal?: AbortSignal) {
    return this.client.request({ method: 'POST', path: '/auth/admin-access-request', body: input, signal }, challengeSchema)
  }
  resend(challengeId: string, signal?: AbortSignal) {
    return this.client.request({ method: 'POST', path: '/auth/admin-access-request/resend', body: { challengeId }, signal }, challengeSchema)
  }
  verify(challengeId: string, code: string, signal?: AbortSignal) {
    return this.client.request({ method: 'POST', path: '/auth/admin-access-request/verify', body: { challengeId, code }, signal }, z.object({ status: z.literal('PENDING'), message: z.string().min(1) }))
  }
  recover(email: string, signal?: AbortSignal) {
    return this.client.request({ method: 'POST', path: '/auth/password-recovery', body: { email }, signal }, z.object({ sent: z.literal(true) }))
  }
  async reset(token: string, newPassword: string, signal?: AbortSignal) {
    const result = await this.client.request({ method: 'POST', path: '/auth/password-reset', body: { token, newPassword }, signal }, z.object({ updated: z.literal(true) }))
    this.resetConfirmed()
    return result
  }
  confirm(token: string, decision: AdminAccessDecision, signal?: AbortSignal) {
    return this.client.request({ method: 'POST', path: '/auth/admin-access/confirm', body: { token, decision }, signal }, z.object({ decision: z.enum(['APPROVED', 'REJECTED']) }))
  }
}
