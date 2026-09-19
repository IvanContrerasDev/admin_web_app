import { attachmentExtension, validateAttachmentBatch } from '../lib/attachments'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import { ServiceError } from '../services/service-error'
import type {
  CreateDocumentInput,
  DocumentDetail,
  DocumentType,
  UpdateDocumentInput,
} from '../types/documents'
import { documentTypeSchema } from '../types/documents'
import type { FileExtension } from '../types/timesheets'

const ADMIN_UPLOADER = { id: 'a1000000-0000-4000-8000-000000000001', firstName: 'Marina', lastName: 'Quiroga' }

const employees = [
  { id: '22000000-0000-4000-8000-000000000001', firstName: 'Lucía', lastName: 'Álvarez', employeeId: 'EMP-018' },
  { id: '22000000-0000-4000-8000-000000000002', firstName: 'Tomás', lastName: 'Benítez', employeeId: 'EMP-024' },
  { id: '22000000-0000-4000-8000-000000000003', firstName: 'Camila', lastName: 'Castro', employeeId: 'EMP-031' },
  { id: '22000000-0000-4000-8000-000000000004', firstName: 'Mateo', lastName: 'Fernández', employeeId: 'EMP-037' },
  { id: '22000000-0000-4000-8000-000000000005', firstName: 'Valentina', lastName: 'Gómez', employeeId: 'EMP-042' },
  { id: '22000000-0000-4000-8000-000000000006', firstName: 'Nicolás', lastName: 'Sosa', employeeId: 'EMP-046' },
]

const workplaces = [
  { id: '44000000-0000-4000-8000-000000000001', name: 'Centro de distribución San Juan' },
  { id: '44000000-0000-4000-8000-000000000002', name: 'Planta Mendoza' },
  { id: '44000000-0000-4000-8000-000000000003', name: 'Proyecto Cordillera' },
  { id: '44000000-0000-4000-8000-000000000004', name: 'Base operativa Salta' },
]

interface SeedDocument {
  sequenceId: number
  employeeIndex: number
  type: DocumentType
  fileName: string
  fileSizeBytes: number
  workplaceIndex: number | null
  uploadedBy: 'ADMIN' | 'EMPLOYEE'
  createdAt: string
}

const SEED_DOCUMENTS: SeedDocument[] = [
  { sequenceId: 1, employeeIndex: 0, type: 'CONTRACT', fileName: 'contrato-alvarez-2022.pdf', fileSizeBytes: 1_240_500, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2022-02-01T12:00:00.000Z' },
  { sequenceId: 2, employeeIndex: 0, type: 'DNI', fileName: 'dni-alvarez.pdf', fileSizeBytes: 860_100, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2022-02-01T12:05:00.000Z' },
  { sequenceId: 3, employeeIndex: 1, type: 'CONTRACT', fileName: 'contrato-benitez-2021.pdf', fileSizeBytes: 1_180_300, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2021-07-19T12:00:00.000Z' },
  { sequenceId: 4, employeeIndex: 1, type: 'ART', fileName: 'art-benitez.pdf', fileSizeBytes: 640_200, workplaceIndex: 1, uploadedBy: 'ADMIN', createdAt: '2026-03-10T14:30:00.000Z' },
  { sequenceId: 5, employeeIndex: 0, type: 'MEDICAL_CERTIFICATE', fileName: 'certificado-medico-alvarez.jpg', fileSizeBytes: 1_540_800, workplaceIndex: 0, uploadedBy: 'EMPLOYEE', createdAt: '2026-08-22T09:15:00.000Z' },
  { sequenceId: 6, employeeIndex: 2, type: 'MEDICAL_CERTIFICATE', fileName: 'certificado-castro.pdf', fileSizeBytes: 720_400, workplaceIndex: null, uploadedBy: 'EMPLOYEE', createdAt: '2026-08-28T18:45:00.000Z' },
  { sequenceId: 7, employeeIndex: 3, type: 'EPP_DOCUMENTATION', fileName: 'epp-fernandez.pdf', fileSizeBytes: 980_600, workplaceIndex: 3, uploadedBy: 'ADMIN', createdAt: '2026-09-02T11:20:00.000Z' },
  { sequenceId: 8, employeeIndex: 3, type: 'ADDRESS_DECLARATION', fileName: 'declaracion-domicilio-fernandez.txt', fileSizeBytes: 4_100, workplaceIndex: null, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-08T16:05:00.000Z' },
  { sequenceId: 9, employeeIndex: 4, type: 'MEDICAL_RECORD', fileName: 'ficha-medica-gomez.pdf', fileSizeBytes: 1_050_700, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2026-09-10T10:40:00.000Z' },
  { sequenceId: 10, employeeIndex: 5, type: 'INTERNAL_POLICIES', fileName: 'normas-internas-sosa.pdf', fileSizeBytes: 2_310_900, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2026-09-11T15:25:00.000Z' },
  { sequenceId: 11, employeeIndex: 4, type: 'OTHER', fileName: 'capacitacion-gomez.png', fileSizeBytes: 1_780_200, workplaceIndex: 1, uploadedBy: 'EMPLOYEE', createdAt: '2026-09-14T20:10:00.000Z' },
  { sequenceId: 12, employeeIndex: 1, type: 'DNI', fileName: 'dni-benitez.pdf', fileSizeBytes: 840_000, workplaceIndex: null, uploadedBy: 'ADMIN', createdAt: '2026-09-15T12:50:00.000Z' },
]

export interface DocumentsStore {
  items: DocumentDetail[]
}

export function createDocumentsStore(): DocumentsStore {
  return {
    items: SEED_DOCUMENTS.map((seed) => {
      const employee = employees[seed.employeeIndex]!
      const workplace = seed.workplaceIndex === null ? null : workplaces[seed.workplaceIndex]!
      return {
        id: `77000000-0000-4000-8000-${String(seed.sequenceId).padStart(12, '0')}`,
        fileName: seed.fileName,
        type: seed.type,
        fileExtension: attachmentExtension(seed.fileName) as FileExtension,
        fileSizeBytes: seed.fileSizeBytes,
        employee,
        workplace: workplace ? { id: workplace.id, name: workplace.name } : null,
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

function documentId(path: string) {
  return path.split('/')[2] ?? ''
}

function validDateParam(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined
}

function validateFiles(files: { fileName: string; fileSizeBytes: number }[]) {
  if (!Array.isArray(files) || files.length === 0) {
    throw apiError('INVALID_DOCUMENT_DATA', 'Adjuntá al menos un archivo.', 422)
  }
  const result = validateAttachmentBatch(files.map((file) => ({ name: file.fileName, size: file.fileSizeBytes })))
  if (!result.valid) {
    throw apiError(result.issues[0]!.code, result.issues.map((issue) => issue.message).join(' '), 422)
  }
}

function downloadUrlFor(document: DocumentDetail) {
  try {
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(new Blob([`Contenido simulado de ${document.fileName}`], { type: 'text/plain' }))
    }
  } catch {
    // jsdom declara createObjectURL pero no lo implementa: se usa la URL simulada
  }
  return `https://archivos.gdes.test/descargas/${document.id}`
}

export function registerDocumentsMockRoutes(
  adapter: MockServiceAdapter,
  now: () => Date = () => new Date(),
  store: DocumentsStore = createDocumentsStore(),
) {
  let createdSequence = 1_000

  adapter.register('GET', '/documents', (request: ServiceRequest) => {
    const search = normalize(String(request.query?.search ?? ''))
    const employeeId = String(request.query?.employeeId ?? '')
    const type = request.query?.type as DocumentType | undefined
    const uploadedBy = normalize(String(request.query?.uploadedBy ?? ''))
    const uploadedFrom = validDateParam(request.query?.uploadedFrom)
    const uploadedTo = validDateParam(request.query?.uploadedTo)
    const page = Math.max(1, parseInteger(request.query?.page, 1))
    const pageSize = Math.min(100, Math.max(1, parseInteger(request.query?.pageSize, 25)))

    const filtered = store.items
      .filter((document) =>
        (!employeeId || document.employee.id === employeeId)
        && (!type || document.type === type)
        && (!uploadedFrom || document.createdAt.slice(0, 10) >= uploadedFrom)
        && (!uploadedTo || document.createdAt.slice(0, 10) <= uploadedTo)
        && (!uploadedBy || normalize(`${document.uploadedBy.firstName} ${document.uploadedBy.lastName}`).includes(uploadedBy))
        && (!search
          || normalize(document.fileName).includes(search)
          || normalize(document.employee.firstName).includes(search)
          || normalize(document.employee.lastName).includes(search)
          || normalize(`${document.employee.firstName} ${document.employee.lastName}`).includes(search)
          || normalize(`${document.employee.lastName} ${document.employee.firstName}`).includes(search)
          || normalize(document.employee.employeeId).includes(search)))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id))

    const totalItems = filtered.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, totalItems, totalPages } }
  })

  adapter.registerPattern('GET', /^\/documents\/[^/]+$/, (request) => {
    const document = store.items.find((item) => item.id === documentId(request.path))
    if (!document) throw apiError('DOCUMENT_NOT_FOUND', 'El documento solicitado no existe.', 404)
    return { data: document }
  })

  adapter.register('POST', '/documents', (request) => {
    const input = request.body as CreateDocumentInput
    const employee = employees.find((item) => item.id === input?.employeeId)
    if (!employee) throw apiError('DOCUMENT_RELATION_NOT_FOUND', 'El empleado seleccionado no está disponible.', 422)
    const type = documentTypeSchema.safeParse(input?.type)
    if (!type.success) throw apiError('INVALID_DOCUMENT_DATA', 'Seleccioná un tipo de documento válido.', 422)
    const workplace = input.workplaceId === null ? null : workplaces.find((item) => item.id === input.workplaceId)
    if (input.workplaceId !== null && !workplace) throw apiError('DOCUMENT_RELATION_NOT_FOUND', 'El lugar seleccionado no está disponible.', 422)
    validateFiles(input.files)

    const timestamp = now().toISOString()
    const created = input.files.map((file) => {
      const document: DocumentDetail = {
        id: `77000000-0000-4000-8000-${String(createdSequence++).padStart(12, '0')}`,
        fileName: file.fileName,
        type: type.data,
        fileExtension: attachmentExtension(file.fileName) as FileExtension,
        fileSizeBytes: file.fileSizeBytes,
        employee,
        workplace: workplace ? { id: workplace.id, name: workplace.name } : null,
        uploadedBy: ADMIN_UPLOADER,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      store.items.push(document)
      return document
    })

    return { data: { created } }
  })

  adapter.registerPattern('PATCH', /^\/documents\/[^/]+$/, (request) => {
    const index = store.items.findIndex((item) => item.id === documentId(request.path))
    const current = store.items[index]
    if (!current) throw apiError('DOCUMENT_NOT_FOUND', 'El documento solicitado no existe.', 404)
    const input = request.body as UpdateDocumentInput
    const fileName = input.fileName === undefined ? current.fileName : input.fileName.trim().replace(/\s+/g, ' ')
    if (fileName.length < 1 || fileName.length > 120) throw apiError('INVALID_DOCUMENT_DATA', 'El nombre visible debe contener entre 1 y 120 caracteres.', 422)
    const type = input.type === undefined ? current.type : documentTypeSchema.safeParse(input.type)
    if (typeof type !== 'string' && !type.success) throw apiError('INVALID_DOCUMENT_DATA', 'Seleccioná un tipo de documento válido.', 422)
    const updated: DocumentDetail = {
      ...current,
      fileName,
      type: typeof type === 'string' ? type : type.data,
      updatedAt: now().toISOString(),
    }
    store.items[index] = updated
    return { data: updated }
  })

  adapter.registerPattern('DELETE', /^\/documents\/[^/]+$/, (request) => {
    const index = store.items.findIndex((item) => item.id === documentId(request.path))
    if (index < 0) throw apiError('DOCUMENT_NOT_FOUND', 'El documento solicitado no existe.', 404)
    store.items.splice(index, 1)
    return undefined
  })

  adapter.registerPattern('GET', /^\/documents\/[^/]+\/download$/, (request) => {
    const document = store.items.find((item) => item.id === documentId(request.path))
    if (!document) throw apiError('DOCUMENT_NOT_FOUND', 'El documento solicitado no existe.', 404)
    return {
      data: {
        downloadUrl: downloadUrlFor(document),
        expiresAt: new Date(now().getTime() + 15 * 60 * 1000).toISOString(),
      },
    }
  })
}
