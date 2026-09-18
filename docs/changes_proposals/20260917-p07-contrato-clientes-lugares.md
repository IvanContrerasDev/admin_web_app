# Propuesta P-07 — Contrato frontend de clientes y lugares de trabajo

**Fecha:** 2026-09-17  
**Origen:** admin_web_app / leader  
**Estado:** ratificada por humano el 2026-09-17
**Alcance:** F-005 — Clientes, provincias y lugares de trabajo

## Objetivo

Desbloquear la implementación mock-first de F-005 con DTOs, rutas, validaciones y errores explícitos, alineables luego con backend. Este documento no modifica archivos `SYNCED-FROM-TEMPLATE` ni autoriza código contractual hasta su ratificación expresa.

## Convenciones

- Base `/api/v1`; éxitos `{ data }` y listados `{ data: [], pagination }`.
- Errores `{ error: { code, message, retryable } }`.
- UUID para identidades; timestamps ISO 8601 UTC.
- Campos de red en inglés; interfaz y mensajes en español.
- Estado común `ACTIVE | INACTIVE`; no hay DELETE ni desactivación en cascada.
- `shapeType` es siempre `CIRCLE`; no se acepta desde formularios para evitar geometrías no soportadas.

## DTOs propuestos

```ts
type EntityStatus = "ACTIVE" | "INACTIVE";
type WorkplaceShapeType = "CIRCLE";

interface SiteReference {
  id: string;
  name: string;
}

interface ClientReference {
  id: string;
  name: string;
  status: EntityStatus;
}

interface ClientListItem extends ClientReference {
  createdAt: string;
  updatedAt: string;
}

type ClientDetail = ClientListItem;

interface CreateClientInput {
  name: string;
}

interface UpdateClientInput {
  name: string;
}

interface WorkplaceListItem {
  id: string;
  name: string;
  client: ClientReference;
  site: SiteReference;
  status: EntityStatus;
  shapeType: WorkplaceShapeType;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  gpsAccuracyThreshold: number | null;
  createdAt: string;
  updatedAt: string;
}

type WorkplaceDetail = WorkplaceListItem;

interface CreateWorkplaceInput {
  clientId: string;
  siteId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  gpsAccuracyThreshold: number | null;
}

interface UpdateWorkplaceInput {
  clientId: string;
  siteId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  gpsAccuracyThreshold: number | null;
}
```

Los formularios de edición envían una representación completa y reemplazable de los campos editables. Estado y `shapeType` usan operaciones separadas. La respuesta siempre devuelve relaciones resueltas para evitar consultas N+1.

## Rutas propuestas

### Clientes

`GET /api/v1/clients`

```ts
interface ClientListQuery {
  search?: string;
  status?: EntityStatus;
  page?: number;      // default 1
  pageSize?: number;  // default 25, máximo 100
}
```

- `search`: coincidencia parcial, case-insensitive y sin exigir acentos exactos sobre `name`.
- Orden fijo server-side: `name ASC`, `id ASC`.
- Respuesta: `{ data: ClientListItem[], pagination: PaginationMeta }`.

Rutas restantes:

- `GET /api/v1/clients/{id}` → `{ data: ClientDetail }`.
- `POST /api/v1/clients` con `CreateClientInput` → `201 { data: ClientDetail }`.
- `PUT /api/v1/clients/{id}` con `UpdateClientInput` → `{ data: ClientDetail }`.
- `PATCH /api/v1/clients/{id}/status` con `{ status: EntityStatus }` → `{ data: ClientDetail }`.

La operación de estado es idempotente. Un cliente puede existir sin lugares. Cambiar su estado no cambia automáticamente el estado de sus lugares.

### Provincias

`GET /api/v1/sites` → `{ data: SiteReference[] }`, seis provincias habilitadas ordenadas por nombre. Sin CRUD en F-005.

### Lugares de trabajo

`GET /api/v1/workplaces`

```ts
interface WorkplaceListQuery {
  search?: string;
  clientId?: string;
  siteId?: string;
  status?: EntityStatus;
  page?: number;      // default 1
  pageSize?: number;  // default 25, máximo 100
}
```

- `search`: coincidencia parcial, case-insensitive y sin exigir acentos exactos sobre `workplace.name`.
- Filtros combinables con AND; UUIDs exactos para cliente/provincia.
- Orden fijo server-side: `name ASC`, `id ASC`.
- Esta es la forma ADMIN plana y paginada; no reutiliza la agrupación destinada a EMPLOYEE/mobile.
- Respuesta: `{ data: WorkplaceListItem[], pagination: PaginationMeta }`.

Rutas restantes:

- `GET /api/v1/workplaces/{id}` → `{ data: WorkplaceDetail }`.
- `POST /api/v1/workplaces` con `CreateWorkplaceInput` → `201 { data: WorkplaceDetail }`.
- `PUT /api/v1/workplaces/{id}` con `UpdateWorkplaceInput` → `{ data: WorkplaceDetail }`.
- `PATCH /api/v1/workplaces/{id}/status` con `{ status: EntityStatus }` → `{ data: WorkplaceDetail }`.

Alta/edición revalidan que cliente y provincia existan. Un cliente `INACTIVE` no admite crear o reasignar lugares; un lugar existente conserva lectura y correcciones históricas. Cambiar cliente/provincia no altera relaciones históricas ya materializadas en registros o planillas.

## Búsqueda de direcciones local

No es contrato del backend ni campo de Workplace. Se utiliza `PlaceAutocompleteElement` de Places API (New), restringido a Argentina.

- Elegir una sugerencia solo centra/encuadra Google Maps; no modifica el DTO ni confirma el centro.
- No se persisten ni envían texto de dirección, Place ID, predicciones, viewport o resultados del geocoder.
- La selección persistible ocurre después mediante clic en mapa, arrastre del marcador o inputs numéricos.
- Sin geocodificación inversa, servicio propio de resultados ni fallback a Nominatim/tiles OSM públicos.

## Validaciones propuestas

- Nombres de cliente y lugar: trim, 1–120 caracteres.
- Unicidad de cliente: nombre normalizado, case-insensitive y sin diferencias solo de espacios; global.
- Unicidad de lugar: nombre normalizado dentro del mismo `clientId` y `siteId`.
- `clientId`, `siteId`: UUID existentes.
- `latitude`: finito entre -90 y 90 inclusive.
- `longitude`: finito entre -180 y 180 inclusive.
- `radiusMeters`: entero entre 10 y 10.000 inclusive.
- `gpsAccuracyThreshold`: `null` o entero entre 1 y 1.000 metros inclusive.
- Alta/edición de lugar exige una ubicación elegida o movida conscientemente; el formulario no guarda un centro inicial arbitrario.

## Errores propuestos

Todos `retryable=false` salvo indisponibilidad transitoria general:

- `404 CLIENT_NOT_FOUND`.
- `404 WORKPLACE_NOT_FOUND`.
- `409 CLIENT_NAME_ALREADY_EXISTS`.
- `409 WORKPLACE_NAME_ALREADY_EXISTS`.
- `409 CLIENT_INACTIVE` cuando se intenta usarlo en una nueva operación.
- `400 INVALID_CLIENT_DATA`.
- `400 INVALID_WORKPLACE_DATA`.
- `400 INVALID_SITE`.
- `400 INVALID_GEO_CONFIGURATION`.

Los errores de configuración, carga o cuota de Google Maps son estados internos de UI; no amplían el envelope del backend ni borran la configuración geográfica existente.

## Inactividad, permisos e invalidaciones

- Lectura/escritura: `ADMIN` y `SUPER_ADMIN`.
- `INACTIVE` bloquea operaciones nuevas, pero conserva listado, detalle e historia.
- Desactivar exige confirmación y backend revalida el estado al procesar.
- No hay cascada ni eliminación. Un cliente inactivo puede conservar lugares activos en datos; esos lugares no quedan seleccionables para nuevas operaciones mientras su cliente siga inactivo.
- Cargas retrospectivas permitidas como corrección histórica siguen la decisión 11 y no se resuelven alterando catálogos.
- Mutar cliente invalida listas/detalle de clientes y selectores de clientes/lugares dependientes. Mutar lugar invalida listas/detalle y selectores de lugares; no invalida datos históricos como si se hubieran reescrito.

## Mapa y operación

- Proveedor/renderizador: Google Maps Platform mediante Maps JavaScript API y Places API (New).
- Carga diferida solo en alta/edición/detalle geográfico.
- Autocomplete restringido a Argentina; seleccionar dirección solo centra la cámara y no cambia el payload.
- Clic o arrastre confirman el centro; Marker y Circle se sincronizan con inputs numéricos accesibles.
- Radio editable mediante slider e input numérico en metros.
- Un error de proveedor no borra centro/radio ya seleccionados.
- No se persisten dirección, Place ID ni resultados del geocoder; atribución nativa de Google visible.
- `VITE_GOOGLE_MAPS_API_KEY` es pública y debe restringirse por HTTP referrer y por API.

## Decisión solicitada

Ratificar P-07 completa como contrato frontend temporal y compromiso de alineación para backend, o solicitar ajustes antes de implementar. En particular, la ratificación confirma: `PUT` completo para edición, unicidades, límites geográficos, forma ADMIN paginada y catálogo de errores.
