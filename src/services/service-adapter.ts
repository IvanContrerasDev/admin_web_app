export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export type QueryValue = boolean | number | string | null | undefined

export interface ServiceRequest {
  method?: HttpMethod
  path: `/${string}`
  query?: Readonly<Record<string, QueryValue>>
  body?: unknown
  headers?: Readonly<Record<string, string>>
  signal?: AbortSignal
}

export interface ServiceAdapter {
  request(request: ServiceRequest): Promise<unknown>
}

export function requestKey(request: Pick<ServiceRequest, 'method' | 'path'>) {
  return `${request.method ?? 'GET'} ${request.path}`
}
