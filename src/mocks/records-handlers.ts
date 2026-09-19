import { ServiceError } from '../services/service-error'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import type {
  AttendanceEventDetail,
  CreateRecordInput,
  MonthlyDay,
  MonthlyQuery,
  MonthlyRow,
  RecordDetail,
  RecordInterval,
  RecordIntervalInput,
  ReviewRecordInput,
  UpdateRecordInput,
} from '../types/records'
import { ORGANIZATION_SITES } from './organization-handlers'

const clients = [
  { id: '33000000-0000-4000-8000-000000000001', name: 'Andes Logística' },
  { id: '33000000-0000-4000-8000-000000000002', name: 'Cuyo Minería' },
  { id: '33000000-0000-4000-8000-000000000003', name: 'Norte Servicios' },
]

const workplaces = [
  { id: '44000000-0000-4000-8000-000000000001', name: 'Centro de distribución San Juan', client: clients[0]!, site: ORGANIZATION_SITES[4]! },
  { id: '44000000-0000-4000-8000-000000000002', name: 'Planta Mendoza', client: clients[0]!, site: ORGANIZATION_SITES[2]! },
  { id: '44000000-0000-4000-8000-000000000003', name: 'Proyecto Cordillera', client: clients[1]!, site: ORGANIZATION_SITES[4]! },
  { id: '44000000-0000-4000-8000-000000000004', name: 'Base operativa Salta', client: clients[2]!, site: ORGANIZATION_SITES[3]! },
]

const employees = [
  { id: '22000000-0000-4000-8000-000000000001', firstName: 'Lucía', lastName: 'Álvarez', employeeId: 'EMP-018' },
  { id: '22000000-0000-4000-8000-000000000002', firstName: 'Tomás', lastName: 'Benítez', employeeId: 'EMP-024' },
  { id: '22000000-0000-4000-8000-000000000003', firstName: 'Camila', lastName: 'Castro', employeeId: 'EMP-031' },
  { id: '22000000-0000-4000-8000-000000000004', firstName: 'Mateo', lastName: 'Fernández', employeeId: 'EMP-037' },
  { id: '22000000-0000-4000-8000-000000000005', firstName: 'Valentina', lastName: 'Gómez', employeeId: 'EMP-042' },
  { id: '22000000-0000-4000-8000-000000000006', firstName: 'Nicolás', lastName: 'Sosa', employeeId: 'EMP-046' },
]

function apiError(code: string, message: string, status: number) {
  return new ServiceError({ code, message, retryable: false, kind: 'api', status })
}

function parseInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function dateFor(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function recordId(rowIndex: number, day: number) {
  return `550e8400-e29b-41d4-a716-${String((rowIndex + 1) * 100 + day).padStart(12, '0')}`
}

type PresentDay = Extract<MonthlyDay, { state: 'PRESENT' }>

interface RecordContext {
  row: MonthlyRow
  day: PresentDay
}

function intervalId(recordIdentifier: string, index: number) {
  const value = Number(recordIdentifier.slice(-12)) * 10 + index + 1
  return `770e8400-e29b-41d4-a716-${String(value).padStart(12, '0')}`
}

function eventId(recordIdentifier: string, index: number) {
  const value = Number(recordIdentifier.slice(-12)) * 100 + index + 1
  return `660e8400-e29b-41d4-a716-${String(value).padStart(12, '0')}`
}

function timestamp(date: string, utcHour: number, minutes = 0) {
  return `${date}T${String(utcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`
}

function createRecordDetail(context: RecordContext, eventDetails: Map<string, AttendanceEventDetail>): RecordDetail {
  const { day, row } = context
  const summary = day.record
  let eventIndex = 0
  const intervals = Array.from({ length: summary.intervalCount }, (_, index) => {
    const id = intervalId(summary.id, index)
    const isAbsence = summary.hasAbsence
    const startTime = isAbsence ? null : timestamp(day.date, index === 0 ? 12 : 17)
    const missingEnd = summary.recordStatus === 'INCOMPLETE' && index === summary.intervalCount - 1
    const endTime = isAbsence || missingEnd ? null : timestamp(day.date, index === 0 ? 16 : 21)
    const attendanceEvents = summary.origin === 'MANUAL'
      ? []
      : isAbsence
        ? [{ id: eventId(summary.id, eventIndex++), type: 'ABSENCE' as const, occurredAt: timestamp(day.date, 12) }]
        : [
            { id: eventId(summary.id, eventIndex++), type: 'CHECK_IN' as const, occurredAt: startTime! },
            ...(endTime ? [{ id: eventId(summary.id, eventIndex++), type: 'CHECK_OUT' as const, occurredAt: endTime }] : []),
          ]

    for (const event of attendanceEvents) {
      eventDetails.set(event.id, {
        id: event.id,
        recordId: summary.id,
        intervalId: id,
        type: event.type,
        occurredAt: event.occurredAt,
        receivedAt: new Date(new Date(event.occurredAt).getTime() + 28_000).toISOString(),
        origin: 'MOBILE',
        observation: event.type === 'ABSENCE' ? 'Aviso informado desde la aplicación.' : null,
        location: {
          latitude: -31.5375 + index * 0.0003,
          longitude: -68.5364 - index * 0.0002,
          accuracyMeters: 8.4 + index * 3.2,
          capturedAt: event.occurredAt,
        },
        metadata: {
          devicePlatform: 'Android',
          appVersion: '2.8.1',
          offline: false,
          geofenceDistanceMeters: 42 + index * 7,
        },
      })
    }

    return {
      id,
      type: isAbsence ? 'ABSENCE' as const : 'WORK' as const,
      status: isAbsence || endTime ? 'CLOSED' as const : 'OPEN' as const,
      startTime,
      endTime,
      absenceReason: isAbsence && Number(summary.id.slice(-2)) % 2 === 0 ? 'ILLNESS' as const : null,
      observations: isAbsence ? 'Ausencia registrada por el empleado.' : null,
      origin: summary.origin,
      reviewStatus: summary.reviewStatus,
      attendanceEvents,
    }
  })

  return {
    id: summary.id,
    date: day.date,
    employee: row.employee,
    workplace: row.workplace,
    client: row.client,
    site: row.site,
    totalWorkMinutes: summary.totalWorkMinutes,
    recordStatus: summary.recordStatus,
    reviewStatus: summary.reviewStatus,
    origin: summary.origin,
    hasAbsence: summary.hasAbsence,
    observations: null,
    version: 1 + Number(summary.id.slice(-2)) % 4,
    intervals,
    createdAt: timestamp(day.date, 11, 55),
    updatedAt: timestamp(day.date, 21, 5),
  }
}

function intervalStatus(interval: Pick<RecordIntervalInput, 'startTime' | 'endTime'>) {
  if (interval.startTime && interval.endTime) return 'CLOSED' as const
  if (interval.startTime) return 'OPEN' as const
  if (interval.endTime) return 'SEMI_CLOSED' as const
  return 'CLOSED' as const
}

function validateManualIntervals(intervals: RecordIntervalInput[]) {
  if (intervals.length === 0) throw apiError('RECORD_INTERVALS_REQUIRED', 'Agregá al menos un intervalo.', 422)

  for (const interval of intervals) {
    if (interval.type === 'WORK' && (!interval.startTime || !interval.endTime)) {
      throw apiError('WORK_INTERVAL_REQUIRES_BOUNDS', 'Los intervalos de trabajo manuales requieren entrada y salida.', 422)
    }
    if (interval.startTime && interval.endTime && new Date(interval.endTime).getTime() <= new Date(interval.startTime).getTime()) {
      throw apiError('INVALID_INTERVAL_RANGE', 'La salida debe ser posterior a la entrada.', 422)
    }
  }

  const bounded = intervals
    .filter((interval) => interval.startTime && interval.endTime)
    .map((interval) => ({ start: new Date(interval.startTime!).getTime(), end: new Date(interval.endTime!).getTime() }))
    .sort((left, right) => left.start - right.start)

  if (bounded.some((interval, index) => index > 0 && interval.start < bounded[index - 1]!.end)) {
    throw apiError('RECORD_INTERVALS_OVERLAP', 'Los intervalos manuales no pueden superponerse.', 422)
  }
}

function toManualInterval(id: string, input: RecordIntervalInput, previous?: RecordInterval): RecordInterval {
  return {
    id,
    ...input,
    status: intervalStatus(input),
    origin: 'MANUAL',
    reviewStatus: 'MANUAL_LOADED',
    attendanceEvents: previous?.attendanceEvents ?? [],
  }
}

function recalculateRecord(detail: RecordDetail): RecordDetail {
  const totalWorkMinutes = detail.intervals.reduce((total, interval) => {
    if (interval.type !== 'WORK' || interval.status !== 'CLOSED' || !interval.startTime || !interval.endTime) return total
    return total + Math.max(0, Math.round((new Date(interval.endTime).getTime() - new Date(interval.startTime).getTime()) / 60_000))
  }, 0)
  return {
    ...detail,
    totalWorkMinutes,
    recordStatus: detail.intervals.every((interval) => interval.status === 'CLOSED') ? 'COMPLETE' : 'INCOMPLETE',
    hasAbsence: detail.intervals.some((interval) => interval.type === 'ABSENCE'),
  }
}

function detailSummary(detail: RecordDetail) {
  return {
    id: detail.id,
    totalWorkMinutes: detail.totalWorkMinutes,
    recordStatus: detail.recordStatus,
    reviewStatus: detail.reviewStatus,
    origin: detail.origin,
    hasAbsence: detail.hasAbsence,
    intervalCount: detail.intervals.length,
  }
}

function createDays(rowIndex: number, year: number, month: number): MonthlyDay[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1
    const date = dateFor(year, month, day)
    if ((day + rowIndex) % 4 === 0) return { date, state: 'EMPTY' as const }

    const hasAbsence = (day + rowIndex) % 13 === 0
    const recordStatus = (day + rowIndex) % 9 === 0 ? 'INCOMPLETE' as const : 'COMPLETE' as const
    const reviewStatus = (day + rowIndex) % 7 === 0
      ? 'PENDING' as const
      : (day + rowIndex) % 5 === 0
        ? 'APPROVED' as const
        : 'NONE' as const
    const totalWorkMinutes = hasAbsence || recordStatus === 'INCOMPLETE' ? 0 : 420 + ((day + rowIndex) % 3) * 30

    return {
      date,
      state: 'PRESENT' as const,
      matchesFilters: true,
      record: {
        id: recordId(rowIndex, day),
        totalWorkMinutes,
        recordStatus,
        reviewStatus,
        origin: (day + rowIndex) % 8 === 0 ? 'MANUAL' as const : 'AUTOMATIC' as const,
        hasAbsence,
        intervalCount: hasAbsence ? 1 : 1 + ((day + rowIndex) % 2),
      },
    }
  })
}

function dayMatches(day: MonthlyDay, query: MonthlyQuery) {
  if (day.state === 'EMPTY') return false
  const record = day.record
  return (!query.status || record.recordStatus === query.status)
    && (!query.reviewStatus || record.reviewStatus === query.reviewStatus)
    && (!query.origin || record.origin === query.origin)
    && (!query.hasAbsence || record.hasAbsence)
}

function hasDayFilters(query: MonthlyQuery) {
  return Boolean(query.status || query.reviewStatus || query.origin || query.hasAbsence)
}

function createRows(year: number, month: number, query: MonthlyQuery): MonthlyRow[] {
  const rows = employees.flatMap((employee, employeeIndex) => workplaces.map((workplace, workplaceIndex) => {
    const days = createDays(employeeIndex * workplaces.length + workplaceIndex, year, month)
    const filteredDays = days.map((day) => day.state === 'PRESENT' ? { ...day, matchesFilters: dayMatches(day, query) } : day)
    const monthWorkMinutes = filteredDays.reduce((total, day) => total + (day.state === 'PRESENT' ? day.record.totalWorkMinutes : 0), 0)
    const matchingWorkMinutes = filteredDays.reduce((total, day) => total + (day.state === 'PRESENT' && day.matchesFilters ? day.record.totalWorkMinutes : 0), 0)
    return {
      employee,
      workplace: { id: workplace.id, name: workplace.name },
      client: workplace.client,
      site: workplace.site,
      days: filteredDays,
      totals: { monthWorkMinutes, matchingWorkMinutes },
    }
  }))

  return rows
    .filter((row) => !query.siteId || row.site.id === query.siteId)
    .filter((row) => !query.employeeId || row.employee.id === query.employeeId)
    .filter((row) => !query.workplaceId || row.workplace.id === query.workplaceId)
    .filter((row) => !query.clientId || row.client.id === query.clientId)
    .filter((row) => !hasDayFilters(query) || row.days.some((day) => day.state === 'PRESENT' && day.matchesFilters))
    .sort((left, right) => left.employee.lastName.localeCompare(right.employee.lastName, 'es-AR')
      || left.employee.firstName.localeCompare(right.employee.firstName, 'es-AR')
      || left.workplace.name.localeCompare(right.workplace.name, 'es-AR')
      || left.employee.id.localeCompare(right.employee.id)
      || left.workplace.id.localeCompare(right.workplace.id))
}

function snapshotFor(query: MonthlyQuery) {
  return ['mock', query.year, query.month, query.siteId ?? 'all', query.employeeId ?? 'all', query.workplaceId ?? 'all', query.clientId ?? 'all', query.status ?? 'all', query.reviewStatus ?? 'all', query.origin ?? 'all', query.hasAbsence ? 'absence' : 'all'].join(':')
}

export function registerRecordsMockRoutes(adapter: MockServiceAdapter, now: () => Date = () => new Date()) {
  const recordContexts = new Map<string, RecordContext>()
  const eventDetails = new Map<string, AttendanceEventDetail>()
  const storedRecords = new Map<string, RecordDetail>()
  const createdRecordIds = new Set<string>()
  let manualRecordSequence = 1
  let manualIntervalSequence = 1

  adapter.register('GET', '/records/monthly', (request: ServiceRequest) => {
    const query: MonthlyQuery = {
      year: parseInteger(request.query?.year, 0),
      month: parseInteger(request.query?.month, 0),
      page: Math.max(1, parseInteger(request.query?.page, 1)),
      pageSize: Math.min(100, Math.max(1, parseInteger(request.query?.pageSize, 50))),
      siteId: request.query?.siteId ? String(request.query.siteId) : undefined,
      employeeId: request.query?.employeeId ? String(request.query.employeeId) : undefined,
      workplaceId: request.query?.workplaceId ? String(request.query.workplaceId) : undefined,
      clientId: request.query?.clientId ? String(request.query.clientId) : undefined,
      status: request.query?.status as MonthlyQuery['status'],
      reviewStatus: request.query?.reviewStatus as MonthlyQuery['reviewStatus'],
      origin: request.query?.origin as MonthlyQuery['origin'],
      hasAbsence: request.query?.hasAbsence === true || request.query?.hasAbsence === 'true' ? true : undefined,
      snapshotToken: request.query?.snapshotToken ? String(request.query.snapshotToken) : undefined,
    }

    if (query.year < 2000 || query.month < 1 || query.month > 12) throw apiError('INVALID_MONTH', 'Seleccioná un mes válido.', 400)
    const expectedSnapshot = snapshotFor(query)
    if ((query.page ?? 1) > 1 && !query.snapshotToken) throw apiError('MONTHLY_SNAPSHOT_MISMATCH', 'La consulta mensual perdió su referencia. Reiniciá la carga.', 400)
    if (query.snapshotToken && query.snapshotToken !== expectedSnapshot) throw apiError('MONTHLY_SNAPSHOT_MISMATCH', 'Los filtros ya no coinciden con la consulta mensual.', 400)

    const rows = createRows(query.year, query.month, query)
    for (const row of rows) {
      for (const detail of storedRecords.values()) {
        if (!createdRecordIds.has(detail.id) || detail.employee.id !== row.employee.id || detail.workplace.id !== row.workplace.id) continue
        if (Number(detail.date.slice(0, 4)) !== query.year || Number(detail.date.slice(5, 7)) !== query.month) continue
        const dayIndex = Number(detail.date.slice(-2)) - 1
        row.days[dayIndex] = { date: detail.date, state: 'PRESENT', matchesFilters: dayMatches({ date: detail.date, state: 'PRESENT', matchesFilters: true, record: detailSummary(detail) }, query), record: detailSummary(detail) }
      }
      for (const day of row.days) {
        if (day.state !== 'PRESENT') continue
        const stored = storedRecords.get(day.record.id)
        if (stored) day.record = detailSummary(stored)
        recordContexts.set(day.record.id, { row, day })
      }
      row.totals.monthWorkMinutes = row.days.reduce((total, day) => total + (day.state === 'PRESENT' ? day.record.totalWorkMinutes : 0), 0)
      row.totals.matchingWorkMinutes = row.days.reduce((total, day) => total + (day.state === 'PRESENT' && day.matchesFilters ? day.record.totalWorkMinutes : 0), 0)
    }
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 50
    const totalItems = rows.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    const data = rows.slice((page - 1) * pageSize, page * pageSize)
    const totals = rows.reduce((result, row) => ({
      monthWorkMinutes: result.monthWorkMinutes + row.totals.monthWorkMinutes,
      matchingWorkMinutes: result.matchingWorkMinutes + row.totals.matchingWorkMinutes,
    }), { monthWorkMinutes: 0, matchingWorkMinutes: 0 })

    return {
      data,
      pagination: { page, pageSize, totalItems, totalPages },
      meta: {
        month: query.month,
        year: query.year,
        timeZone: '-03:00',
        snapshotToken: expectedSnapshot,
        snapshotExpiresAt: new Date(now().getTime() + 15 * 60 * 1000).toISOString(),
        totals,
      },
    }
  })

  adapter.register('POST', '/records', (request) => {
    const input = request.body as CreateRecordInput
    const employee = employees.find((item) => item.id === input.userId)
    const workplace = workplaces.find((item) => item.id === input.workplaceId)
    if (!employee || !workplace) throw apiError('RECORD_RELATION_NOT_FOUND', 'El empleado o lugar seleccionado no está disponible.', 422)
    validateManualIntervals(input.intervals)

    const year = Number(input.date.slice(0, 4))
    const month = Number(input.date.slice(5, 7))
    const day = Number(input.date.slice(8, 10))
    const rowIndex = employees.findIndex((item) => item.id === input.userId) * workplaces.length + workplaces.findIndex((item) => item.id === input.workplaceId)
    const generatedDay = createDays(rowIndex, year, month)[day - 1]
    const alreadyCreated = [...storedRecords.values()].some((detail) => detail.employee.id === input.userId && detail.workplace.id === input.workplaceId && detail.date === input.date)
    if (generatedDay?.state === 'PRESENT' || alreadyCreated) throw apiError('RECORD_ALREADY_EXISTS', 'Ya existe un registro para esa combinación. Abrí el registro existente.', 409)

    const id = `990e8400-e29b-41d4-a716-${String(manualRecordSequence++).padStart(12, '0')}`
    const createdAt = now().toISOString()
    const intervals = input.intervals.map((interval) => toManualInterval(`880e8400-e29b-41d4-a716-${String(manualIntervalSequence++).padStart(12, '0')}`, interval))
    const detail = recalculateRecord({
      id,
      date: input.date,
      employee,
      workplace: { id: workplace.id, name: workplace.name },
      client: workplace.client,
      site: workplace.site,
      totalWorkMinutes: 0,
      recordStatus: 'COMPLETE',
      reviewStatus: 'MANUAL_LOADED',
      origin: 'MANUAL',
      hasAbsence: false,
      observations: input.observations,
      version: 1,
      intervals,
      createdAt,
      updatedAt: createdAt,
    })
    storedRecords.set(id, detail)
    createdRecordIds.add(id)
    return { data: detail }
  })

  adapter.registerPattern('PATCH', /^\/records\/[0-9a-f-]{36}$/i, (request) => {
    const recordIdentifier = request.path.split('/').at(-1) ?? ''
    const input = request.body as UpdateRecordInput
    const context = recordContexts.get(recordIdentifier)
    const current = storedRecords.get(recordIdentifier) ?? (context ? createRecordDetail(context, eventDetails) : undefined)
    if (!current) throw apiError('RECORD_NOT_FOUND', 'El registro solicitado no existe o ya no está disponible.', 404)
    if (input.expectedVersion !== current.version) throw apiError('RECORD_VERSION_CONFLICT', 'El registro cambió desde que lo abriste. Recargá para comparar la versión actual.', 409)

    const nextIntervals = [...current.intervals]
    for (const change of input.intervalChanges ?? []) {
      if (change.operation === 'ADD') {
        nextIntervals.push(toManualInterval(`880e8400-e29b-41d4-a716-${String(manualIntervalSequence++).padStart(12, '0')}`, change.interval))
        continue
      }
      const index = nextIntervals.findIndex((interval) => interval.id === change.id)
      if (index < 0) throw apiError('RECORD_INTERVAL_NOT_FOUND', 'El intervalo ya no pertenece a este registro.', 422)
      if (change.operation === 'DELETE') {
        nextIntervals.splice(index, 1)
        continue
      }
      nextIntervals[index] = toManualInterval(change.id, change.interval, nextIntervals[index])
    }
    if (input.intervalChanges?.length) validateManualIntervals(nextIntervals)

    const changed = Object.prototype.hasOwnProperty.call(input, 'observations') || Boolean(input.intervalChanges?.length)
    const next = recalculateRecord({
      ...current,
      observations: Object.prototype.hasOwnProperty.call(input, 'observations') ? input.observations ?? null : current.observations,
      intervals: nextIntervals,
      origin: changed ? 'MANUAL' : current.origin,
      reviewStatus: changed ? 'MANUAL_LOADED' : current.reviewStatus,
      version: current.version + 1,
      updatedAt: now().toISOString(),
    })
    storedRecords.set(recordIdentifier, next)
    return { data: next }
  })

  adapter.registerPattern('PATCH', /^\/records\/[0-9a-f-]{36}\/review$/i, (request) => {
    const recordIdentifier = request.path.split('/').at(-2) ?? ''
    const input = request.body as ReviewRecordInput
    const context = recordContexts.get(recordIdentifier)
    const current = storedRecords.get(recordIdentifier) ?? (context ? createRecordDetail(context, eventDetails) : undefined)
    if (!current) throw apiError('RECORD_NOT_FOUND', 'El registro solicitado no existe o ya no está disponible.', 404)
    if (input.expectedVersion !== current.version) throw apiError('RECORD_VERSION_CONFLICT', 'El registro cambió desde que lo abriste. Recargá para comparar la versión actual.', 409)
    if (input.reviewStatus !== 'APPROVED') throw apiError('INVALID_REVIEW_STATUS', 'La revisión solo admite la aprobación del registro.', 422)

    const next: RecordDetail = {
      ...current,
      reviewStatus: 'APPROVED',
      version: current.version + 1,
      updatedAt: now().toISOString(),
    }
    storedRecords.set(recordIdentifier, next)
    return { data: next }
  })

  adapter.registerPattern('GET', /^\/records\/[0-9a-f-]{36}$/i, (request) => {
    const recordIdentifier = request.path.split('/').at(-1) ?? ''
    const stored = storedRecords.get(recordIdentifier)
    if (stored) return { data: stored }
    const context = recordContexts.get(recordIdentifier)
    if (!context) throw apiError('RECORD_NOT_FOUND', 'El registro solicitado no existe o ya no está disponible.', 404)
    const detail = createRecordDetail(context, eventDetails)
    storedRecords.set(recordIdentifier, detail)
    return { data: detail }
  })

  adapter.registerPattern('GET', /^\/attendance-events\/[0-9a-f-]{36}$/i, (request) => {
    const eventIdentifier = request.path.split('/').at(-1) ?? ''
    const detail = eventDetails.get(eventIdentifier)
    if (!detail) throw apiError('ATTENDANCE_EVENT_NOT_FOUND', 'El evento de marcación solicitado no existe.', 404)
    return { data: detail }
  })
}

// Métricas del mes sobre la generación determinista: los registros manuales
// creados en runtime no se reflejan (limitación del mock, sin efecto en backend real).
export function computeMonthlyRecordMetrics(year: number, month: number) {
  const rows = createRows(year, month, { year, month })
  let incompleteRecords = 0
  let pendingReviewRecords = 0
  let recordsWithAbsence = 0

  for (const row of rows) {
    for (const day of row.days) {
      if (day.state !== 'PRESENT') continue
      if (day.record.recordStatus === 'INCOMPLETE') incompleteRecords += 1
      if (day.record.reviewStatus === 'PENDING') pendingReviewRecords += 1
      if (day.record.hasAbsence) recordsWithAbsence += 1
    }
  }

  return { incompleteRecords, pendingReviewRecords, recordsWithAbsence }
}
