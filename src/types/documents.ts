import { z } from 'zod'
import { employeeReferenceSchema, fileExtensionSchema, uploaderReferenceSchema } from './timesheets'

export const documentTypeSchema = z.enum([
  'DNI',
  'MEDICAL_CERTIFICATE',
  'CONTRACT',
  'ART',
  'EPP_DOCUMENTATION',
  'MEDICAL_RECORD',
  'INTERNAL_POLICIES',
  'ADDRESS_DECLARATION',
  'OTHER',
])
export type DocumentType = z.infer<typeof documentTypeSchema>

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: 'DNI',
  MEDICAL_CERTIFICATE: 'Certificado médico',
  CONTRACT: 'Contrato',
  ART: 'ART',
  EPP_DOCUMENTATION: 'Documentación EPP',
  MEDICAL_RECORD: 'Ficha médica',
  INTERNAL_POLICIES: 'Normas internas',
  ADDRESS_DECLARATION: 'Declaración de domicilio',
  OTHER: 'Otros',
}

export const documentListItemSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().min(1),
  type: documentTypeSchema,
  fileExtension: fileExtensionSchema,
  fileSizeBytes: z.number().int().positive(),
  employee: employeeReferenceSchema,
  workplace: z.object({ id: z.string().uuid(), name: z.string().min(1) }).nullable(),
  uploadedBy: uploaderReferenceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type DocumentListItem = z.infer<typeof documentListItemSchema>
export type DocumentDetail = DocumentListItem

export const documentDownloadSchema = z.object({
  downloadUrl: z.string().min(1),
  expiresAt: z.string().datetime(),
})
export type DocumentDownload = z.infer<typeof documentDownloadSchema>

export interface DocumentFileInput {
  fileName: string
  fileSizeBytes: number
}

export interface CreateDocumentInput {
  employeeId: string
  type: DocumentType
  workplaceId: string | null
  files: DocumentFileInput[]
}

export interface UpdateDocumentInput {
  fileName?: string
  type?: DocumentType
}

export interface DocumentListQuery {
  search?: string
  employeeId?: string
  type?: DocumentType
  uploadedBy?: string
  uploadedFrom?: string
  uploadedTo?: string
  page?: number
  pageSize?: number
}
