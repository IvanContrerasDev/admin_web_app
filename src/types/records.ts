import { z } from 'zod'

export const recordStatusSchema = z.enum(['COMPLETE', 'INCOMPLETE'])
export type RecordStatus = z.infer<typeof recordStatusSchema>

export const reviewStatusSchema = z.enum(['NONE', 'PENDING', 'APPROVED', 'REJECTED', 'MANUAL_LOADED'])
export type ReviewStatus = z.infer<typeof reviewStatusSchema>

export const recordOriginSchema = z.enum(['AUTOMATIC', 'MANUAL'])
export type RecordOrigin = z.infer<typeof recordOriginSchema>

const recordSummarySchema = z.object({
  id: z.string().uuid(),
  totalWorkMinutes: z.number().int().nonnegative(),
  recordStatus: recordStatusSchema,
  reviewStatus: reviewStatusSchema,
  origin: recordOriginSchema,
  hasAbsence: z.boolean(),
  intervalCount: z.number().int().nonnegative(),
})

export const monthlyDaySchema = z.discriminatedUnion('state', [
  z.object({ date: z.string().date(), state: z.literal('EMPTY') }),
  z.object({
    date: z.string().date(),
    state: z.literal('PRESENT'),
    matchesFilters: z.boolean(),
    record: recordSummarySchema,
  }),
])
export type MonthlyDay = z.infer<typeof monthlyDaySchema>

export const monthlyRowSchema = z.object({
  employee: z.object({
    id: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    employeeId: z.string().min(1),
  }),
  workplace: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  client: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  site: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  days: z.array(monthlyDaySchema).min(28).max(31),
  totals: z.object({
    monthWorkMinutes: z.number().int().nonnegative(),
    matchingWorkMinutes: z.number().int().nonnegative(),
  }),
})
export type MonthlyRow = z.infer<typeof monthlyRowSchema>

const paginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const monthlyResponseSchema = z.object({
  data: z.array(monthlyRowSchema),
  pagination: paginationSchema,
  meta: z.object({
    month: z.number().int().min(1).max(12),
    year: z.number().int(),
    timeZone: z.literal('-03:00'),
    snapshotToken: z.string().min(1),
    snapshotExpiresAt: z.string().datetime(),
    totals: z.object({
      monthWorkMinutes: z.number().int().nonnegative(),
      matchingWorkMinutes: z.number().int().nonnegative(),
    }),
  }),
})
export type MonthlyResponse = z.infer<typeof monthlyResponseSchema>

export const attendanceEventTypeSchema = z.enum(['CHECK_IN', 'CHECK_OUT', 'ABSENCE'])
export type AttendanceEventType = z.infer<typeof attendanceEventTypeSchema>

export const intervalTypeSchema = z.enum(['WORK', 'ABSENCE'])
export const intervalStatusSchema = z.enum(['OPEN', 'SEMI_CLOSED', 'CLOSED'])
export const absenceReasonSchema = z.enum(['ILLNESS', 'VACATION', 'LEAVE', 'ART', 'OTHER'])

export const attendanceEventReferenceSchema = z.object({
  id: z.string().uuid(),
  type: attendanceEventTypeSchema,
  occurredAt: z.string().datetime(),
})
export type AttendanceEventReference = z.infer<typeof attendanceEventReferenceSchema>

export const recordIntervalSchema = z.object({
  id: z.string().uuid(),
  type: intervalTypeSchema,
  status: intervalStatusSchema,
  startTime: z.string().datetime().nullable(),
  endTime: z.string().datetime().nullable(),
  absenceReason: absenceReasonSchema.nullable(),
  observations: z.string().nullable(),
  origin: recordOriginSchema,
  reviewStatus: reviewStatusSchema,
  attendanceEvents: z.array(attendanceEventReferenceSchema),
})
export type RecordInterval = z.infer<typeof recordIntervalSchema>

export const recordDetailSchema = z.object({
  id: z.string().uuid(),
  date: z.string().date(),
  employee: z.object({
    id: z.string().uuid(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    employeeId: z.string().min(1),
  }),
  workplace: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  client: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  site: z.object({ id: z.string().uuid(), name: z.string().min(1) }),
  totalWorkMinutes: z.number().int().nonnegative(),
  recordStatus: recordStatusSchema,
  reviewStatus: reviewStatusSchema,
  origin: recordOriginSchema,
  hasAbsence: z.boolean(),
  observations: z.string().nullable(),
  version: z.number().int().positive(),
  intervals: z.array(recordIntervalSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type RecordDetail = z.infer<typeof recordDetailSchema>

const metadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const attendanceEventDetailSchema = z.object({
  id: z.string().uuid(),
  recordId: z.string().uuid(),
  intervalId: z.string().uuid(),
  type: attendanceEventTypeSchema,
  occurredAt: z.string().datetime(),
  receivedAt: z.string().datetime(),
  origin: z.enum(['MOBILE', 'ADMIN']),
  observation: z.string().nullable(),
  location: z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    accuracyMeters: z.number().finite().nonnegative(),
    capturedAt: z.string().datetime(),
  }).nullable(),
  metadata: z.record(z.string(), metadataValueSchema),
})
export type AttendanceEventDetail = z.infer<typeof attendanceEventDetailSchema>

export type IntervalType = z.infer<typeof intervalTypeSchema>
export type AbsenceReason = z.infer<typeof absenceReasonSchema>

export interface RecordIntervalInput {
  type: IntervalType
  startTime: string | null
  endTime: string | null
  absenceReason: AbsenceReason | null
  observations: string | null
}

export type RecordIntervalChange =
  | { operation: 'ADD'; interval: RecordIntervalInput }
  | { operation: 'UPDATE'; id: string; interval: RecordIntervalInput }

export interface CreateRecordInput {
  userId: string
  workplaceId: string
  date: string
  observations: string | null
  intervals: RecordIntervalInput[]
}

export interface UpdateRecordInput {
  expectedVersion: number
  observations?: string | null
  intervalChanges?: RecordIntervalChange[]
}

export interface MonthlyQuery {
  month: number
  year: number
  page?: number
  pageSize?: number
  siteId?: string
  employeeId?: string
  workplaceId?: string
  clientId?: string
  status?: RecordStatus
  reviewStatus?: ReviewStatus
  origin?: RecordOrigin
  hasAbsence?: true
  snapshotToken?: string
}
