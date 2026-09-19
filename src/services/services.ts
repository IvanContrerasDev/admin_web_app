import { AuthService } from './auth-service'
import { createServiceAdapter } from './create-service-adapter'
import { DashboardService } from './dashboard-service'
import { DocumentsService } from './documents-service'
import { OrganizationService } from './organization-service'
import { RecordsService } from './records-service'
import { ServiceClient } from './service-client'
import { TimesheetsService } from './timesheets-service'
import { UserService } from './user-service'

const adapter = createServiceAdapter(import.meta.env)

export const services = new ServiceClient(adapter)
export const authService = new AuthService(adapter)
export const userService = new UserService(adapter)
export const organizationService = new OrganizationService(adapter)
export const recordsService = new RecordsService(adapter)
export const timesheetsService = new TimesheetsService(adapter)
export const documentsService = new DocumentsService(adapter)
export const dashboardService = new DashboardService(adapter)
