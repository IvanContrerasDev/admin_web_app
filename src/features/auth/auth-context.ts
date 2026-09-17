import { createContext } from 'react'
import type { AuthenticatedSession, LoginChallenge, LoginInput } from '../../types/auth'

export type AuthStatus = 'checking' | 'anonymous' | 'challenge' | 'authenticated'

export interface AuthContextValue {
  status: AuthStatus
  session: AuthenticatedSession | null
  challenge: LoginChallenge | null
  login: (input: LoginInput) => Promise<LoginChallenge>
  verify: (code: string) => Promise<AuthenticatedSession>
  cancelChallenge: () => void
  logout: () => Promise<void>
  isSubmitting: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
