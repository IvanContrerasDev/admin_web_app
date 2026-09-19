import { z } from 'zod'
import type { Pagination } from '../types/api'
import {
  documentDownloadSchema,
  documentListItemSchema,
  type CreateDocumentInput,
  type DocumentDetail,
  type DocumentDownload,
  type DocumentListItem,
  type DocumentListQuery,
  type UpdateDocumentInput,
} from '../types/documents'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class DocumentsService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  list(query: DocumentListQuery, signal?: AbortSignal): Promise<{ data: DocumentListItem[]; pagination: Pagination }> {
    return this.client.requestPage(
      {
        path: '/documents',
        query: {
          search: query.search,
          employeeId: query.employeeId,
          type: query.type,
          uploadedBy: query.uploadedBy,
          uploadedFrom: query.uploadedFrom,
          uploadedTo: query.uploadedTo,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 25,
        },
        signal,
      },
      documentListItemSchema,
    )
  }

  get(id: string, signal?: AbortSignal): Promise<DocumentDetail> {
    return this.client.request({ path: `/documents/${id}`, signal }, documentListItemSchema)
  }

  create(input: CreateDocumentInput): Promise<{ created: DocumentListItem[] }> {
    return this.client.request(
      { method: 'POST', path: '/documents', body: input },
      z.object({ created: z.array(documentListItemSchema).min(1) }),
    )
  }

  update(id: string, input: UpdateDocumentInput): Promise<DocumentDetail> {
    return this.client.request({ method: 'PATCH', path: `/documents/${id}`, body: input }, documentListItemSchema)
  }

  remove(id: string): Promise<void> {
    return this.client.requestVoid({ method: 'DELETE', path: `/documents/${id}` })
  }

  getDownload(id: string, signal?: AbortSignal): Promise<DocumentDownload> {
    return this.client.request({ path: `/documents/${id}/download`, signal }, documentDownloadSchema)
  }
}
