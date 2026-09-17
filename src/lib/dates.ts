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
