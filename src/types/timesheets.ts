import { z } from 'zod'
import { ALLOWED_ATTACHMENT_EXTENSIONS } from '../lib/attachments'

export const timesheetStatusSchema = z.enum(['PENDING', 'LOADED', 'ERROR'])
export type TimesheetStatus = z.infer<typeof timesheetStatusSchema>

export const fileExtensionSchema = z.enum(ALLOWED_ATTACHMENT_EXTENSIONS)
export type FileExtension = z.infer<typeof fileExtensionSchema>

export const employeeReferenceSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  employeeId: z.string().min(1),
})
export type EmployeeReference = z.infer<typeof employeeReferenceSchema>

export const uploaderReferenceSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})
export type UploaderReference = z.infer<typeof uploaderReferenceSchema>

export const timesheetListItemSchema = z.object({
  id: z.string().uuid(),
  employee: employeeReferenceSchema,
  workplace: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  client: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  site: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  sequence: z.number().int().positive(),
  status: timesheetStatusSchema,
  fileName: z.string().min(1),
  fileExtension: fileExtensionSchema,
  fileSizeBytes: z.number().int().positive(),
  uploadedBy: uploaderReferenceSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type TimesheetListItem = z.infer<typeof timesheetListItemSchema>
export type TimesheetDetail = TimesheetListItem

export const timesheetDownloadSchema = z.object({
  downloadUrl: z.string().min(1),
  expiresAt: z.string().datetime(),
})
export type TimesheetDownload = z.infer<typeof timesheetDownloadSchema>

export interface TimesheetFileInput {
  fileName: string
  fileSizeBytes: number
}

export interface CreateTimesheetInput {
  employeeId: string
  workplaceId: string
  month: number
  year: number
  files: TimesheetFileInput[]
}

export interface ReplaceTimesheetFileInput {
  file: TimesheetFileInput
}

export interface TimesheetListQuery {
  search?: string
  employeeId?: string
  clientId?: string
  workplaceId?: string
  siteId?: string
  month?: number
  year?: number
  status?: TimesheetStatus
  page?: number
  pageSize?: number
}
