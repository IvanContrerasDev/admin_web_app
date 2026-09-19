import { AuthService } from './auth-service'
import { createServiceAdapter } from './create-service-adapter'
import { OrganizationService } from './organization-service'
import { RecordsService } from './records-service'
import { ServiceClient } from './service-client'
import { UserService } from './user-service'

const adapter = createServiceAdapter(import.meta.env)

export const services = new ServiceClient(adapter)
export const authService = new AuthService(adapter)
export const userService = new UserService(adapter)
export const organizationService = new OrganizationService(adapter)
export const recordsService = new RecordsService(adapter)
