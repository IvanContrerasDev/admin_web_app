export type AdminRole = 'ADMIN' | 'SUPER_ADMIN'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeId: string
  role: AdminRole
}

export interface LoginInput {
  identifier: string
  password: string
  client: 'ADMIN'
  rememberSession: boolean
}

export interface LoginChallenge {
  challengeId: string
  expiresAt: string
  message: string
}

export interface VerifyLoginInput {
  challengeId: string
  code: string
}

export interface WebSession {
  user: AuthUser
  sessionExpiresAt: string
  rememberSession: boolean
}

export interface AuthenticatedSession extends WebSession {
  accessToken: string
  accessExpiresIn: number
}

export interface WebTokenResponse extends WebSession {
  tokens: {
    accessToken: string
    expiresIn: number
  }
}
