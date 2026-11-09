import { describe, expect, it } from 'vitest'
import { registerDashboardMockRoutes } from '../mocks/dashboard-handlers'
import { ORGANIZATION_SITES } from '../mocks/organization-handlers'
import { registerRecordsMockRoutes } from '../mocks/records-handlers'
import { RecordsService } from './records-service'
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
  registerRecordsMockRoutes(adapter, NOW)
  return { dashboard: new DashboardService(adapter), timesheets: new TimesheetsService(adapter), records: new RecordsService(adapter) }
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

  it('includes every province and reconciles all four totals for each month', async () => {
    const { dashboard } = setup()
    for (const month of [7, 9, 10]) {
      const metrics = await dashboard.getMetrics({ month, year: 2026 })
      expect(metrics.byProvince.map((province) => province.id).sort()).toEqual(ORGANIZATION_SITES.map((site) => site.id).sort())
      for (const key of ['pendingTimesheets', 'incompleteRecords', 'pendingReviewRecords', 'recordsWithAbsence'] as const) {
        expect(metrics.byProvince.reduce((total, province) => total + province[key], 0)).toBe(metrics[key])
      }
      expect(metrics.byProvince.find((province) => province.name === 'Catamarca')).toMatchObject({
        pendingTimesheets: 0, incompleteRecords: 0, pendingReviewRecords: 0, recordsWithAbsence: 0,
      })
    }
  })

  it('groups pending timesheets by their workplace province and reflects status changes', async () => {
    const { dashboard, timesheets } = setup()
    const before = await dashboard.getMetrics({ month: 9, year: 2026 })
    expect(before.byProvince.find((province) => province.name === 'San Juan')?.pendingTimesheets).toBe(2)
    expect(before.byProvince.find((province) => province.name === 'Mendoza')?.pendingTimesheets).toBe(2)
    expect(before.byProvince.find((province) => province.name === 'Salta')?.pendingTimesheets).toBe(0)
    await timesheets.setStatus('66000000-0000-4000-8000-000000000002', 'LOADED')
    const after = await dashboard.getMetrics({ month: 9, year: 2026 })
    expect(after.byProvince.find((province) => province.name === 'San Juan')?.pendingTimesheets).toBe(1)
    expect(after.byProvince.find((province) => province.name === 'Mendoza')?.pendingTimesheets).toBe(2)
  })

  it('matches provincial record counters to the monthly matrix', async () => {
    const { dashboard, records } = setup()
    const metrics = await dashboard.getMetrics({ month: 9, year: 2026 })
    for (const province of metrics.byProvince) {
      const matrix = await records.listMonthly({ month: 9, year: 2026, siteId: province.id, pageSize: 100 })
      const counters = { incompleteRecords: 0, pendingReviewRecords: 0, recordsWithAbsence: 0 }
      for (const row of matrix.data) {
        for (const day of row.days) {
          if (day.state !== 'PRESENT') continue
          if (day.record.recordStatus === 'INCOMPLETE') counters.incompleteRecords += 1
          if (day.record.reviewStatus === 'PENDING') counters.pendingReviewRecords += 1
          if (day.record.hasAbsence) counters.recordsWithAbsence += 1
        }
      }
      expect(province).toMatchObject(counters)
    }
  })

  it('reflects record corrections and approvals in the same period counters', async () => {
    const { dashboard, records } = setup()
    const before = await dashboard.getMetrics({ month: 9, year: 2026 })
    const matrix = await records.listMonthly({ month: 9, year: 2026, reviewStatus: 'PENDING' })
    const day = matrix.data.flatMap((row) => row.days).find((day) => day.state === 'PRESENT' && day.matchesFilters)
    if (!day || day.state !== 'PRESENT') throw new Error('Expected pending fixture')
    const detail = await records.getDetail(day.record.id)
    const approved = await records.approve(detail.id, { expectedVersion: detail.version, reviewStatus: 'APPROVED' })
    const after = await dashboard.getMetrics({ month: 9, year: 2026 })
    expect(after.pendingReviewRecords).toBe(before.pendingReviewRecords - 1)
    expect(after.byProvince.find((province) => province.id === detail.site.id)?.pendingReviewRecords).toBe(before.byProvince.find((province) => province.id === detail.site.id)!.pendingReviewRecords - 1)
    expect(after.incompleteRecords).toBe(before.incompleteRecords)
    const corrected = await records.update(approved.id, { expectedVersion: approved.version, observations: 'Corregido' })
    expect(corrected.reviewStatus).toBe('MANUAL_LOADED')
    expect((await dashboard.getMetrics({ month: 9, year: 2026 })).pendingReviewRecords).toBe(after.pendingReviewRecords)
  })

  it('rejects an invalid month', async () => {
    const { dashboard } = setup()
    await expect(dashboard.getMetrics({ month: 13, year: 2026 })).rejects.toMatchObject({ code: 'INVALID_MONTH', status: 400 })
  })
})
