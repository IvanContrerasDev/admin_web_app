import type { Pagination } from '../types/api'
import {
  clientListItemSchema,
  siteReferenceSchema,
  workplaceListItemSchema,
  type ClientDetail,
  type ClientListItem,
  type ClientListQuery,
  type CreateClientInput,
  type CreateWorkplaceInput,
  type EntityStatus,
  type SiteReference,
  type UpdateClientInput,
  type UpdateWorkplaceInput,
  type WorkplaceDetail,
  type WorkplaceListItem,
  type WorkplaceListQuery,
} from '../types/organization'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class OrganizationService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  listClients(query: ClientListQuery, signal?: AbortSignal): Promise<{ data: ClientListItem[]; pagination: Pagination }> {
    return this.client.requestPage({ path: '/clients', query: { search: query.search, status: query.status, page: query.page ?? 1, pageSize: query.pageSize ?? 25 }, signal }, clientListItemSchema)
  }

  getClient(id: string, signal?: AbortSignal): Promise<ClientDetail> {
    return this.client.request({ path: `/clients/${id}`, signal }, clientListItemSchema)
  }

  createClient(input: CreateClientInput): Promise<ClientDetail> {
    return this.client.request({ method: 'POST', path: '/clients', body: input }, clientListItemSchema)
  }

  updateClient(id: string, input: UpdateClientInput): Promise<ClientDetail> {
    return this.client.request({ method: 'PUT', path: `/clients/${id}`, body: input }, clientListItemSchema)
  }

  setClientStatus(id: string, status: EntityStatus): Promise<ClientDetail> {
    return this.client.request({ method: 'PATCH', path: `/clients/${id}/status`, body: { status } }, clientListItemSchema)
  }

  listSites(signal?: AbortSignal): Promise<SiteReference[]> {
    return this.client.request({ path: '/sites', signal }, siteReferenceSchema.array())
  }

  listWorkplaces(query: WorkplaceListQuery, signal?: AbortSignal): Promise<{ data: WorkplaceListItem[]; pagination: Pagination }> {
    return this.client.requestPage({ path: '/workplaces', query: { search: query.search, clientId: query.clientId, siteId: query.siteId, status: query.status, page: query.page ?? 1, pageSize: query.pageSize ?? 25 }, signal }, workplaceListItemSchema)
  }

  getWorkplace(id: string, signal?: AbortSignal): Promise<WorkplaceDetail> {
    return this.client.request({ path: `/workplaces/${id}`, signal }, workplaceListItemSchema)
  }

  createWorkplace(input: CreateWorkplaceInput): Promise<WorkplaceDetail> {
    return this.client.request({ method: 'POST', path: '/workplaces', body: input }, workplaceListItemSchema)
  }

  updateWorkplace(id: string, input: UpdateWorkplaceInput): Promise<WorkplaceDetail> {
    return this.client.request({ method: 'PUT', path: `/workplaces/${id}`, body: input }, workplaceListItemSchema)
  }

  setWorkplaceStatus(id: string, status: EntityStatus): Promise<WorkplaceDetail> {
    return this.client.request({ method: 'PATCH', path: `/workplaces/${id}/status`, body: { status } }, workplaceListItemSchema)
  }
}
