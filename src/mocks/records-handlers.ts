import { ServiceError } from '../services/service-error'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import type { MonthlyDay, MonthlyQuery, MonthlyRow } from '../types/records'
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

function createDays(rowIndex: number, year: number, month: number): MonthlyDay[] {
  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const day = index + 1
    const date = dateFor(year, month, day)
    if ((day + rowIndex) % 4 === 0) return { date, state: 'EMPTY' as const }

    const hasAbsence = (day + rowIndex) % 13 === 0
    const recordStatus = (day + rowIndex) % 9 === 0 ? 'INCOMPLETE' as const : 'COMPLETE' as const
    const reviewStatus = (day + rowIndex) % 17 === 0
      ? 'REJECTED' as const
      : (day + rowIndex) % 7 === 0
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
}
