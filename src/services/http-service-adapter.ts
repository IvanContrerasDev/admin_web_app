import { z } from 'zod'
import { ServiceError } from './service-error'
import type { QueryValue, ServiceAdapter, ServiceRequest } from './service-adapter'

const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    retryable: z.boolean(),
  }),
})

function appendQuery(url: URL, query: Readonly<Record<string, QueryValue>> | undefined) {
  if (!query) return

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }
}

async function parseJson(response: Response) {
  try {
    return await response.json()
  } catch (cause) {
    throw new ServiceError({
      code: 'INVALID_JSON_RESPONSE',
      message: 'El servidor devolvió una respuesta inválida.',
      retryable: false,
      kind: 'contract',
      status: response.status,
      cause,
    })
  }
}

export class HttpServiceAdapter implements ServiceAdapter {
  private readonly baseUrl: URL

  constructor(baseUrl: string, private readonly fetcher: typeof fetch = fetch) {
    try {
      this.baseUrl = new URL(baseUrl)
    } catch (cause) {
      throw new ServiceError({
        code: 'INVALID_API_BASE_URL',
        message: 'La URL base de la API no es válida.',
        retryable: false,
        kind: 'configuration',
        cause,
      })
    }
  }

  async request(request: ServiceRequest) {
    const url = new URL(request.path, this.baseUrl)
    appendQuery(url, request.query)

    let response: Response
    try {
      response = await this.fetcher(url, {
        method: request.method ?? 'GET',
        credentials: 'include',
        headers: request.body === undefined
          ? request.headers
          : { 'Content-Type': 'application/json', ...request.headers },
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: request.signal,
      })
    } catch (cause) {
      if (request.signal?.aborted) throw cause

      throw new ServiceError({
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.',
        retryable: true,
        kind: 'network',
        cause,
      })
    }

    const payload = await parseJson(response)

    if (!response.ok) {
      const parsedError = errorEnvelopeSchema.safeParse(payload)
      if (parsedError.success) {
        throw ServiceError.fromApi(parsedError.data.error, response.status)
      }

      throw new ServiceError({
        code: 'HTTP_ERROR',
        message: 'El servidor no pudo completar la operación.',
        retryable: response.status >= 500,
        kind: 'http',
        status: response.status,
      })
    }

    return payload
  }
}
