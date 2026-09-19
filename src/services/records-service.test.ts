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

  it('creates a manual record and prevents a duplicate for the same day', async () => {
    const service = setup()
    const input = {
      userId: '22000000-0000-4000-8000-000000000001',
      workplaceId: '44000000-0000-4000-8000-000000000001',
      date: '2026-09-04',
      observations: 'Corrección retrospectiva.',
      intervals: [{ type: 'ABSENCE' as const, startTime: null, endTime: null, absenceReason: 'LEAVE' as const, observations: null }],
    }

    const created = await service.create(input)

    expect(created).toMatchObject({ date: input.date, origin: 'MANUAL', reviewStatus: 'MANUAL_LOADED', totalWorkMinutes: 0, version: 1 })
    await expect(service.create(input)).rejects.toMatchObject({ code: 'RECORD_ALREADY_EXISTS', status: 409 })
  })

  it('updates only declared intervals and detects stale versions', async () => {
    const service = setup()
    const monthly = await service.listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID })
    const presentDay = monthly.data[0]!.days.find((day) => day.state === 'PRESENT' && day.record.intervalCount === 1)
    if (!presentDay || presentDay.state !== 'PRESENT') return
    const detail = await service.getDetail(presentDay.record.id)
    const interval = detail.intervals[0]!

    const updated = await service.update(detail.id, {
      expectedVersion: detail.version,
      observations: 'Horario corregido por administración.',
      intervalChanges: [{
        operation: 'UPDATE',
        id: interval.id,
        interval: { type: 'WORK', startTime: `${detail.date}T12:00:00.000Z`, endTime: `${detail.date}T20:00:00.000Z`, absenceReason: null, observations: null },
      }],
    })

    expect(updated).toMatchObject({ version: detail.version + 1, origin: 'MANUAL', reviewStatus: 'MANUAL_LOADED', totalWorkMinutes: 480 })
    await expect(service.update(detail.id, { expectedVersion: detail.version, observations: null })).rejects.toMatchObject({ code: 'RECORD_VERSION_CONFLICT', status: 409 })
  })

  it('rejects overlapping intervals in manual writes', async () => {
    const service = setup()
    await expect(service.create({
      userId: '22000000-0000-4000-8000-000000000001',
      workplaceId: '44000000-0000-4000-8000-000000000001',
      date: '2026-09-04',
      observations: null,
      intervals: [
        { type: 'WORK', startTime: '2026-09-03T12:00:00.000Z', endTime: '2026-09-03T18:00:00.000Z', absenceReason: null, observations: null },
        { type: 'WORK', startTime: '2026-09-03T17:00:00.000Z', endTime: '2026-09-03T20:00:00.000Z', absenceReason: null, observations: null },
      ],
    })).rejects.toMatchObject({ code: 'RECORD_INTERVALS_OVERLAP', status: 422 })
  })

  it('loads a record detail and then each automatic event on demand', async () => {
    const service = setup()
    const monthly = await service.listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID })
    const presentDay = monthly.data[0]!.days.find((day) => day.state === 'PRESENT')

    expect(presentDay?.state).toBe('PRESENT')
    if (!presentDay || presentDay.state !== 'PRESENT') return

    const detail = await service.getDetail(presentDay.record.id)
    const event = detail.intervals.flatMap((interval) => interval.attendanceEvents)[0]

    expect(detail).toMatchObject({ id: presentDay.record.id, employee: monthly.data[0]!.employee })
    expect(detail.intervals).toHaveLength(presentDay.record.intervalCount)
    expect(event).toBeDefined()
    if (!event) return

    await expect(service.getAttendanceEventDetail(event.id)).resolves.toMatchObject({
      id: event.id,
      recordId: detail.id,
      location: { accuracyMeters: expect.any(Number) },
    })
  })
})
