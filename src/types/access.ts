export interface AdminAccessRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  dni: string
  employeeId: string
  address: string
  siteId: string
  birthDate: string
}
export interface AdminAccessChallenge {
  challengeId: string
  expiresAt: string
  resendAvailableAt: string
  message: string
}
export type AdminAccessDecision = 'APPROVE' | 'REJECT'
