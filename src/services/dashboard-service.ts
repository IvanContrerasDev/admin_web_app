import { dashboardMetricsSchema, type DashboardMetrics, type DashboardMetricsQuery } from '../types/dashboard'
import type { ServiceAdapter } from './service-adapter'
import { ServiceClient } from './service-client'

export class DashboardService {
  private readonly client: ServiceClient

  constructor(adapter: ServiceAdapter) {
    this.client = new ServiceClient(adapter)
  }

  getMetrics(query: DashboardMetricsQuery, signal?: AbortSignal): Promise<DashboardMetrics> {
    return this.client.request(
      { path: '/dashboard/metrics', query: { month: query.month, year: query.year }, signal },
      dashboardMetricsSchema,
    )
  }
}
