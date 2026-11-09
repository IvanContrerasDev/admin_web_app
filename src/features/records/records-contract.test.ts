import { describe, expect, it } from 'vitest'
import { attendanceEventDetailSchema, recordIntervalSchema, reviewStatusSchema } from '../../types/records'

const id = '11000000-0000-4000-8000-000000000001'
const interval = { id, type: 'WORK', status: 'CLOSED', startTime: null, endTime: null, absenceReason: null, observations: null, origin: 'MANUAL', attendanceEvents: [] }

describe('attendance DTO contracts', () => {
  it('allows manual loading only on the record review status', () => {
    expect(reviewStatusSchema.safeParse('MANUAL_LOADED').success).toBe(true)
    expect(recordIntervalSchema.safeParse({ ...interval, reviewStatus: 'MANUAL_LOADED' }).success).toBe(false)
    for (const reviewStatus of ['NONE', 'PENDING', 'APPROVED']) expect(recordIntervalSchema.safeParse({ ...interval, reviewStatus }).success).toBe(true)
  })
  it('accepts a detached event and scalar metadata, rejecting nested metadata', () => {
    const event = { id, recordId: id, intervalId: null, type: 'CHECK_IN', occurredAt: '2026-09-01T12:00:00.000Z', receivedAt: '2026-09-01T12:00:01.000Z', origin: 'MOBILE', observation: null, location: null, metadata: { clientSentAt: null, offline: false, accuracy: 1, deviceInfoJson: '{"a":{}}' } }
    expect(attendanceEventDetailSchema.safeParse(event).success).toBe(true)
    expect(attendanceEventDetailSchema.safeParse({ ...event, metadata: { nested: {} } }).success).toBe(false)
  })
})
