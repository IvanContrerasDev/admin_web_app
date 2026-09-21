import { z } from 'zod'

export const accountStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])
export type AccountStatus = z.infer<typeof accountStatusSchema>

export const siteReferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})
export type SiteReference = z.infer<typeof siteReferenceSchema>

export const userListItemSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  employeeId: z.string(),
  dni: z.string(),
  email: z.string().email(),
  phone: z.string(),
  site: siteReferenceSchema,
  accountStatus: accountStatusSchema,
})
export type UserListItem = z.infer<typeof userListItemSchema>

export const userDetailSchema = userListItemSchema.extend({
  address: z.string(),
  birthDate: z.string(),
  cuil: z.string().nullable(),
  hireDate: z.string().nullable(),
  position: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type UserDetail = z.infer<typeof userDetailSchema>

export interface CreateUserInput {
  firstName: string
  lastName: string
  employeeId: string
  dni: string
  email: string
  initialPassword: string
  phone: string
  address: string
  siteId: string
  birthDate: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  employeeId?: string
  dni?: string
  email?: string
  phone?: string
  address?: string
  siteId?: string
  birthDate?: string
  cuil?: string | null
  hireDate?: string | null
  position?: string | null
}

export interface UserListQuery {
  search?: string
  accountStatus?: AccountStatus
  siteId?: string
  page?: number
  pageSize?: number
}
