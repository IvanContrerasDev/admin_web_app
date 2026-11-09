import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { authService } from '../../services/services'
import type { LoginChallenge, LoginInput, VerifyLoginInput } from '../../types/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './auth-context'

const sessionQueryKey = ['auth', 'session'] as const

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const generation = useRef(0)
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null)
  const [logoutWarning, setLogoutWarning] = useState<string | null>(null)
  const clearLocal = () => {
    generation.current++
    setChallenge(null)
    void queryClient.cancelQueries()
    queryClient.clear()
    queryClient.setQueryData(sessionQueryKey, null)
  }

  useEffect(() => authService.subscribe((session) => {
    if (!session) {
      if (queryClient.getQueryData(sessionQueryKey)) {
        setLogoutWarning('La sesión se cerró en este dispositivo. Podés confirmar el cierre remoto antes de volver a ingresar.')
      }
      generation.current++
      setChallenge(null)
      void queryClient.cancelQueries()
      queryClient.clear()
    }
    queryClient.setQueryData(sessionQueryKey, session)
  }), [queryClient])
  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async ({ signal }) => {
      const result = await authService.bootstrap()
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      return result
    },
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const loginMutation = useMutation({
    mutationFn: ({ input }: { input: LoginInput; generation: number }) => authService.login(input),
    onSuccess: (result, variables) => {
      if (variables.generation === generation.current) setChallenge(result)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ input }: { input: VerifyLoginInput; generation: number }) => authService.verifyLogin(input),
    onSuccess: (session, variables) => {
      if (variables.generation !== generation.current) return
      queryClient.setQueryData(sessionQueryKey, session)
      setChallenge(null)
    },
  })

  const logoutMutation = useMutation({
    onMutate: clearLocal,
    mutationFn: () => authService.logout(),
    onSuccess: () => setLogoutWarning(null),
    onError: () => setLogoutWarning('La sesión se cerró en este dispositivo, pero no pudimos confirmar la revocación remota. Revisá tu conexión y cerrá la sesión nuevamente antes de dejar un dispositivo compartido.'),
  })

  const session = sessionQuery.data ?? null
  useEffect(() => {
    if (!session) return
    const timer = setTimeout(() => {
      void authService.refresh().catch(() => undefined)
    }, authService.refreshDelay(session))
    return () => clearTimeout(timer)
  }, [session])

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
    login: async (input) => loginMutation.mutateAsync({ input, generation: generation.current }),
    verify: async (code) => {
      if (!challenge) throw new Error('No hay un desafío de acceso activo.')
      return verifyMutation.mutateAsync({ input: { challengeId: challenge.challengeId, code }, generation: generation.current })
    },
    cancelChallenge: () => setChallenge(null),
    logout: async () => logoutMutation.mutateAsync(),
    logoutWarning,
    isSubmitting: loginMutation.isPending || verifyMutation.isPending || logoutMutation.isPending,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}
