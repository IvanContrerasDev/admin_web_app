import { z } from 'zod'

export const dashboardMetricsSchema = z.object({
  pendingTimesheets: z.number().int().nonnegative(),
  incompleteRecords: z.number().int().nonnegative(),
  pendingReviewRecords: z.number().int().nonnegative(),
  recordsWithAbsence: z.number().int().nonnegative(),
})
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>

export interface DashboardMetricsQuery {
  month: number
  year: number
}
