import { z } from 'zod'
import type { Pagination } from '../types/api'
import {
  timesheetDownloadSchema,
  timesheetListItemSchema,
  type CreateTimesheetInput,
  type ReplaceTimesheetFileInput,
  type TimesheetDetail,
  type TimesheetDownload,
  type TimesheetListItem,
  type TimesheetListQuery,
  type TimesheetStatus,
} from '../types/timesheets'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class TimesheetsService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  list(query: TimesheetListQuery, signal?: AbortSignal): Promise<{ data: TimesheetListItem[]; pagination: Pagination }> {
    return this.client.requestPage(
      {
        path: '/timesheets',
        query: {
          search: query.search,
          employeeId: query.employeeId,
          clientId: query.clientId,
          workplaceId: query.workplaceId,
          siteId: query.siteId,
          month: query.month,
          year: query.year,
          status: query.status,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 25,
        },
        signal,
      },
      timesheetListItemSchema,
    )
  }

  get(id: string, signal?: AbortSignal): Promise<TimesheetDetail> {
    return this.client.request({ path: `/timesheets/${id}`, signal }, timesheetListItemSchema)
  }

  create(input: CreateTimesheetInput): Promise<{ created: TimesheetListItem[] }> {
    return this.client.request(
      { method: 'POST', path: '/timesheets', body: input },
      z.object({ created: z.array(timesheetListItemSchema).min(1) }),
    )
  }

  setStatus(id: string, status: TimesheetStatus): Promise<TimesheetDetail> {
    return this.client.request(
      { method: 'PATCH', path: `/timesheets/${id}/status`, body: { status } },
      timesheetListItemSchema,
    )
  }

  replaceFile(id: string, input: ReplaceTimesheetFileInput): Promise<TimesheetDetail> {
    return this.client.request(
      { method: 'PUT', path: `/timesheets/${id}/file`, body: input },
      timesheetListItemSchema,
    )
  }

  getDownload(id: string, signal?: AbortSignal): Promise<TimesheetDownload> {
    return this.client.request({ path: `/timesheets/${id}/download`, signal }, timesheetDownloadSchema)
  }
}
