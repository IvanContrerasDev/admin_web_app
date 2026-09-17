import type { ApiErrorBody } from '../types/api'

export type ServiceErrorKind = 'api' | 'configuration' | 'contract' | 'http' | 'network'

interface ServiceErrorOptions {
  code: string
  message: string
  retryable: boolean
  kind: ServiceErrorKind
  status?: number
  cause?: unknown
}

export class ServiceError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly kind: ServiceErrorKind
  readonly status?: number

  constructor({ code, message, retryable, kind, status, cause }: ServiceErrorOptions) {
    super(message, { cause })
    this.name = 'ServiceError'
    this.code = code
    this.retryable = retryable
    this.kind = kind
    this.status = status
  }

  static fromApi(error: ApiErrorBody, status?: number) {
    return new ServiceError({ ...error, kind: 'api', status })
  }
}
