# Propuesta: F-007–F-009 — DTOs de planillas, documentos y métricas

**Fecha:** 2026-10-13
**Origen:** admin_web_app / implementer-admin (F-012)
**Estado:** pendiente
**Ratificación humana:** pendiente; este documento no acredita aprobación ni disponibilidad de API real.
**Responsables:** humano ratifica; leader backend materializa DTOs, transporte y pruebas; orchestrator de GdesProject propaga; leader admin coordina F-010.

El nombre `20260919-...` conserva la referencia histórica de las tareas F-007/F-008/F-009. El artefacto se crea efectivamente el 2026-10-13; no se atribuye ratificación retroactiva.

## Archivo(s) común(es) afectado(s)

- `docs/arquitectura/contratos-api.md` (SYNCED-FROM-TEMPLATE, no editado aquí).
- Materialización externa: `backend_api_gdes/docs/03-contratos-api.md`, `06-integraciones.md` y `07-convenciones.md`.
- Referencias locales: [F-007](../tasks/007-planillas.md), [F-008](../tasks/008-legajos-digitales.md), [F-009](../tasks/009-inicio-operativo.md), [F-012](../tasks/012-propuestas-contrato-pre-f010.md).

## Problema

F-007/F-008/F-009 citaban esta propuesta inexistente. Los servicios mock-first consumen DTOs completos, pero P-04.E solo describe la descarga como `{ data: { downloadUrl } }`, mientras ambos esquemas Zod requieren `expiresAt`. Tampoco está ratificado conservar el estado al reemplazar una planilla ni el alcance provincial de métricas. F-010 necesita contratos ratificados, propagados y materializados, no inferidos del código mock.

Fuentes relevadas: `src/types/timesheets.ts`, `src/types/documents.ts`, `src/types/dashboard.ts`, `src/services/timesheets-service.ts`, `src/services/documents-service.ts`, `src/services/dashboard-service.ts`, sus mocks y `src/lib/attachments.ts`. Reglas funcionales: spec §§38–40, 47–48 y Parte 8; [P-04](20260917-p04-dtos-y-reglas.md); decisiones 5, 8 y 11 del contrato sincronizado.

## Decisiones ya ratificadas (no se reabren)

- Envelopes `{ data }` y listados `{ data: [], pagination }`; errores `{ error: { code, message, retryable } }`, mensajes en español.
- `workplaceId` requerido en planillas; nullable en documentos de contingencia.
- Archivos pdf/jpg/jpeg/png/doc/docx/txt; 20 MiB (20 × 1024 × 1024 bytes) por archivo; hasta 10 por request. Lote atómico con rollback de DB y bucket; backend valida contenido real además de extensión.
- Búsqueda por nombre de archivo y nombre/apellido/legajo del empleado; firma de descarga de 15 minutos, sin persistir URLs vencidas.
- Borrar documento sí; borrar planilla no. Subir archivos no genera registros, OCR ni vínculos con ausencias.
- INACTIVE bloquea operaciones nuevas, conserva lectura histórica y permite cargas retrospectivas como corrección histórica, con revalidación al guardar.
- Cuatro contadores del mes seleccionado y nombres `pendingTimesheets`, `incompleteRecords`, `pendingReviewRecords`, `recordsWithAbsence`. Ausencias cuenta registros con al menos una ABSENCE, no intervalos ni horas.
- `siteId` en matriz mensual filtra por provincia del lugar, no por provincia personal del empleado. La decisión 8 admite el filtro, no impone San Juan como alcance global del dashboard.

## Cambio propuesto

**Todos los DTOs, detalles de transporte y políticas no ratificadas que siguen son candidatos.** Se transcriben los tipos consumidos hoy por el frontend; no se modifican TypeScript, Parte 8 ni archivos sincronizados. UUIDs y timestamps son asignados/validados por backend; no se exponen `fileKey`, secretos ni URLs permanentes.

### A. Referencias, paginación y descarga compartidas

```ts
type FileExtensionCandidate = "pdf" | "jpg" | "jpeg" | "png" | "doc" | "docx" | "txt";
interface NamedReferenceCandidate { id: string; name: string }
interface EmployeeReferenceCandidate {
  id: string; firstName: string; lastName: string; employeeId: string;
}
interface UploaderReferenceCandidate { id: string; firstName: string; lastName: string }
interface PaginationCandidate {
  page: number; pageSize: number; totalItems: number; totalPages: number;
}
interface DownloadCandidate { downloadUrl: string; expiresAt: string }
interface MockFileInputCandidate { fileName: string; fileSizeBytes: number }
```

- Referencias `id`: UUID. **`employeeId` en queries/cargas es UUID del empleado** (`employee.id`); `employee.employeeId` en respuestas es el legajo string. No intercambiar ambos.
- Nombres/referencias requeridos no vacíos; timestamps `createdAt`, `updatedAt`, `expiresAt` ISO 8601 UTC. `fileSizeBytes` entero positivo en respuestas. Resolver explícitamente archivos vacíos: el DTO los rechaza, pero el validador mock de lotes no impone mínimo.
- Paginación candidata: base 1, `pageSize` default 25/máximo 100; totales del conjunto completo filtrado; cero resultados implica `totalPages: 0`. Ratificar comportamiento de página fuera de rango y validación de queries inválidas; no inferirlo de F-011 (otro recurso).
- Enmienda solicitada a P-04.E para **ambas** descargas: `{ data: { downloadUrl, expiresAt } }`, con `expiresAt` obligatorio, calculado por servidor para el vencimiento efectivo de la firma emitida (15 minutos). No es vencimiento del documento.
- Producción devuelve URL HTTPS firmada; el mock acepta blob/URL simulada y no demuestra seguridad ni vencimiento real. Reintentar descarga obtiene firma nueva; no modificar sus parámetros ni guardarla como dato estable. Backend verifica permisos por recurso antes de firmar y evita exponer keys privadas.

Ejemplo de respuesta candidata de descarga para planilla o documento:

```json
{
  "data": {
    "downloadUrl": "https://archivos.example.test/descarga/archivo?firma=ejemplo",
    "expiresAt": "2026-10-13T15:15:00.000Z"
  }
}
```

URL exclusivamente ilustrativa; no endpoint disponible.

### B. Planillas

```ts
type TimesheetStatusCandidate = "PENDING" | "LOADED" | "ERROR";
interface TimesheetCandidate {
  id: string;
  employee: EmployeeReferenceCandidate;
  workplace: NamedReferenceCandidate;
  client: NamedReferenceCandidate;
  site: NamedReferenceCandidate;
  month: number; year: number; sequence: number;
  status: TimesheetStatusCandidate;
  fileName: string; fileExtension: FileExtensionCandidate; fileSizeBytes: number;
  uploadedBy: UploaderReferenceCandidate;
  createdAt: string; updatedAt: string;
}
type TimesheetDetailCandidate = TimesheetCandidate;
interface TimesheetListQueryCandidate {
  search?: string; employeeId?: string; clientId?: string; workplaceId?: string;
  siteId?: string; month?: number; year?: number; status?: TimesheetStatusCandidate;
  page?: number; pageSize?: number;
}
interface CreateTimesheetMockCandidate {
  employeeId: string; workplaceId: string; month: number; year: number;
  files: MockFileInputCandidate[];
}
interface ReplaceTimesheetMockCandidate { file: MockFileInputCandidate }
```

Rutas candidatas relativas a `/api/v1`, consumidas por Admin:

| Método/ruta | Request | Response |
|---|---|---|
| GET `/timesheets` | `TimesheetListQueryCandidate` | `{ data: TimesheetCandidate[], pagination: PaginationCandidate }` |
| GET `/timesheets/{id}` | UUID | `{ data: TimesheetDetailCandidate }` |
| POST `/timesheets` | Mock: `CreateTimesheetMockCandidate`; real: multipart a materializar | `{ data: { created: TimesheetCandidate[] } }` |
| PATCH `/timesheets/{id}/status` | JSON `{ status: TimesheetStatusCandidate }` | `{ data: TimesheetDetailCandidate }` |
| PUT `/timesheets/{id}/file` | Mock: `ReplaceTimesheetMockCandidate`; real: multipart a materializar | `{ data: TimesheetDetailCandidate }` |
| GET `/timesheets/{id}/download` | UUID | `{ data: DownloadCandidate }` |

No se propone DELETE de planillas.

- Orden año DESC, mes DESC, secuencia DESC; desempate UUID ASC del mock **a ratificar** para paginación estable. Mes entero 1–12, año entero >=2000 y secuencia positiva según Zod actual; ratificar límite temporal de año sin inventar un máximo.
- Una planilla por archivo, estado inicial PENDING y secuencia incremental por empleado UUID/lugar/mes/año. Backend debe garantizar unicidad y asignación transaccional frente a cargas simultáneas, no calcular la secuencia en el cliente.
- `site` y `client` corresponden al lugar. Definir si referencias/nombres son históricos o actuales ante cambios organizativos; el mock no resuelve esa política.
- Propuesta explícita **pendiente de ratificación**: reemplazar conserva `status`, ID, secuencia, empleado, lugar, período, `createdAt` y `uploadedBy` de la carga original; actualiza metadata del archivo y `updatedAt`. Es lo que hace el mock; alternativa: volver a PENDING. Ratificar también identidad/auditoría del reemplazador y protección concurrente (no hay version/ETag en el DTO actual).
- UI exige confirmación de eliminación permanente del archivo anterior. Backend valida y publica la nueva versión antes de retirar la anterior; un fallo no deja la planilla sin archivo. No confundir reemplazar archivo con borrar la planilla.

### C. Documentos / legajo digital

```ts
type DocumentTypeCandidate =
  | "DNI" | "MEDICAL_CERTIFICATE" | "CONTRACT" | "ART"
  | "EPP_DOCUMENTATION" | "MEDICAL_RECORD" | "INTERNAL_POLICIES"
  | "ADDRESS_DECLARATION" | "OTHER";
interface DocumentCandidate {
  id: string; fileName: string; type: DocumentTypeCandidate;
  fileExtension: FileExtensionCandidate; fileSizeBytes: number;
  employee: EmployeeReferenceCandidate;
  workplace: NamedReferenceCandidate | null;
  uploadedBy: UploaderReferenceCandidate;
  createdAt: string; updatedAt: string;
}
type DocumentDetailCandidate = DocumentCandidate;
interface CreateDocumentMockCandidate {
  employeeId: string; type: DocumentTypeCandidate;
  workplaceId: string | null; files: MockFileInputCandidate[];
}
interface UpdateDocumentCandidate { fileName?: string; type?: DocumentTypeCandidate }
interface DocumentListQueryCandidate {
  search?: string; employeeId?: string; type?: DocumentTypeCandidate;
  uploadedBy?: string; uploadedFrom?: string; uploadedTo?: string;
  page?: number; pageSize?: number;
}
```

Catálogo candidato fijo y etiquetas UI: DNI; certificado médico; contrato; ART; documentación EPP; ficha médica; normas internas; declaración de domicilio; otros. No se introduce CRUD de tipos.

| Método/ruta | Request | Response |
|---|---|---|
| GET `/documents` | `DocumentListQueryCandidate` | `{ data: DocumentCandidate[], pagination: PaginationCandidate }` |
| GET `/documents/{id}` | UUID | `{ data: DocumentDetailCandidate }` |
| POST `/documents` | Mock: `CreateDocumentMockCandidate`; real: multipart a materializar | `{ data: { created: DocumentCandidate[] } }` |
| PATCH `/documents/{id}` | JSON `UpdateDocumentCandidate` | `{ data: DocumentDetailCandidate }` |
| DELETE `/documents/{id}` | UUID, confirmación UI | HTTP 204 sin cuerpo (excepción explícita al envelope, a ratificar) |
| GET `/documents/{id}/download` | UUID | `{ data: DownloadCandidate }` |

- Orden `createdAt` DESC; desempate UUID ASC del mock a ratificar. Una entidad por archivo, todos con el tipo/lugar elegidos en el lote.
- Edición solo nombre visible/tipo: omitir conserva, null no válido. `fileExtension` y bytes reales no cambian al renombrar. El mock normaliza espacios y admite nombre visible 1–120 caracteres; backend debe ratificar límites/normalización y comportamiento de PATCH vacío.
- `uploadedBy` **query** es hoy texto parcial sobre nombre completo del cargador, no su UUID. Ratificar esta semántica o publicar un contrato alternativo explícito; no hay endpoint de catálogo de cargadores.
- `uploadedFrom`/`uploadedTo`: candidatos de fecha civil YYYY-MM-DD, inclusivos sobre fecha de carga en GMT-3. El mock actual usa recorte UTC, limitación identificada y corrección trackeada en F-013; no elevarla a regla contractual. Backend debe validar fechas reales/rango invertido y convertir sus límites a instantes correctamente.
- No se propone reemplazo/versionado de documentos, aprobación, vencimientos ni enlaces técnicos a ausencias.

### D. Transporte de archivos y errores por materializar

Los bodies `MockFileInputCandidate` contienen **solo metadata**: no representan subida de bytes ni seguridad real. Propuesta de transporte real, pendiente de confirmación backend/humano:

- POST planillas: multipart campos `employeeId` UUID, `workplaceId` UUID, `month`, `year` y partes `files` repetidas (1–10 archivos).
- POST documentos: multipart `employeeId` UUID, `type`, `workplaceId` opcional y partes `files` repetidas. Propuesta: ausencia de `workplaceId` significa null; backend confirma serialización exacta (no enviar el texto literal `"null"` sin acuerdo).
- PUT reemplazo: multipart parte `file` única. Tamaño, extensión y contenido calculados/validados por servidor; no confiar en `fileSizeBytes` declarado por cliente. Respuestas conservan los envelopes completos anteriores.
- Usuario cargador deriva de sesión autorizada, no del body. Admin ADMIN/SUPER_ADMIN requiere autenticación y permisos por recurso; mobile EMPLOYEE deriva identidad propia de sesión, nunca puede elegir otro empleado. Backend debe publicar matriz de permisos mobile/admin y casos históricos/inactivos antes de integración.
- Lote máximo implica hasta 200 MiB más overhead: comprobar límites de proxy/backend y almacenamiento, rollback ante fallos parciales, reintentos sin duplicados y concurrencia. Si el transporte requiere presigned uploads o idempotencia, elevar el contrato alternativo; no reducir límites ni declarar compatibilidad multipart sin prueba.
- Códigos **candidatos relevados en mocks**, no catálogo backend confirmado: 404 `TIMESHEET_NOT_FOUND`/`DOCUMENT_NOT_FOUND`; 422 `TIMESHEET_RELATION_NOT_FOUND`/`DOCUMENT_RELATION_NOT_FOUND`, `INVALID_TIMESHEET_DATA`/`INVALID_DOCUMENT_DATA`, `FILE_TOO_LARGE`, `TOO_MANY_FILES`, `FILE_EXTENSION_NOT_ALLOWED`; 400 `INVALID_MONTH` en métricas. Todos con `retryable: false`. Backend debe acordar además errores de permisos, firma, almacenamiento, duplicación/reintento y concurrencia; no inventarlos en el contrato vigente.
- Búsqueda mock ignora acentos/mayúsculas, normaliza espacios y admite nombre/apellido en ambos órdenes; filtros se combinan por AND. Ratificar normalización/collation y allowlists del servidor, sin filtrar solo la página local.

### E. Métricas del inicio

```ts
interface DashboardMetricsQueryCandidate { month: number; year: number }
interface DashboardMetricsCandidate {
  pendingTimesheets: number;
  incompleteRecords: number;
  pendingReviewRecords: number;
  recordsWithAbsence: number;
}
```

`GET /api/v1/dashboard/metrics?month=9&year=2026` → `{ data: DashboardMetricsCandidate }`. `month/year` obligatorios; mes entero 1–12/año >=2000 según mock; contadores enteros no negativos. No paginación. No se agrega `siteId` al DTO vigente.

| Campo ratificado (11.F) | Conjunto del mes seleccionado |
|---|---|
| `pendingTimesheets` | Cantidad de planillas con `status=PENDING` y período `month/year` coincidente, no por fecha de carga |
| `incompleteRecords` | Cantidad de registros diarios con `recordStatus=INCOMPLETE` |
| `pendingReviewRecords` | Cantidad de registros diarios con `reviewStatus=PENDING`; no incluye MANUAL_LOADED por inferencia |
| `recordsWithAbsence` | Cantidad de registros diarios con >=1 intervalo ABSENCE, cada registro cuenta una vez |

Los registros se seleccionan por su fecha civil GMT-3 dentro del mes, incluyendo registros manuales e históricos autorizados. Contadores independientes pueden solaparse; no se suman como total de registros. Nunca dependen de la página visible. El mock comparte store de planillas, pero métricas de registros provienen de generación determinista y omiten cambios manuales runtime: limitación, no semántica del backend.

#### Coherencia provincial: decisión humana pendiente

Actualmente las métricas son **globales del mes** (`DashboardMetricsQuery` solo lleva month/year). Los enlaces de registros conservan período/filtro, pero la matriz UI exige una provincia y elige San Juan cuando no viene `siteId`. Por tanto, un contador global no garantiza coincidir con el resultado provincial. La decisión 8 ratifica filtro por provincia del lugar, no una provincia obligatoria para `/dashboard/metrics`.

Opciones a decidir (ninguna aplicada en F-012):

1. **Recomendada: scope provincial coherente.** Selector provincial en Inicio; agregar `siteId` UUID a métricas y pasar exactamente la misma provincia a registros y planillas. Todos los contadores se limitan a provincia del lugar (no del empleado). Requiere nueva ratificación del DTO/query y UX.
2. Mantener métricas globales y habilitar destino mensual global real sin provincia. Requiere acordar UX/consulta de matriz global; no asumir que la UI actual ya lo soporta porque el filtro contractual sea opcional.
3. Mantener contador global y destino provincial, con aviso visible y elección explícita de provincia antes de navegar. Ratificar que el acceso no representa necesariamente todo el contador; no presentar equivalencia inexistente.

Recomendación no es aprobación. El alcance de F-012 es elevar esta duda; no implementar una opción sin decisión.

## Impacto por app

- Admin: no cambia código en F-012; adapta servicios/DTOs solo tras ratificación y materialización en F-010 (las correcciones mock de F-013 son independientes).
- Backend: publica contratos de lectura/escritura, almacenamiento, autorización, errores y pruebas. Garantiza atomicidad, secuencias concurrentes y firmas por recurso.
- Mobile: conservar contrato actual hasta coordinar cargas, identidad derivada y catálogo de tipos; ningún cambio implícito desde el mock Admin.
- Orchestrator: solo después de aprobación humana actualiza template y propaga; no editar manualmente el archivo sincronizado local.

## Ratificación solicitada y criterio de desbloqueo F-010

1. Ratificar DTOs completos/envelopes de listas, detalles, lotes, estado, edición y descarga; `expiresAt` obligatorio para ambos recursos y excepción DELETE 204.
2. Elegir política de reemplazo (conservar estado propuesta), metadata de uploader/auditoría y protección concurrente.
3. Ratificar catálogo de 9 tipos, filtros textuales/de fecha GMT-3, normalización/desempates, límites de nombres/fechas y nulabilidad multipart.
4. Elegir alcance provincial coherente de métricas y destinos (E); los cuatro nombres/semánticas temporales ya ratificados se mantienen.
5. Backend aporta transporte viable, permisos, reintentos/atomicidad y catálogo definitivo. Evidencia mínima: lote inválido sin persistencia, tamaño exactamente 20 MiB y superior, 10/11 archivos, secuencias concurrentes, fallo de reemplazo con original intacto, estado preservado si aprobado, renombre sin cambiar formato, descarga a los 15 min/permiso denegado, fecha de carga cerca de medianoche GMT-3, registros con múltiples ausencias, mes vacío y contador/destino provincial concordantes.
6. Humano registra decisiones explícitas; orchestrator propaga; backend materializa y demuestra API de prueba. **Crear esta propuesta no desbloquea F-010.** F-012 puede pasar a revisión documental con propuesta elevada, aunque ratificación llegue después.
