import { z } from 'zod'

export const entityStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])
export type EntityStatus = z.infer<typeof entityStatusSchema>

export const workplaceShapeTypeSchema = z.literal('CIRCLE')
export type WorkplaceShapeType = z.infer<typeof workplaceShapeTypeSchema>

export const siteReferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
})
export type SiteReference = z.infer<typeof siteReferenceSchema>

export const clientReferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: entityStatusSchema,
})
export type ClientReference = z.infer<typeof clientReferenceSchema>

export const clientListItemSchema = clientReferenceSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type ClientListItem = z.infer<typeof clientListItemSchema>
export type ClientDetail = ClientListItem

export const workplaceListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  client: clientReferenceSchema,
  site: siteReferenceSchema,
  status: entityStatusSchema,
  shapeType: workplaceShapeTypeSchema,
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(10_000),
  gpsAccuracyThreshold: z.number().int().min(1).max(1_000).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type WorkplaceListItem = z.infer<typeof workplaceListItemSchema>
export type WorkplaceDetail = WorkplaceListItem

export interface CreateClientInput { name: string }
export interface UpdateClientInput { name: string }

export interface ClientListQuery {
  search?: string
  status?: EntityStatus
  page?: number
  pageSize?: number
}

export interface CreateWorkplaceInput {
  clientId: string
  siteId: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
  gpsAccuracyThreshold: number | null
}
export type UpdateWorkplaceInput = CreateWorkplaceInput

export interface WorkplaceListQuery {
  search?: string
  clientId?: string
  siteId?: string
  status?: EntityStatus
  page?: number
  pageSize?: number
}

