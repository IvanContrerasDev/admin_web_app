import { describe, expect, it } from 'vitest'
import { hasManualIntervalOverlap } from '../lib/record-interval-validation'
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
    const response = await setup().listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID, reviewStatus: 'PENDING' })

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

  it('approves a record without changing its origin, data, or intervals', async () => {
    const service = setup()
    const monthly = await service.listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID, reviewStatus: 'PENDING' })
    const presentDay = monthly.data[0]!.days.find((day) => day.state === 'PRESENT' && day.matchesFilters)
    if (!presentDay || presentDay.state !== 'PRESENT') return
    const detail = await service.getDetail(presentDay.record.id)
    const intervalsBefore = structuredClone(detail.intervals)

    const approved = await service.approve(detail.id, {
      expectedVersion: detail.version,
      reviewStatus: 'APPROVED',
    })

    expect(approved).toMatchObject({
      id: detail.id,
      reviewStatus: 'APPROVED',
      origin: detail.origin,
      observations: detail.observations,
      totalWorkMinutes: detail.totalWorkMinutes,
      version: detail.version + 1,
    })
    expect(approved.intervals).toEqual(intervalsBefore)
    await expect(service.approve(detail.id, {
      expectedVersion: detail.version,
      reviewStatus: 'APPROVED',
    })).rejects.toMatchObject({ code: 'RECORD_VERSION_CONFLICT', status: 409 })
  })

  it('deletes an interval during correction but preserves at least one', async () => {
    const service = setup()
    const created = await service.create({
      userId: '22000000-0000-4000-8000-000000000001',
      workplaceId: '44000000-0000-4000-8000-000000000001',
      date: '2026-09-04',
      observations: null,
      intervals: [
        { type: 'WORK', startTime: '2026-09-04T12:00:00.000Z', endTime: '2026-09-04T16:00:00.000Z', absenceReason: null, observations: null },
        { type: 'WORK', startTime: '2026-09-04T17:00:00.000Z', endTime: '2026-09-04T21:00:00.000Z', absenceReason: null, observations: null },
      ],
    })

    const corrected = await service.update(created.id, {
      expectedVersion: created.version,
      intervalChanges: [{ operation: 'DELETE', id: created.intervals[0]!.id }],
    })

    expect(corrected.intervals).toHaveLength(1)
    expect(corrected.totalWorkMinutes).toBe(240)
    expect(corrected.version).toBe(created.version + 1)
    await expect(service.update(corrected.id, {
      expectedVersion: corrected.version,
      intervalChanges: [{ operation: 'DELETE', id: corrected.intervals[0]!.id }],
    })).rejects.toMatchObject({ code: 'RECORD_INTERVALS_REQUIRED', status: 422 })
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

  it('preserves historical overlaps but rejects new or changed bounds overlapping any retained interval', () => {
    const historical = [
      { startTime: '2026-09-03T12:00:00.000Z', endTime: '2026-09-03T21:00:00.000Z', changed: false },
      { startTime: '2026-09-03T13:00:00.000Z', endTime: '2026-09-03T14:00:00.000Z', changed: false },
    ]
    expect(hasManualIntervalOverlap(historical)).toBe(false)
    expect(hasManualIntervalOverlap([...historical, { startTime: null, endTime: null, changed: true }])).toBe(false)
    expect(hasManualIntervalOverlap([...historical, { startTime: '2026-09-03T15:00:00.000Z', endTime: '2026-09-03T16:00:00.000Z', changed: true }])).toBe(true)
    expect(hasManualIntervalOverlap(historical.map((interval, index) => ({ ...interval, changed: index === 1 })))).toBe(true)
    expect(hasManualIntervalOverlap([...historical, { startTime: '2026-09-03T21:00:00.000Z', endTime: '2026-09-03T22:00:00.000Z', changed: true }])).toBe(false)
  })

  it('rejects a newly added manual interval overlapping an unchanged existing interval', async () => {
    const service = setup()
    const created = await service.create({
      userId: '22000000-0000-4000-8000-000000000001', workplaceId: '44000000-0000-4000-8000-000000000001', date: '2026-09-04', observations: null,
      intervals: [{ type: 'WORK', startTime: '2026-09-04T12:00:00.000Z', endTime: '2026-09-04T16:00:00.000Z', absenceReason: null, observations: null }],
    })
    await expect(service.update(created.id, { expectedVersion: created.version, intervalChanges: [{ operation: 'ADD', interval: { type: 'WORK', startTime: '2026-09-04T15:00:00.000Z', endTime: '2026-09-04T17:00:00.000Z', absenceReason: null, observations: null } }] })).rejects.toMatchObject({ code: 'RECORD_INTERVALS_OVERLAP', status: 422 })
    expect(await service.getDetail(created.id)).toEqual(created)
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
  it('expires snapshots after 15 minutes without extending the TTL on later pages', async () => {
    let clock = new Date('2026-09-18T12:00:00.000Z')
    const adapter = new MockServiceAdapter()
    registerRecordsMockRoutes(adapter, () => clock)
    const service = new RecordsService(adapter)
    const filters = { year: 2026, month: 9, siteId: SAN_JUAN_ID, pageSize: 5 }
    const first = await service.listMonthly(filters)
    clock = new Date('2026-09-18T12:14:59.000Z')
    const second = await service.listMonthly({ ...filters, page: 2, snapshotToken: first.meta.snapshotToken })
    expect(second.meta.snapshotExpiresAt).toBe(first.meta.snapshotExpiresAt)
    await expect(service.listMonthly({ ...filters, page: 2, reviewStatus: 'APPROVED', snapshotToken: first.meta.snapshotToken })).rejects.toMatchObject({ code: 'MONTHLY_SNAPSHOT_MISMATCH', retryable: false })
    clock = new Date('2026-09-18T12:15:00.000Z')
    await expect(service.listMonthly({ ...filters, page: 2, snapshotToken: first.meta.snapshotToken })).rejects.toMatchObject({ code: 'MONTHLY_SNAPSHOT_EXPIRED', status: 410, retryable: false })
    const restarted = await service.listMonthly(filters)
    expect(restarted.pagination.page).toBe(1)
    expect(restarted.meta.snapshotToken).not.toBe(first.meta.snapshotToken)
  })

  it('freezes a snapshot while new queries reflect corrections and recalculate day matches', async () => {
    const service = setup()
    const filters = { year: 2026, month: 9, siteId: SAN_JUAN_ID, reviewStatus: 'PENDING' as const }
    const first = await service.listMonthly(filters)
    const day = first.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.matchesFilters)
    expect(day?.state).toBe('PRESENT')
    if (!day || day.state !== 'PRESENT') throw new Error('Missing fixture')
    const detail = await service.getDetail(day.record.id)
    await service.approve(detail.id, { expectedVersion: detail.version, reviewStatus: 'APPROVED' })
    const frozen = await service.listMonthly({ ...filters, snapshotToken: first.meta.snapshotToken })
    expect(frozen.data).toEqual(first.data)
    const fresh = await service.listMonthly(filters)
    const refreshedDay = fresh.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.record.id === detail.id)
    if (refreshedDay) expect(refreshedDay).toMatchObject({ matchesFilters: false, record: { reviewStatus: 'APPROVED' } })
  })

  it('injects runtime records before day-level row filtering', async () => {
    const service = setup()
    const filters = { year: 2026, month: 9, employeeId: '22000000-0000-4000-8000-000000000001', workplaceId: '44000000-0000-4000-8000-000000000001', reviewStatus: 'MANUAL_LOADED' as const }
    const created = await service.create({
      userId: filters.employeeId, workplaceId: filters.workplaceId, date: '2026-09-04', observations: null,
      intervals: [{ type: 'WORK', startTime: '2026-09-04T12:00:00.000Z', endTime: '2026-09-04T13:31:00.000Z', absenceReason: null, observations: null }],
    })
    const response = await service.listMonthly(filters)
    expect(response.data).toHaveLength(1)
    const day = response.data[0]!.days[3]
    expect(day).toMatchObject({ state: 'PRESENT', matchesFilters: true, record: { id: created.id, totalWorkMinutes: 91 } })
    expect(response.meta.totals.matchingWorkMinutes).toBe(response.data[0]!.totals.matchingWorkMinutes)
  })

  it('allows ADD and DELETE without rewriting an untouched historical open WORK interval', async () => {
    const service = setup()
    const monthly = await service.listMonthly({ year: 2026, month: 9, siteId: SAN_JUAN_ID, status: 'INCOMPLETE' })
    const day = monthly.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.record.recordStatus === 'INCOMPLETE' && !item.record.hasAbsence)
    if (!day || day.state !== 'PRESENT') throw new Error('Missing incomplete fixture')
    const detail = await service.getDetail(day.record.id)
    const open = detail.intervals.find((interval) => interval.type === 'WORK' && interval.status === 'OPEN')!
    expect(open).toBeDefined()
    const added = await service.update(detail.id, { expectedVersion: detail.version, intervalChanges: [{ operation: 'ADD', interval: { type: 'ABSENCE', startTime: null, endTime: null, absenceReason: 'LEAVE', observations: null } }] })
    expect(added.intervals.find((interval) => interval.id === open.id)).toEqual(open)
    const newInterval = added.intervals.find((interval) => !detail.intervals.some((existing) => existing.id === interval.id))!
    const removed = await service.update(detail.id, { expectedVersion: added.version, intervalChanges: [{ operation: 'DELETE', id: newInterval.id }] })
    expect(removed.intervals.find((interval) => interval.id === open.id)).toEqual(open)
    await expect(service.update(detail.id, { expectedVersion: removed.version, intervalChanges: [{ operation: 'UPDATE', id: open.id, interval: { type: 'WORK', startTime: open.startTime, endTime: null, absenceReason: null, observations: null } }] })).rejects.toMatchObject({ code: 'WORK_INTERVAL_REQUIRES_BOUNDS' })
  })
})
