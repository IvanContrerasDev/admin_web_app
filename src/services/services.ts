import { createServiceAdapter } from './create-service-adapter'
import { ServiceClient } from './service-client'

export const services = new ServiceClient(createServiceAdapter(import.meta.env))
