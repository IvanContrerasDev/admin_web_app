import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import { ServiceError } from '../services/service-error'
import { computeMonthlyRecordMetrics } from './records-handlers'
import type { TimesheetsStore } from './timesheets-handlers'

function apiError(code: string, message: string, status = 400): ServiceError {
  return new ServiceError({ code, message, retryable: false, kind: 'api', status })
}

function parseInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

export function registerDashboardMockRoutes(
  adapter: MockServiceAdapter,
  timesheetsStore: TimesheetsStore,
) {
  adapter.register('GET', '/dashboard/metrics', (request: ServiceRequest) => {
    const year = parseInteger(request.query?.year, 0)
    const month = parseInteger(request.query?.month, 0)
    if (year < 2000 || month < 1 || month > 12) throw apiError('INVALID_MONTH', 'Seleccioná un mes válido.', 400)

    const pendingTimesheets = timesheetsStore.items.filter(
      (timesheet) => timesheet.year === year && timesheet.month === month && timesheet.status === 'PENDING',
    ).length

    return { data: { pendingTimesheets, ...computeMonthlyRecordMetrics(year, month) } }
  })
}
