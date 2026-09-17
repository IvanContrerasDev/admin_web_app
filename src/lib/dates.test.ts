import { describe, expect, it } from 'vitest'
import { formatArgentinaDateTime, getArgentinaCalendarDate, toUtcIso } from './dates'

describe('Argentina date utilities', () => {
  it('keeps transport values in UTC', () => {
    expect(toUtcIso('2026-09-17T12:30:00-03:00')).toBe('2026-09-17T15:30:00.000Z')
  })

  it('derives the logical date in Argentina across UTC midnight', () => {
    expect(getArgentinaCalendarDate('2026-09-18T01:30:00.000Z')).toEqual({
      day: 17,
      month: 9,
      year: 2026,
    })
  })

  it('formats with the Argentina time zone', () => {
    expect(formatArgentinaDateTime('2026-09-17T15:30:00.000Z', {
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })).toContain('12:30')
  })

  it('rejects invalid instants', () => {
    expect(() => toUtcIso('not-a-date')).toThrow(RangeError)
  })
})
