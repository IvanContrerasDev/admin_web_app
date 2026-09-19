import {
  attendanceEventDetailSchema,
  monthlyResponseSchema,
  recordDetailSchema,
  type AttendanceEventDetail,
  type MonthlyQuery,
  type MonthlyResponse,
  type RecordDetail,
} from '../types/records'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class RecordsService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  getDetail(recordId: string, signal?: AbortSignal): Promise<RecordDetail> {
    return this.client.request(
      { path: `/records/${recordId}`, signal },
      recordDetailSchema,
    )
  }

  getAttendanceEventDetail(eventId: string, signal?: AbortSignal): Promise<AttendanceEventDetail> {
    return this.client.request(
      { path: `/attendance-events/${eventId}`, signal },
      attendanceEventDetailSchema,
    )
  }

  listMonthly(query: MonthlyQuery, signal?: AbortSignal): Promise<MonthlyResponse> {
    return this.client.requestResponse(
      {
        path: '/records/monthly',
        query: {
          month: query.month,
          year: query.year,
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          siteId: query.siteId,
          employeeId: query.employeeId,
          workplaceId: query.workplaceId,
          clientId: query.clientId,
          status: query.status,
          reviewStatus: query.reviewStatus,
          origin: query.origin,
          hasAbsence: query.hasAbsence,
          snapshotToken: query.snapshotToken,
        },
        signal,
      },
      monthlyResponseSchema,
      'La matriz mensual no cumple el contrato esperado.',
    )
  }
}
