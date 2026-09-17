import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type PropsWithChildren } from 'react'
import { authService } from '../../services/services'
import type { LoginChallenge, LoginInput, VerifyLoginInput } from '../../types/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

const sessionQueryKey = ['auth', 'session'] as const

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null)
  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: () => authService.bootstrap(),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: setChallenge,
  })

  const verifyMutation = useMutation({
    mutationFn: (input: VerifyLoginInput) => authService.verifyLogin(input),
    onSuccess: (session) => {
      queryClient.setQueryData(sessionQueryKey, session)
      setChallenge(null)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: async () => {
      setChallenge(null)
      await queryClient.cancelQueries()
      queryClient.clear()
    },
  })

  const session = sessionQuery.data ?? null
  const status: AuthStatus = sessionQuery.isPending
    ? 'checking'
    : session
      ? 'authenticated'
      : challenge
        ? 'challenge'
        : 'anonymous'

  const value: AuthContextValue = {
    status,
    session,
    challenge,
    login: async (input) => loginMutation.mutateAsync(input),
    verify: async (code) => {
      if (!challenge) throw new Error('No hay un desafío de acceso activo.')
      return verifyMutation.mutateAsync({ challengeId: challenge.challengeId, code })
    },
    cancelChallenge: () => setChallenge(null),
    logout: async () => logoutMutation.mutateAsync(),
    isSubmitting: loginMutation.isPending || verifyMutation.isPending || logoutMutation.isPending,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
