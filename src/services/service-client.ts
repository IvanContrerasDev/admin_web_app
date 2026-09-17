import { z } from 'zod'
import type { Pagination } from '../types/api'
import type { ServiceAdapter, ServiceRequest } from './service-adapter'
import { ServiceError } from './service-error'

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export class ServiceClient {
  constructor(private readonly adapter: ServiceAdapter) {}

  async request<T>(request: ServiceRequest, dataSchema: z.ZodType<T>): Promise<T> {
    const envelopeSchema = z.object({ data: dataSchema })
    const result = envelopeSchema.safeParse(await this.adapter.request(request))

    if (!result.success) {
      throw new ServiceError({
        code: 'INVALID_API_RESPONSE',
        message: 'La respuesta del servidor no cumple el contrato esperado.',
        retryable: false,
        kind: 'contract',
        cause: result.error,
      })
    }

    return result.data.data
  }

  async requestPage<T>(
    request: ServiceRequest,
    itemSchema: z.ZodType<T>,
  ): Promise<{ data: T[]; pagination: Pagination }> {
    const envelopeSchema = z.object({
      data: z.array(itemSchema),
      pagination: paginationSchema,
    })
    const result = envelopeSchema.safeParse(await this.adapter.request(request))

    if (!result.success) {
      throw new ServiceError({
        code: 'INVALID_API_RESPONSE',
        message: 'La respuesta paginada no cumple el contrato esperado.',
        retryable: false,
        kind: 'contract',
        cause: result.error,
      })
    }

    return result.data
  }
}
