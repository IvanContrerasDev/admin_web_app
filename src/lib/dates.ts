export const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires'
export const APP_LOCALE = 'es-AR'

export interface ArgentinaCalendarDate {
  day: number
  month: number
  year: number
}

export function parseInstant(value: Date | string) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('La fecha recibida no es válida.')
  }
  return date
}

export function toUtcIso(value: Date | string) {
  return parseInstant(value).toISOString()
}

export function formatArgentinaDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' },
) {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    ...options,
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(parseInstant(value))
}

export function getArgentinaCivilDate(value: Date | string = new Date()): string {
  const { year, month, day } = getArgentinaCalendarDate(value)
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isValidCivilDate(value: unknown, today: string): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(`${value}T00:00:00Z`)
  return year! > 0 && date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day
}

export function getArgentinaCalendarDate(value: Date | string): ArgentinaCalendarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: ARGENTINA_TIME_ZONE,
  }).formatToParts(parseInstant(value))
  const values = new Map(parts.map((part) => [part.type, part.value]))

  return {
    day: Number(values.get('day')),
    month: Number(values.get('month')),
    year: Number(values.get('year')),
  }
}
