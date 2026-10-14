import { z } from 'zod'

const dashboardCountersSchema = z.object({
  pendingTimesheets: z.number().int().nonnegative(),
  incompleteRecords: z.number().int().nonnegative(),
  pendingReviewRecords: z.number().int().nonnegative(),
  recordsWithAbsence: z.number().int().nonnegative(),
})
export type DashboardMetricKey = keyof z.infer<typeof dashboardCountersSchema>

export const provinceMetricsSchema = dashboardCountersSchema.extend({
  id: z.uuid(),
  name: z.string().min(1),
})
export type ProvinceMetrics = z.infer<typeof provinceMetricsSchema>

export const dashboardMetricsSchema = dashboardCountersSchema.extend({
  byProvince: z.array(provinceMetricsSchema),
})
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>

export interface DashboardMetricsQuery {
  month: number
  year: number
}
