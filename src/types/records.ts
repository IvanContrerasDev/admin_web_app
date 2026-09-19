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
