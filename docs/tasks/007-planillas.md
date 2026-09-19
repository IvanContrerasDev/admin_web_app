# F-007 — Planillas

**Estado:** in_progress
**App(s):** admin | backend
**Creada:** 2026-09-19

## Contexto

Las planillas de horas son el soporte documental del control de asistencia: la administración las consulta y luego carga manualmente los registros. La carga no genera registros ni procesamiento automático (spec §§38–39). Los límites de archivos, la búsqueda y la descarga firmada ya fueron ratificados en la decisión 11.E; los DTOs completos son candidatos que backend debe materializar (P-04.E).

## Alcance

**Incluye:**
- Listado paginado con orden contractual: año descendente, mes descendente, número de planilla (secuencia) descendente.
- Información visible: empleado, lugar de trabajo, cliente, provincia, mes, año, número de planilla, estado, archivo, fecha de carga y usuario que cargó.
- Filtros por empleado, cliente, lugar de trabajo, provincia, período (mes y año) y estado; búsqueda textual parcial por nombre de archivo y nombre/apellido/legajo del empleado.
- Carga administrativa mock-first: empleado, lugar, mes, año y 1 a 10 archivos por lote atómico; estado inicial `PENDING`; secuencia incremental por combinación empleado–lugar–mes–año.
- Validación contractual de archivos: extensiones pdf/jpg/jpeg/png/doc/docx/txt, 20 MiB (20 × 1024 × 1024 bytes) por archivo, lote atómico (si algo falla, no se crea nada).
- Cambio de estado `PENDING`/`LOADED`/`ERROR` desde el detalle.
- Reemplazo del archivo con confirmación explícita de eliminación permanente del anterior.
- Descarga mediante URL firmada con vencimiento de 15 minutos (`{ data: { downloadUrl, expiresAt } }`, mock).
- Servicio y mock contractuales bajo `/api/v1` vía adaptador: `GET/POST /timesheets`, `GET /timesheets/{id}`, `PATCH /timesheets/{id}/status`, `PUT /timesheets/{id}/file`, `GET /timesheets/{id}/download`.

**NO incluye:**
- Subida real de bytes ni multipart: el mock persiste metadata del archivo; la materialización multipart corresponde a F-010 con backend.
- Eliminación de planillas: prohibida en el MVP (spec §39.5).
- Procesamiento OCR, generación automática de registros ni vinculación con ausencias.
- Cambios al contrato sincronizado: los DTOs y códigos de error son candidatos documentados en `docs/changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md`.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§38–39, 49–55 y 81–87.
- Contratos: `docs/arquitectura/contratos-api.md`, decisión 11.E; `docs/changes_proposals/20260917-p04-dtos-y-reglas.md` (P-04.E).
- Código: `src/features/timesheets`, `src/services/timesheets-service.ts`, `src/mocks/timesheets-handlers.ts`, `src/types/timesheets.ts`, `src/lib/attachments.ts`.

## Criterios de aceptación

- [x] El listado ordena por año, mes y secuencia descendente y pagina del lado del servicio.
- [x] Los filtros y la búsqueda parcial se combinan y se reflejan en la URL.
- [x] La carga crea una planilla por archivo con secuencia incremental por combinación y estado `PENDING`.
- [x] Un lote con un archivo inválido no crea ninguna planilla (atomicidad).
- [x] El cambio de estado y el reemplazo actualizan `updatedAt`; el reemplazo exige confirmación explícita.
- [x] La descarga devuelve URL con vencimiento de 15 minutos sin persistir URLs.
- [x] No existe acción de eliminación en la interfaz ni en el servicio.
- [ ] Backend materializa DTOs, multipart y catálogo de errores (propuesta 20260919 pendiente de ratificación).

## Notas de implementación

- El reemplazo conserva el estado actual de la planilla: la spec §39.5 no indica cambio de estado y P-04.E dejó la pregunta abierta ("si vuelve a PENDING o conserva estado; no asumir"). Se eligió conservar y se eleva al humano en la propuesta de cambios.
- `uploadedBy` registra al usuario que cargó (empleado vía mobile o administrador); el mock usa la identidad del administrador de sesión para cargas web.
- La validación de lotes se comparte con legajos en `src/lib/attachments.ts` (tamaño, cantidad y extensión), reutilizada también por el mock para simular la validación de backend.

## Registro de implementación

- Tipos Zod/TypeScript candidatos en `src/types/timesheets.ts`.
- Servicio `TimesheetsService` con listado paginado, detalle, creación en lote, cambio de estado, reemplazo y descarga.
- Mock determinista con 10 planillas semilla, secuencias por combinación, filtros combinados y búsqueda normalizada.
- Extensión de `src/lib/attachments.ts` con validación de extensiones contractuales.
- UI: listado con filtros en URL, diálogo de carga con validación local y diálogo de detalle con estado, reemplazo confirmado y descarga.
- Pruebas de servicio: orden, filtros, búsqueda, atomicidad de lote, secuencia, cambio de estado, reemplazo y descarga.

## Review

### Ronda 1 — pendiente
- Veredicto: pendiente
- Ítems: revisión a cargo del rol reviewer del harness.
