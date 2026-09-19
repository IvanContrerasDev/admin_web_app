import { attachmentExtension, validateAttachmentBatch } from '../lib/attachments'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import { ServiceError } from '../services/service-error'
import type {
  CreateTimesheetInput,
  FileExtension,
  ReplaceTimesheetFileInput,
  TimesheetDetail,
  TimesheetStatus,
} from '../types/timesheets'
import { ORGANIZATION_SITES } from './organization-handlers'

const ADMIN_UPLOADER = { id: 'a1000000-0000-4000-8000-000000000001', firstName: 'Marina', lastName: 'Quiroga' }

const employees = [
  { id: '22000000-0000-4000-8000-000000000001', firstName: 'Lucía', lastName: 'Álvarez', employeeId: 'EMP-018' },
  { id: '22000000-0000-4000-8000-000000000002', firstName: 'Tomás', lastName: 'Benítez', employeeId: 'EMP-024' },
  { id: '22000000-0000-4000-8000-000000000003', firstName: 'Camila', lastName: 'Castro', employeeId: 'EMP-031' },
  { id: '22000000-0000-4000-8000-000000000004', firstName: 'Mateo', lastName: 'Fernández', employeeId: 'EMP-037' },
  { id: '22000000-0000-4000-8000-000000000005', firstName: 'Valentina', lastName: 'Gómez', employeeId: 'EMP-042' },
  { id: '22000000-0000-4000-8000-000000000006', firstName: 'Nicolás', lastName: 'Sosa', employeeId: 'EMP-046' },
]

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

interface SeedTimesheet {
  sequenceId: number
  employeeIndex: number
  workplaceIndex: number
  month: number
  year: number
  sequence: number
  status: TimesheetStatus
  fileName: string
  fileSizeBytes: number
  uploadedBy: 'ADMIN' | 'EMPLOYEE'
  createdAt: string
}

const SEED_TIMESHEETS: SeedTimesheet[] = [
  { sequenceId: 1, employeeIndex: 0, workplaceIndex: 0, month: 9, year: 2026, sequence: 1, status: 'LOADED', fileName: 'planilla-alvarez-septiembre.pdf', fileSizeBytes: 482_113, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-05T13:12:00.000Z' },
  { sequenceId: 2, employeeIndex: 0, workplaceIndex: 0, month: 9, year: 2026, sequence: 2, status: 'PENDING', fileName: 'planilla-alvarez-septiembre-anexo.jpg', fileSizeBytes: 1_832_445, uploadedBy: 'ADMIN', createdAt: '2026-09-12T15:40:00.000Z' },
  { sequenceId: 3, employeeIndex: 1, workplaceIndex: 1, month: 9, year: 2026, sequence: 1, status: 'PENDING', fileName: 'planilla-benitez-septiembre.pdf', fileSizeBytes: 390_220, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-14T10:05:00.000Z' },
  { sequenceId: 4, employeeIndex: 3, workplaceIndex: 3, month: 9, year: 2026, sequence: 1, status: 'ERROR', fileName: 'planilla-fernandez-septiembre.png', fileSizeBytes: 2_140_870, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-15T22:18:00.000Z' },
  { sequenceId: 5, employeeIndex: 4, workplaceIndex: 1, month: 9, year: 2026, sequence: 1, status: 'PENDING', fileName: 'planilla-gomez-septiembre.pdf', fileSizeBytes: 410_500, uploadedBy: 'ADMIN', createdAt: '2026-09-16T14:02:00.000Z' },
  { sequenceId: 6, employeeIndex: 0, workplaceIndex: 0, month: 8, year: 2026, sequence: 1, status: 'LOADED', fileName: 'planilla-alvarez-agosto.pdf', fileSizeBytes: 455_900, uploadedBy: 'ADMIN', createdAt: '2026-08-06T12:30:00.000Z' },
  { sequenceId: 7, employeeIndex: 1, workplaceIndex: 1, month: 8, year: 2026, sequence: 1, status: 'LOADED', fileName: 'planilla-benitez-agosto.pdf', fileSizeBytes: 402_310, uploadedBy: 'EMPLOYEE', createdAt: '2026-08-04T09:45:00.000Z' },
  { sequenceId: 8, employeeIndex: 2, workplaceIndex: 2, month: 8, year: 2026, sequence: 1, status: 'LOADED', fileName: 'planilla-castro-agosto.pdf', fileSizeBytes: 512_780, uploadedBy: 'ADMIN', createdAt: '2026-08-08T16:20:00.000Z' },
  { sequenceId: 9, employeeIndex: 5, workplaceIndex: 3, month: 7, year: 2026, sequence: 1, status: 'LOADED', fileName: 'planilla-sosa-julio.pdf', fileSizeBytes: 388_120, uploadedBy: 'ADMIN', createdAt: '2026-07-05T11:10:00.000Z' },
  { sequenceId: 10, employeeIndex: 3, workplaceIndex: 0, month: 9, year: 2026, sequence: 1, status: 'PENDING', fileName: 'planilla-fernandez-centro-septiembre.txt', fileSizeBytes: 18_420, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-16T09:32:00.000Z' },
]

export interface TimesheetsStore {
  items: TimesheetDetail[]
}

export function createTimesheetsStore(): TimesheetsStore {
  return {
    items: SEED_TIMESHEETS.map((seed) => {
      const employee = employees[seed.employeeIndex]!
      const workplace = workplaces[seed.workplaceIndex]!
      return {
        id: `66000000-0000-4000-8000-${String(seed.sequenceId).padStart(12, '0')}`,
        employee,
        workplace: { id: workplace.id, name: workplace.name },
        client: workplace.client,
        site: workplace.site,
        month: seed.month,
        year: seed.year,
        sequence: seed.sequence,
        status: seed.status,
        fileName: seed.fileName,
        fileExtension: attachmentExtension(seed.fileName) as FileExtension,
        fileSizeBytes: seed.fileSizeBytes,
        uploadedBy: seed.uploadedBy === 'ADMIN' ? ADMIN_UPLOADER : { id: employee.id, firstName: employee.firstName, lastName: employee.lastName },
        createdAt: seed.createdAt,
        updatedAt: seed.createdAt,
      }
    }),
  }
}

function apiError(code: string, message: string, status = 400): ServiceError {
  return new ServiceError({ code, message, retryable: false, kind: 'api', status })
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-AR').trim().replace(/\s+/g, ' ')
}

function parseInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function timesheetId(path: string) {
  return path.split('/')[2] ?? ''
}

function sortTimesheets(items: TimesheetDetail[]) {
  return [...items].sort((left, right) =>
    right.year - left.year
    || right.month - left.month
    || right.sequence - left.sequence
    || left.id.localeCompare(right.id))
}

function validateFiles(files: { fileName: string; fileSizeBytes: number }[]) {
  if (!Array.isArray(files) || files.length === 0) {
    throw apiError('INVALID_TIMESHEET_DATA', 'Adjuntá al menos un archivo.', 422)
  }
  const result = validateAttachmentBatch(files.map((file) => ({ name: file.fileName, size: file.fileSizeBytes })))
  if (!result.valid) {
    throw apiError(result.issues[0]!.code, result.issues.map((issue) => issue.message).join(' '), 422)
  }
}

function downloadUrlFor(timesheet: TimesheetDetail) {
  try {
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(new Blob([`Contenido simulado de ${timesheet.fileName}`], { type: 'text/plain' }))
    }
  } catch {
    // jsdom declara createObjectURL pero no lo implementa: se usa la URL simulada
  }
  return `https://archivos.gdes.test/descargas/${timesheet.id}`
}

export function registerTimesheetsMockRoutes(
  adapter: MockServiceAdapter,
  now: () => Date = () => new Date(),
  store: TimesheetsStore = createTimesheetsStore(),
) {
  let createdSequence = 1_000

  adapter.register('GET', '/timesheets', (request: ServiceRequest) => {
    const search = normalize(String(request.query?.search ?? ''))
    const employeeId = String(request.query?.employeeId ?? '')
    const clientId = String(request.query?.clientId ?? '')
    const workplaceId = String(request.query?.workplaceId ?? '')
    const siteId = String(request.query?.siteId ?? '')
    const status = request.query?.status as TimesheetStatus | undefined
    const month = request.query?.month ? parseInteger(request.query.month, 0) : undefined
    const year = request.query?.year ? parseInteger(request.query.year, 0) : undefined
    const page = Math.max(1, parseInteger(request.query?.page, 1))
    const pageSize = Math.min(100, Math.max(1, parseInteger(request.query?.pageSize, 25)))

    const filtered = sortTimesheets(store.items.filter((timesheet) =>
      (!employeeId || timesheet.employee.id === employeeId)
      && (!clientId || timesheet.client.id === clientId)
      && (!workplaceId || timesheet.workplace.id === workplaceId)
      && (!siteId || timesheet.site.id === siteId)
      && (!month || timesheet.month === month)
      && (!year || timesheet.year === year)
      && (!status || timesheet.status === status)
      && (!search
        || normalize(timesheet.fileName).includes(search)
        || normalize(timesheet.employee.firstName).includes(search)
        || normalize(timesheet.employee.lastName).includes(search)
        || normalize(`${timesheet.employee.firstName} ${timesheet.employee.lastName}`).includes(search)
        || normalize(`${timesheet.employee.lastName} ${timesheet.employee.firstName}`).includes(search)
        || normalize(timesheet.employee.employeeId).includes(search))))

    const totalItems = filtered.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, totalItems, totalPages } }
  })

  adapter.registerPattern('GET', /^\/timesheets\/[^/]+$/, (request) => {
    const timesheet = store.items.find((item) => item.id === timesheetId(request.path))
    if (!timesheet) throw apiError('TIMESHEET_NOT_FOUND', 'La planilla solicitada no existe.', 404)
    return { data: timesheet }
  })

  adapter.register('POST', '/timesheets', (request) => {
    const input = request.body as CreateTimesheetInput
    const employee = employees.find((item) => item.id === input?.employeeId)
    const workplace = workplaces.find((item) => item.id === input?.workplaceId)
    if (!employee || !workplace) throw apiError('TIMESHEET_RELATION_NOT_FOUND', 'El empleado o el lugar seleccionado no está disponible.', 422)
    if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12 || !Number.isInteger(input.year) || input.year < 2000) {
      throw apiError('INVALID_TIMESHEET_DATA', 'Seleccioná un mes y un año válidos.', 422)
    }
    validateFiles(input.files)

    const timestamp = now().toISOString()
    const baseSequence = Math.max(0, ...store.items
      .filter((item) => item.employee.id === employee.id && item.workplace.id === workplace.id && item.month === input.month && item.year === input.year)
      .map((item) => item.sequence))

    const created = input.files.map((file, index) => {
      const timesheet: TimesheetDetail = {
        id: `66000000-0000-4000-8000-${String(createdSequence++).padStart(12, '0')}`,
        employee,
        workplace: { id: workplace.id, name: workplace.name },
        client: workplace.client,
        site: workplace.site,
        month: input.month,
        year: input.year,
        sequence: baseSequence + index + 1,
        status: 'PENDING',
        fileName: file.fileName,
        fileExtension: attachmentExtension(file.fileName) as FileExtension,
        fileSizeBytes: file.fileSizeBytes,
        uploadedBy: ADMIN_UPLOADER,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      store.items.push(timesheet)
      return timesheet
    })

    return { data: { created } }
  })

  adapter.registerPattern('PATCH', /^\/timesheets\/[^/]+\/status$/, (request) => {
    const index = store.items.findIndex((item) => item.id === timesheetId(request.path))
    const current = store.items[index]
    if (!current) throw apiError('TIMESHEET_NOT_FOUND', 'La planilla solicitada no existe.', 404)
    const { status } = request.body as { status: TimesheetStatus }
    if (status !== 'PENDING' && status !== 'LOADED' && status !== 'ERROR') {
      throw apiError('INVALID_TIMESHEET_DATA', 'Seleccioná un estado válido.', 422)
    }
    const updated = { ...current, status, updatedAt: now().toISOString() }
    store.items[index] = updated
    return { data: updated }
  })

  adapter.registerPattern('PUT', /^\/timesheets\/[^/]+\/file$/, (request) => {
    const index = store.items.findIndex((item) => item.id === timesheetId(request.path))
    const current = store.items[index]
    if (!current) throw apiError('TIMESHEET_NOT_FOUND', 'La planilla solicitada no existe.', 404)
    const input = request.body as ReplaceTimesheetFileInput
    if (!input?.file) throw apiError('INVALID_TIMESHEET_DATA', 'Adjuntá el archivo de reemplazo.', 422)
    validateFiles([input.file])
    const updated: TimesheetDetail = {
      ...current,
      fileName: input.file.fileName,
      fileExtension: attachmentExtension(input.file.fileName) as FileExtension,
      fileSizeBytes: input.file.fileSizeBytes,
      updatedAt: now().toISOString(),
    }
    store.items[index] = updated
    return { data: updated }
  })

  adapter.registerPattern('GET', /^\/timesheets\/[^/]+\/download$/, (request) => {
    const timesheet = store.items.find((item) => item.id === timesheetId(request.path))
    if (!timesheet) throw apiError('TIMESHEET_NOT_FOUND', 'La planilla solicitada no existe.', 404)
    return {
      data: {
        downloadUrl: downloadUrlFor(timesheet),
        expiresAt: new Date(now().getTime() + 15 * 60 * 1000).toISOString(),
      },
    }
  })
}
