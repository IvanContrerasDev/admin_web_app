import { ServiceError } from '../services/service-error'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import type {
  ClientDetail,
  CreateClientInput,
  CreateWorkplaceInput,
  EntityStatus,
  SiteReference,
  UpdateClientInput,
  UpdateWorkplaceInput,
  WorkplaceDetail,
} from '../types/organization'

export const ORGANIZATION_SITES: SiteReference[] = [
  { id: '11000000-0000-4000-8000-000000000001', name: 'Catamarca' },
  { id: '11000000-0000-4000-8000-000000000002', name: 'La Rioja' },
  { id: '11000000-0000-4000-8000-000000000003', name: 'Mendoza' },
  { id: '11000000-0000-4000-8000-000000000004', name: 'Salta' },
  { id: '11000000-0000-4000-8000-000000000005', name: 'San Juan' },
  { id: '11000000-0000-4000-8000-000000000006', name: 'San Luis' },
]

const NOW = '2026-09-17T12:00:00.000Z'
const seedClients: ClientDetail[] = [
  { id: '33000000-0000-4000-8000-000000000001', name: 'Andes Logística', status: 'ACTIVE', createdAt: NOW, updatedAt: NOW },
  { id: '33000000-0000-4000-8000-000000000002', name: 'Cuyo Minería', status: 'ACTIVE', createdAt: NOW, updatedAt: NOW },
  { id: '33000000-0000-4000-8000-000000000003', name: 'Norte Servicios', status: 'ACTIVE', createdAt: NOW, updatedAt: NOW },
  { id: '33000000-0000-4000-8000-000000000004', name: 'Viñedos del Sol', status: 'INACTIVE', createdAt: NOW, updatedAt: NOW },
]

const clientReference = (client: ClientDetail) => ({ id: client.id, name: client.name, status: client.status })
const seedWorkplaces = (clients: ClientDetail[]): WorkplaceDetail[] => [
  { id: '44000000-0000-4000-8000-000000000001', name: 'Centro de distribución San Juan', client: clientReference(clients[0]!), site: ORGANIZATION_SITES[4]!, status: 'ACTIVE', shapeType: 'CIRCLE', latitude: -31.5375, longitude: -68.5364, radiusMeters: 180, gpsAccuracyThreshold: 60, createdAt: NOW, updatedAt: NOW },
  { id: '44000000-0000-4000-8000-000000000002', name: 'Planta Mendoza', client: clientReference(clients[0]!), site: ORGANIZATION_SITES[2]!, status: 'ACTIVE', shapeType: 'CIRCLE', latitude: -32.8895, longitude: -68.8458, radiusMeters: 250, gpsAccuracyThreshold: 80, createdAt: NOW, updatedAt: NOW },
  { id: '44000000-0000-4000-8000-000000000003', name: 'Proyecto Cordillera', client: clientReference(clients[1]!), site: ORGANIZATION_SITES[4]!, status: 'ACTIVE', shapeType: 'CIRCLE', latitude: -31.451, longitude: -68.809, radiusMeters: 500, gpsAccuracyThreshold: 100, createdAt: NOW, updatedAt: NOW },
  { id: '44000000-0000-4000-8000-000000000004', name: 'Base operativa Salta', client: clientReference(clients[2]!), site: ORGANIZATION_SITES[3]!, status: 'ACTIVE', shapeType: 'CIRCLE', latitude: -24.7892, longitude: -65.4108, radiusMeters: 140, gpsAccuracyThreshold: null, createdAt: NOW, updatedAt: NOW },
  { id: '44000000-0000-4000-8000-000000000005', name: 'Finca histórica', client: clientReference(clients[3]!), site: ORGANIZATION_SITES[2]!, status: 'INACTIVE', shapeType: 'CIRCLE', latitude: -33.0166, longitude: -68.867, radiusMeters: 90, gpsAccuracyThreshold: 40, createdAt: NOW, updatedAt: NOW },
]

function apiError(code: string, message: string, status = 400): ServiceError {
  return new ServiceError({ code, message, retryable: false, kind: 'api', status })
}

function requireBody<T>(request: ServiceRequest): T {
  if (!request.body || typeof request.body !== 'object') throw apiError('INVALID_CLIENT_DATA', 'Revisá los datos ingresados.')
  return request.body as T
}

function entityId(path: string) { return path.split('/')[2] ?? '' }
function normalize(value: string) { return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-AR').trim().replace(/\s+/g, ' ') }
function validName(value: unknown): value is string { return typeof value === 'string' && value.trim().length >= 1 && value.trim().length <= 120 }
function validInteger(value: unknown, min: number, max: number): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max }

function pagination(request: ServiceRequest) {
  return { page: Math.max(1, Number(request.query?.page ?? 1)), pageSize: Math.min(100, Math.max(1, Number(request.query?.pageSize ?? 25))) }
}

export function registerOrganizationMockRoutes(adapter: MockServiceAdapter, now: () => Date = () => new Date()) {
  const clients = seedClients.map((client) => ({ ...client }))
  const workplaces = seedWorkplaces(clients).map((workplace) => ({ ...workplace, client: { ...workplace.client }, site: { ...workplace.site } }))

  const refreshClientReferences = (client: ClientDetail) => {
    for (let index = 0; index < workplaces.length; index += 1) {
      const workplace = workplaces[index]!
      if (workplace.client.id === client.id) workplaces[index] = { ...workplace, client: clientReference(client) }
    }
  }

  adapter.register('GET', '/sites', () => ({ data: ORGANIZATION_SITES }))
  adapter.register('GET', '/clients', (request) => {
    const search = normalize(String(request.query?.search ?? ''))
    const status = request.query?.status as EntityStatus | undefined
    const { page, pageSize } = pagination(request)
    const filtered = clients.filter((client) => (!status || client.status === status) && (!search || normalize(client.name).includes(search))).sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || a.id.localeCompare(b.id))
    const totalItems = filtered.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, totalItems, totalPages } }
  })

  adapter.registerPattern('GET', /^\/clients\/[^/]+$/, (request) => {
    const client = clients.find((item) => item.id === entityId(request.path))
    if (!client) throw apiError('CLIENT_NOT_FOUND', 'El cliente solicitado no existe.', 404)
    return { data: client }
  })

  adapter.register('POST', '/clients', (request) => {
    const input = requireBody<CreateClientInput>(request)
    if (!validName(input.name)) throw apiError('INVALID_CLIENT_DATA', 'El nombre debe contener entre 1 y 120 caracteres.')
    const name = input.name.trim().replace(/\s+/g, ' ')
    if (clients.some((client) => normalize(client.name) === normalize(name))) throw apiError('CLIENT_NAME_ALREADY_EXISTS', 'Ya existe un cliente con ese nombre.', 409)
    const timestamp = now().toISOString()
    const client: ClientDetail = { id: crypto.randomUUID(), name, status: 'ACTIVE', createdAt: timestamp, updatedAt: timestamp }
    clients.push(client)
    return { data: client }
  })

  adapter.registerPattern('PUT', /^\/clients\/[^/]+$/, (request) => {
    const index = clients.findIndex((item) => item.id === entityId(request.path))
    const current = clients[index]
    if (!current) throw apiError('CLIENT_NOT_FOUND', 'El cliente solicitado no existe.', 404)
    const input = requireBody<UpdateClientInput>(request)
    if (!validName(input.name)) throw apiError('INVALID_CLIENT_DATA', 'El nombre debe contener entre 1 y 120 caracteres.')
    const name = input.name.trim().replace(/\s+/g, ' ')
    if (clients.some((client) => client.id !== current.id && normalize(client.name) === normalize(name))) throw apiError('CLIENT_NAME_ALREADY_EXISTS', 'Ya existe un cliente con ese nombre.', 409)
    const updated = { ...current, name, updatedAt: now().toISOString() }
    clients[index] = updated
    refreshClientReferences(updated)
    return { data: updated }
  })

  adapter.registerPattern('PATCH', /^\/clients\/[^/]+\/status$/, (request) => {
    const index = clients.findIndex((item) => item.id === entityId(request.path))
    const current = clients[index]
    if (!current) throw apiError('CLIENT_NOT_FOUND', 'El cliente solicitado no existe.', 404)
    const { status } = requireBody<{ status: EntityStatus }>(request)
    if (status !== 'ACTIVE' && status !== 'INACTIVE') throw apiError('INVALID_CLIENT_DATA', 'Seleccioná un estado válido.')
    const updated = { ...current, status, updatedAt: now().toISOString() }
    clients[index] = updated
    refreshClientReferences(updated)
    return { data: updated }
  })

  adapter.register('GET', '/workplaces', (request) => {
    const search = normalize(String(request.query?.search ?? ''))
    const status = request.query?.status as EntityStatus | undefined
    const clientId = String(request.query?.clientId ?? '')
    const siteId = String(request.query?.siteId ?? '')
    const { page, pageSize } = pagination(request)
    const filtered = workplaces.filter((workplace) => (!status || workplace.status === status) && (!clientId || workplace.client.id === clientId) && (!siteId || workplace.site.id === siteId) && (!search || normalize(workplace.name).includes(search))).sort((a, b) => a.name.localeCompare(b.name, 'es-AR') || a.id.localeCompare(b.id))
    const totalItems = filtered.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    return { data: filtered.slice((page - 1) * pageSize, page * pageSize), pagination: { page, pageSize, totalItems, totalPages } }
  })

  adapter.registerPattern('GET', /^\/workplaces\/[^/]+$/, (request) => {
    const workplace = workplaces.find((item) => item.id === entityId(request.path))
    if (!workplace) throw apiError('WORKPLACE_NOT_FOUND', 'El lugar de trabajo solicitado no existe.', 404)
    return { data: workplace }
  })

  const validateWorkplace = (input: CreateWorkplaceInput | UpdateWorkplaceInput, current?: WorkplaceDetail) => {
    if (!validName(input.name)) throw apiError('INVALID_WORKPLACE_DATA', 'El nombre debe contener entre 1 y 120 caracteres.')
    const client = clients.find((item) => item.id === input.clientId)
    if (!client) throw apiError('CLIENT_NOT_FOUND', 'Seleccioná un cliente existente.', 404)
    if (client.status === 'INACTIVE' && (!current || current.client.id !== client.id)) throw apiError('CLIENT_INACTIVE', 'El cliente está inactivo y no admite nuevas asignaciones.', 409)
    const site = ORGANIZATION_SITES.find((item) => item.id === input.siteId)
    if (!site) throw apiError('INVALID_SITE', 'Seleccioná una provincia habilitada.')
    if (typeof input.latitude !== 'number' || !Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90 || typeof input.longitude !== 'number' || !Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180 || !validInteger(input.radiusMeters, 10, 10_000) || input.gpsAccuracyThreshold !== null && !validInteger(input.gpsAccuracyThreshold, 1, 1_000)) throw apiError('INVALID_GEO_CONFIGURATION', 'Revisá el centro, el radio y la precisión GPS.')
    const name = input.name.trim().replace(/\s+/g, ' ')
    if (workplaces.some((workplace) => workplace.id !== current?.id && workplace.client.id === client.id && workplace.site.id === site.id && normalize(workplace.name) === normalize(name))) throw apiError('WORKPLACE_NAME_ALREADY_EXISTS', 'Ya existe un lugar con ese nombre para el cliente y la provincia.', 409)
    return { client, site, name }
  }

  adapter.register('POST', '/workplaces', (request) => {
    const input = requireBody<CreateWorkplaceInput>(request)
    const valid = validateWorkplace(input)
    const timestamp = now().toISOString()
    const workplace: WorkplaceDetail = { id: crypto.randomUUID(), name: valid.name, client: clientReference(valid.client), site: valid.site, status: 'ACTIVE', shapeType: 'CIRCLE', latitude: input.latitude, longitude: input.longitude, radiusMeters: input.radiusMeters, gpsAccuracyThreshold: input.gpsAccuracyThreshold, createdAt: timestamp, updatedAt: timestamp }
    workplaces.push(workplace)
    return { data: workplace }
  })

  adapter.registerPattern('PUT', /^\/workplaces\/[^/]+$/, (request) => {
    const index = workplaces.findIndex((item) => item.id === entityId(request.path))
    const current = workplaces[index]
    if (!current) throw apiError('WORKPLACE_NOT_FOUND', 'El lugar de trabajo solicitado no existe.', 404)
    const input = requireBody<UpdateWorkplaceInput>(request)
    const valid = validateWorkplace(input, current)
    const updated: WorkplaceDetail = { ...current, name: valid.name, client: clientReference(valid.client), site: valid.site, latitude: input.latitude, longitude: input.longitude, radiusMeters: input.radiusMeters, gpsAccuracyThreshold: input.gpsAccuracyThreshold, updatedAt: now().toISOString() }
    workplaces[index] = updated
    return { data: updated }
  })

  adapter.registerPattern('PATCH', /^\/workplaces\/[^/]+\/status$/, (request) => {
    const index = workplaces.findIndex((item) => item.id === entityId(request.path))
    const current = workplaces[index]
    if (!current) throw apiError('WORKPLACE_NOT_FOUND', 'El lugar de trabajo solicitado no existe.', 404)
    const { status } = requireBody<{ status: EntityStatus }>(request)
    if (status !== 'ACTIVE' && status !== 'INACTIVE') throw apiError('INVALID_WORKPLACE_DATA', 'Seleccioná un estado válido.')
    const updated = { ...current, status, updatedAt: now().toISOString() }
    workplaces[index] = updated
    return { data: updated }
  })
}
