export interface ApiEnvelope<T> {
  data: T
}

export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  pagination: Pagination
}

export interface ApiErrorBody {
  code: string
  message: string
  retryable: boolean
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody
}
