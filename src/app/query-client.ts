import { QueryClient } from '@tanstack/react-query'
import { ServiceError } from '../services/service-error'

function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false
  return error instanceof ServiceError ? error.retryable : false
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
