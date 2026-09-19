import type { Pagination } from '../types/api'
import {
  siteReferenceSchema,
  userDetailSchema,
  userListItemSchema,
  type AccountStatus,
  type CreateUserInput,
  type SiteReference,
  type UpdateUserInput,
  type UserDetail,
  type UserListItem,
  type UserListQuery,
} from '../types/users'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class UserService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  list(query: UserListQuery, signal?: AbortSignal): Promise<{ data: UserListItem[]; pagination: Pagination }> {
    return this.client.requestPage(
      {
        path: '/users',
        query: {
          search: query.search,
          accountStatus: query.accountStatus,
          siteId: query.siteId,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 25,
        },
        signal,
      },
      userListItemSchema,
    )
  }

  get(id: string, signal?: AbortSignal): Promise<UserDetail> {
    return this.client.request({ path: `/users/${id}`, signal }, userDetailSchema)
  }

  create(input: CreateUserInput): Promise<UserDetail> {
    return this.client.request({ method: 'POST', path: '/users', body: input }, userDetailSchema)
  }

  update(id: string, input: UpdateUserInput): Promise<UserDetail> {
    return this.client.request({ method: 'PATCH', path: `/users/${id}`, body: input }, userDetailSchema)
  }

  setAccountStatus(id: string, accountStatus: AccountStatus): Promise<UserDetail> {
    return this.client.request(
      { method: 'PATCH', path: `/users/${id}/account-status`, body: { accountStatus } },
      userDetailSchema,
    )
  }

  listSites(signal?: AbortSignal): Promise<SiteReference[]> {
    return this.client.request({ path: '/sites', signal }, siteReferenceSchema.array())
  }
}
