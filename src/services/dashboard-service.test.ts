import { describe, expect, it } from 'vitest'
import { registerDashboardMockRoutes } from '../mocks/dashboard-handlers'
import { createTimesheetsStore, registerTimesheetsMockRoutes } from '../mocks/timesheets-handlers'
import { DashboardService } from './dashboard-service'
import { MockServiceAdapter } from './mock-service-adapter'
import { TimesheetsService } from './timesheets-service'

const NOW = () => new Date('2026-09-19T12:00:00.000Z')

function setup() {
  const adapter = new MockServiceAdapter()
  const timesheetsStore = createTimesheetsStore()
  registerTimesheetsMockRoutes(adapter, NOW, timesheetsStore)
  registerDashboardMockRoutes(adapter, timesheetsStore)
  return { dashboard: new DashboardService(adapter), timesheets: new TimesheetsService(adapter) }
}

describe('DashboardService', () => {
  it('returns the four counters for the selected month', async () => {
    const { dashboard } = setup()
    const metrics = await dashboard.getMetrics({ month: 9, year: 2026 })

    expect(metrics.pendingTimesheets).toBe(4)
    expect(metrics.incompleteRecords).toBeGreaterThan(0)
    expect(metrics.pendingReviewRecords).toBeGreaterThan(0)
    expect(metrics.recordsWithAbsence).toBeGreaterThan(0)
  })

  it('scopes counters to the selected month', async () => {
    const { dashboard } = setup()
    const september = await dashboard.getMetrics({ month: 9, year: 2026 })
    const july = await dashboard.getMetrics({ month: 7, year: 2026 })

    expect(july.pendingTimesheets).toBe(0)
    expect(july.pendingTimesheets).not.toBe(september.pendingTimesheets)
  })

  it('reflects timesheet status changes in pendingTimesheets', async () => {
    const { dashboard, timesheets } = setup()
    const before = await dashboard.getMetrics({ month: 9, year: 2026 })

    await timesheets.setStatus('66000000-0000-4000-8000-000000000002', 'LOADED')
    const after = await dashboard.getMetrics({ month: 9, year: 2026 })

    expect(after.pendingTimesheets).toBe(before.pendingTimesheets - 1)
  })

  it('rejects an invalid month', async () => {
    const { dashboard } = setup()
    await expect(dashboard.getMetrics({ month: 13, year: 2026 })).rejects.toMatchObject({ code: 'INVALID_MONTH', status: 400 })
  })
})
