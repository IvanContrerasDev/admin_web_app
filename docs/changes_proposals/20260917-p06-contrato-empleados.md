# Propuesta P-06 — Contrato frontend de empleados

**Fecha:** 2026-09-17  
**Origen:** admin_web_app / leader  
**Estado:** ratificada por el humano el 2026-09-17
**Alcance:** F-004 — Gestión de empleados

## Objetivo

Desbloquear la implementación mock-first de F-004 con un contrato explícito, seguro y posteriormente alineable con backend. Este documento no modifica archivos `SYNCED-FROM-TEMPLATE` ni habilita código hasta su ratificación expresa.

## Convenciones

- Base: `/api/v1`; respuestas según decisión 3 (`{ data }` y `{ data: [], pagination }`).
- Errores según decisión 4: `{ error: { code, message, retryable } }`.
- Campos de contrato en inglés; UI y mensajes en español.
- Fechas civiles (`birthDate`, `hireDate`) como `YYYY-MM-DD`; timestamps como ISO 8601 UTC.
- Ninguna respuesta expone password, hash, refresh token ni rol.

## DTOs propuestos

```ts
type AccountStatus = "ACTIVE" | "INACTIVE";

interface SiteReference {
  id: string;
  name: string;
}

interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  dni: string;
  email: string;
  phone: string;
  site: SiteReference;
  accountStatus: AccountStatus;
}

interface UserDetail extends UserListItem {
  address: string;
  birthDate: string;
  cuil: string | null;
  hireDate: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserInput {
  firstName: string;
  lastName: string;
  employeeId: string;
  dni: string;
  email: string;
  initialPassword: string;
  phone: string;
  address: string;
  siteId: string;
  birthDate: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
  siteId?: string;
  birthDate?: string;
  cuil?: string | null;
  hireDate?: string | null;
  position?: string | null;
}
```

PATCH omitido conserva el valor; `null` solo limpia `cuil`, `hireDate` o `position`. Rol, contraseña y estado no forman parte de `UpdateUserInput`.

## Rutas propuestas

### Listado

`GET /api/v1/users`

Query:

```ts
interface UserListQuery {
  search?: string;
  accountStatus?: AccountStatus;
  page?: number;      // default 1
  pageSize?: number;  // default 25, máximo 100
}
```

- `search` parcial y case-insensitive sobre nombre, apellido, email, legajo y DNI.
- Orden server-side fijo: `lastName ASC`, `firstName ASC`, `id ASC`; no se expone sort libre.
- Respuesta: `{ data: UserListItem[], pagination: PaginationMeta }`.

### Detalle

`GET /api/v1/users/{id}` → `{ data: UserDetail }`.

### Alta

`POST /api/v1/users` con `CreateUserInput` → `201 { data: UserDetail }`.

- Crea `ACTIVE`, no exige verificación de email ni cambio de contraseña.
- La contraseña solo viaja en el request y no aparece en ninguna respuesta o caché de query.

### Edición

`PATCH /api/v1/users/{id}` con `UpdateUserInput` → `{ data: UserDetail }`.

### Estado

`PATCH /api/v1/users/{id}/account-status` con `{ accountStatus: AccountStatus }` → `{ data: UserDetail }`.

- Operación idempotente: enviar el estado actual devuelve el detalle actual.
- La UI exige confirmación para desactivar; backend revalida permisos y estado al procesar.
- INACTIVE bloquea operaciones nuevas y conserva toda lectura histórica.

### Provincias

`GET /api/v1/sites` → `{ data: SiteReference[] }`, las seis provincias habilitadas ordenadas por nombre. Sin CRUD desde F-004.

## Validaciones propuestas

- `firstName`, `lastName`: trim, 1–100 caracteres.
- `employeeId`: trim, 1–50 caracteres.
- `dni`: solo dígitos, 7–8.
- `email`: trim y lowercase para normalización; formato email, máximo 254.
- `phone`: solo dígitos, 10–13.
- `address`: trim, 1–200.
- `siteId`: UUID existente.
- `birthDate`: fecha válida, no futura.
- `cuil`: null o 11 dígitos.
- `hireDate`: null o fecha válida no futura.
- `position`: null o trim, 1–100.
- `initialPassword`: 12–128 caracteres, permite espacios y Unicode, sin reglas obligatorias de mayúsculas/símbolos; backend rechaza contraseñas comunes o comprometidas. La misma política deberá adoptarse en mobile/backend.

## Errores propuestos

Todos con `retryable=false` salvo indisponibilidad transitoria general:

- `404 USER_NOT_FOUND`.
- `409 USER_EMAIL_ALREADY_EXISTS`.
- `409 USER_DNI_ALREADY_EXISTS`.
- `409 USER_EMPLOYEE_ID_ALREADY_EXISTS`.
- `400 INVALID_USER_DATA` para validación general.
- `400 INVALID_SITE` para provincia inexistente/no habilitada.
- `400 WEAK_PASSWORD` para incumplimiento de política.

La UI vincula conflictos de email/DNI/legajo al campo correspondiente usando `error.code`; no requiere agregar un campo nuevo al envelope común.

## Permisos y límites

- Lectura/escritura: `ADMIN` y `SUPER_ADMIN`.
- No hay endpoint de DELETE, gestión de roles ni reset/lectura de contraseñas en F-004.
- Los deep links a perfil, planillas y legajo usan el UUID `id`; no consultan por DNI o legajo.
- El mock reproduce paginación, filtros, unicidad, validaciones y estado; no simula capacidades fuera del contrato.

## Decisión solicitada

Ratificar P-06 completa como contrato frontend temporal y compromiso de alineación para backend, o solicitar ajustes antes de implementar.
