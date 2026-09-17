import { ServiceError } from '../services/service-error'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import type { ServiceRequest } from '../services/service-adapter'
import type {
  AccountStatus,
  CreateUserInput,
  SiteReference,
  UpdateUserInput,
  UserDetail,
} from '../types/users'

const SITES: SiteReference[] = [
  { id: '11000000-0000-4000-8000-000000000001', name: 'Catamarca' },
  { id: '11000000-0000-4000-8000-000000000002', name: 'La Rioja' },
  { id: '11000000-0000-4000-8000-000000000003', name: 'Mendoza' },
  { id: '11000000-0000-4000-8000-000000000004', name: 'Salta' },
  { id: '11000000-0000-4000-8000-000000000005', name: 'San Juan' },
  { id: '11000000-0000-4000-8000-000000000006', name: 'San Luis' },
]

const NOW = '2026-09-17T12:00:00.000Z'
const seedUsers: UserDetail[] = [
  {
    id: '22000000-0000-4000-8000-000000000001', firstName: 'Lucía', lastName: 'Álvarez', employeeId: 'EMP-018', dni: '32145876', email: 'lucia.alvarez@example.test', phone: '2645550148', site: SITES[4]!, accountStatus: 'ACTIVE', address: 'Av. Libertador 1840', birthDate: '1991-04-12', cuil: '27321458764', hireDate: '2022-02-01', position: 'Supervisora de zona', createdAt: NOW, updatedAt: NOW,
  },
  {
    id: '22000000-0000-4000-8000-000000000002', firstName: 'Tomás', lastName: 'Benítez', employeeId: 'EMP-024', dni: '34781290', email: 'tomas.benitez@example.test', phone: '2615550193', site: SITES[2]!, accountStatus: 'ACTIVE', address: 'Belgrano 625', birthDate: '1988-11-03', cuil: '20347812905', hireDate: '2021-07-19', position: 'Operario', createdAt: NOW, updatedAt: NOW,
  },
  {
    id: '22000000-0000-4000-8000-000000000003', firstName: 'Camila', lastName: 'Castro', employeeId: 'EMP-031', dni: '36904521', email: 'camila.castro@example.test', phone: '2665550121', site: SITES[5]!, accountStatus: 'INACTIVE', address: 'Rivadavia 940', birthDate: '1994-06-25', cuil: null, hireDate: '2023-01-09', position: 'Administrativa', createdAt: NOW, updatedAt: NOW,
  },
  {
    id: '22000000-0000-4000-8000-000000000004', firstName: 'Mateo', lastName: 'Fernández', employeeId: 'EMP-037', dni: '38561904', email: 'mateo.fernandez@example.test', phone: '3875550177', site: SITES[3]!, accountStatus: 'ACTIVE', address: 'Caseros 145', birthDate: '1997-02-18', cuil: null, hireDate: '2024-03-04', position: 'Operario', createdAt: NOW, updatedAt: NOW,
  },
  {
    id: '22000000-0000-4000-8000-000000000005', firstName: 'Valentina', lastName: 'Gómez', employeeId: 'EMP-042', dni: '40123789', email: 'valentina.gomez@example.test', phone: '3835550162', site: SITES[0]!, accountStatus: 'ACTIVE', address: 'República 315', birthDate: '1999-09-09', cuil: '27401237894', hireDate: '2025-01-13', position: 'Operaria', createdAt: NOW, updatedAt: NOW,
  },
  {
    id: '22000000-0000-4000-8000-000000000006', firstName: 'Nicolás', lastName: 'Sosa', employeeId: 'EMP-046', dni: '35678012', email: 'nicolas.sosa@example.test', phone: '3805550188', site: SITES[1]!, accountStatus: 'INACTIVE', address: 'San Nicolás 730', birthDate: '1992-12-14', cuil: null, hireDate: null, position: null, createdAt: NOW, updatedAt: NOW,
  },
]

function apiError(code: string, message: string, status = 400): ServiceError {
  return new ServiceError({ code, message, retryable: false, kind: 'api', status })
}

function requireBody<T>(request: ServiceRequest): T {
  if (!request.body || typeof request.body !== 'object') throw apiError('INVALID_USER_DATA', 'Revisá los datos ingresados.')
  return request.body as T
}

function userIdFrom(path: string): string {
  return path.split('/')[2] ?? ''
}

function toListItem(user: UserDetail) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeId: user.employeeId,
    dni: user.dni,
    email: user.email,
    phone: user.phone,
    site: user.site,
    accountStatus: user.accountStatus,
  }
}

function normalizeRequired(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length >= 1 && normalized.length <= max ? normalized : null
}

function isValidCivilDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > '2026-09-17') return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year!, month! - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day
}

function validateCommon(input: CreateUserInput | UpdateUserInput, users: UserDetail[], currentId?: string) {
  const firstName = normalizeRequired(input.firstName, 100)
  const lastName = normalizeRequired(input.lastName, 100)
  const employeeId = normalizeRequired(input.employeeId, 50)
  const dni = typeof input.dni === 'string' && /^\d{7,8}$/.test(input.dni.trim()) ? input.dni.trim() : null
  const email = typeof input.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) && input.email.trim().length <= 254 ? input.email.trim().toLowerCase() : null
  const phone = typeof input.phone === 'string' && /^\d{10,13}$/.test(input.phone.trim()) ? input.phone.trim() : null
  const address = normalizeRequired(input.address, 200)
  const birthDate = isValidCivilDate(input.birthDate) ? input.birthDate : null
  const site = typeof input.siteId === 'string' ? SITES.find((item) => item.id === input.siteId) : undefined
  const creating = 'initialPassword' in input

  if ((creating || input.firstName !== undefined) && !firstName || (creating || input.lastName !== undefined) && !lastName || (creating || input.employeeId !== undefined) && !employeeId || (creating || input.dni !== undefined) && !dni || (creating || input.email !== undefined) && !email || (creating || input.phone !== undefined) && !phone || (creating || input.address !== undefined) && !address || (creating || input.birthDate !== undefined) && !birthDate) {
    throw apiError('INVALID_USER_DATA', 'Revisá los datos ingresados.')
  }
  if (input.siteId !== undefined && !site) throw apiError('INVALID_SITE', 'Seleccioná una provincia habilitada.')
  if (email && users.some((user) => user.id !== currentId && user.email === email)) throw apiError('USER_EMAIL_ALREADY_EXISTS', 'Ya existe un empleado con ese email.', 409)
  if (dni && users.some((user) => user.id !== currentId && user.dni === dni)) throw apiError('USER_DNI_ALREADY_EXISTS', 'Ya existe un empleado con ese DNI.', 409)
  if (employeeId && users.some((user) => user.id !== currentId && user.employeeId.toLowerCase() === employeeId.toLowerCase())) throw apiError('USER_EMPLOYEE_ID_ALREADY_EXISTS', 'Ya existe un empleado con ese legajo.', 409)

  return { firstName, lastName, employeeId, dni, email, phone, address, birthDate, site }
}

export function registerUserMockRoutes(adapter: MockServiceAdapter, now: () => Date = () => new Date()) {
  const users = seedUsers.map((user) => ({ ...user }))

  adapter.register('GET', '/sites', () => ({ data: SITES }))
  adapter.register('GET', '/users', (request) => {
    const search = String(request.query?.search ?? '').trim().toLocaleLowerCase('es-AR')
    const status = request.query?.accountStatus as AccountStatus | undefined
    const page = Math.max(1, Number(request.query?.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(request.query?.pageSize ?? 25)))
    const filtered = users
      .filter((user) => !status || user.accountStatus === status)
      .filter((user) => !search || [user.firstName, user.lastName, user.email, user.employeeId, user.dni].some((value) => value.toLocaleLowerCase('es-AR').includes(search)))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'es-AR') || a.firstName.localeCompare(b.firstName, 'es-AR') || a.id.localeCompare(b.id))
    const totalItems = filtered.length
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize)
    const start = (page - 1) * pageSize
    return { data: filtered.slice(start, start + pageSize).map(toListItem), pagination: { page, pageSize, totalItems, totalPages } }
  })

  adapter.registerPattern('GET', /^\/users\/[^/]+$/, (request) => {
    const user = users.find((item) => item.id === userIdFrom(request.path))
    if (!user) throw apiError('USER_NOT_FOUND', 'El empleado solicitado no existe.', 404)
    return { data: user }
  })

  adapter.register('POST', '/users', (request) => {
    const input = requireBody<CreateUserInput>(request)
    const valid = validateCommon(input, users)
    if (typeof input.initialPassword !== 'string' || input.initialPassword.length < 12 || input.initialPassword.length > 128) throw apiError('WEAK_PASSWORD', 'La contraseña inicial debe tener entre 12 y 128 caracteres.')
    const timestamp = now().toISOString()
    const user: UserDetail = {
      id: crypto.randomUUID(), firstName: valid.firstName!, lastName: valid.lastName!, employeeId: valid.employeeId!, dni: valid.dni!, email: valid.email!, phone: valid.phone!, site: valid.site!, accountStatus: 'ACTIVE', address: valid.address!, birthDate: valid.birthDate!, cuil: null, hireDate: null, position: null, createdAt: timestamp, updatedAt: timestamp,
    }
    users.push(user)
    return { data: user }
  })

  adapter.registerPattern('PATCH', /^\/users\/[^/]+$/, (request) => {
    const index = users.findIndex((item) => item.id === userIdFrom(request.path))
    const current = users[index]
    if (!current) throw apiError('USER_NOT_FOUND', 'El empleado solicitado no existe.', 404)
    const input = requireBody<UpdateUserInput>(request)
    const valid = validateCommon(input, users, current.id)
    if (input.cuil !== undefined && input.cuil !== null && !/^\d{11}$/.test(input.cuil)) throw apiError('INVALID_USER_DATA', 'El CUIL debe contener 11 dígitos.')
    if (input.hireDate !== undefined && input.hireDate !== null && !isValidCivilDate(input.hireDate)) throw apiError('INVALID_USER_DATA', 'Ingresá una fecha de ingreso válida.')
    const position = input.position === null || input.position === undefined ? input.position : normalizeRequired(input.position, 100)
    if (input.position !== undefined && input.position !== null && !position) throw apiError('INVALID_USER_DATA', 'El puesto debe contener entre 1 y 100 caracteres.')
    const updated: UserDetail = {
      ...current,
      ...(valid.firstName ? { firstName: valid.firstName } : {}), ...(valid.lastName ? { lastName: valid.lastName } : {}), ...(valid.employeeId ? { employeeId: valid.employeeId } : {}), ...(valid.dni ? { dni: valid.dni } : {}), ...(valid.email ? { email: valid.email } : {}), ...(valid.phone ? { phone: valid.phone } : {}), ...(valid.address ? { address: valid.address } : {}), ...(valid.birthDate ? { birthDate: valid.birthDate } : {}), ...(valid.site ? { site: valid.site } : {}),
      ...(input.cuil !== undefined ? { cuil: input.cuil } : {}), ...(input.hireDate !== undefined ? { hireDate: input.hireDate } : {}), ...(input.position !== undefined ? { position: position ?? null } : {}), updatedAt: now().toISOString(),
    }
    users[index] = updated
    return { data: updated }
  })

  adapter.registerPattern('PATCH', /^\/users\/[^/]+\/account-status$/, (request) => {
    const index = users.findIndex((item) => item.id === userIdFrom(request.path))
    const current = users[index]
    if (!current) throw apiError('USER_NOT_FOUND', 'El empleado solicitado no existe.', 404)
    const { accountStatus } = requireBody<{ accountStatus: AccountStatus }>(request)
    if (accountStatus !== 'ACTIVE' && accountStatus !== 'INACTIVE') throw apiError('INVALID_USER_DATA', 'Seleccioná un estado válido.')
    const updated = { ...current, accountStatus, updatedAt: now().toISOString() }
    users[index] = updated
    return { data: updated }
  })
}
