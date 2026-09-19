import { describe, expect, it } from 'vitest'
import { registerRecordsMockRoutes } from '../mocks/records-handlers'
import { MockServiceAdapter } from './mock-service-adapter'
import { RecordsService } from './records-service'

const SAN_JUAN_ID = '11000000-0000-4000-8000-000000000005'

function setup() {
  const adapter = new MockServiceAdapter()
  registerRecordsMockRoutes(adapter, () => new Date('2026-09-18T12:00:00.000Z'))
  return new RecordsService(adapter)
}

describe('RecordsService', () => {
  it('returns complete monthly rows and official totals', async () => {
    const response = await setup().listMonthly({ year: 2026, month: 1, siteId: SAN_JUAN_ID, pageSize: 5 })

    expect(response.data).toHaveLength(5)
    expect(response.data.every((row) => row.days.length === 31)).toBe(true)
    expect(response.pagination).toMatchObject({ page: 1, pageSize: 5, totalItems: 12, totalPages: 3 })
    expect(response.meta).toMatchObject({ month: 1, year: 2026, timeZone: '-03:00' })
    expect(response.meta.totals.monthWorkMinutes).toBeGreaterThan(response.data[0]!.totals.monthWorkMinutes)
  })

  it('keeps the snapshot token across pages', async () => {
    const service = setup()
    const first = await service.listMonthly({ year: 2026, month: 2, siteId: SAN_JUAN_ID, pageSize: 5 })
    const second = await service.listMonthly({ year: 2026, month: 2, siteId: SAN_JUAN_ID, page: 2, pageSize: 5, snapshotToken: first.meta.snapshotToken })

    expect(second.pagination.page).toBe(2)
    expect(second.meta.snapshotToken).toBe(first.meta.snapshotToken)
    expect(second.data.every((row) => row.days.length === 28)).toBe(true)
  })

  it('requires a matching snapshot for subsequent pages', async () => {
    await expect(setup().listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID, page: 2, pageSize: 5 })).rejects.toMatchObject({ code: 'MONTHLY_SNAPSHOT_MISMATCH', status: 400 })
  })

  it('applies day filters while returning every day in matching rows', async () => {
    const response = await setup().listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID, reviewStatus: 'REJECTED' })

    expect(response.data.length).toBeGreaterThan(0)
    expect(response.data.every((row) => row.days.length === 30)).toBe(true)
    expect(response.data.some((row) => row.days.some((day) => day.state === 'PRESENT' && !day.matchesFilters))).toBe(true)
  })
})
