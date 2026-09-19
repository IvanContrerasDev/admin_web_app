# F-008 — Legajos digitales

**Estado:** in_progress
**App(s):** admin | backend
**Creada:** 2026-09-19

## Contexto

El legajo digital reúne la documentación personal y laboral del empleado (DNI, certificados, contratos, ART, EPP, etc.), cargada por el empleado desde mobile o por administración (spec §40). No se vincula técnicamente con registros ni ausencias. Los límites de archivos, la búsqueda y la descarga firmada están ratificados en la decisión 11.E; los DTOs completos son candidatos que backend debe materializar (P-04.E).

## Alcance

**Incluye:**
- Listado paginado ordenado por fecha de creación descendente.
- Información visible: nombre de archivo, tipo de documento, empleado, usuario que cargó, fecha de carga y última actualización.
- Filtros por empleado, tipo de documento, fecha de carga (rango) y usuario que cargó; búsqueda textual parcial por nombre de archivo y nombre/apellido/legajo del empleado.
- Catálogo de tipos definido en código (no configurable): DNI, certificado médico, contrato, ART, documentación EPP, ficha médica, normas internas, declaración de domicilio y otros.
- Carga administrativa mock-first: empleado, tipo, lugar de trabajo opcional (null) y 1 a 10 archivos por lote atómico, con la misma validación contractual de archivos que planillas.
- Edición del nombre visible y del tipo de documento (`PATCH /documents/{id}`).
- Eliminación con confirmación explícita (`DELETE /documents/{id}`, respuesta 204 sin cuerpo).
- Descarga mediante URL firmada con vencimiento de 15 minutos (mock).
- Servicio y mock contractuales bajo `/api/v1` vía adaptador: `GET/POST /documents`, `GET/PATCH/DELETE /documents/{id}`, `GET /documents/{id}/download`.

**NO incluye:**
- Subida real de bytes ni multipart (F-010 con backend).
- Vencimientos, alertas, versionado, solicitudes de documentación ni flujos de aprobación (spec §40.6).
- Vinculación de certificados con ausencias ni procesamiento de contenido.
- Cambios al contrato sincronizado: DTOs y códigos candidatos en `docs/changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md`.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§38, 40, 49–55 y 81–87.
- Contratos: `docs/arquitectura/contratos-api.md`, decisión 11.E; `docs/changes_proposals/20260917-p04-dtos-y-reglas.md` (P-04.E).
- Código: `src/features/documents`, `src/services/documents-service.ts`, `src/mocks/documents-handlers.ts`, `src/types/documents.ts`, `src/lib/attachments.ts`.

## Criterios de aceptación

- [x] El listado ordena por creación descendente y pagina del lado del servicio.
- [x] Los filtros (empleado, tipo, rango de fechas de carga, cargado por) y la búsqueda parcial se combinan y se reflejan en la URL.
- [x] La carga crea un documento por archivo con el tipo elegido y lugar opcional; un lote inválido no crea nada.
- [x] La edición solo admite nombre visible y tipo; el formato real del archivo no cambia al renombrar.
- [x] La eliminación exige confirmación explícita y quita el documento del listado.
- [x] La descarga devuelve URL con vencimiento de 15 minutos sin persistir URLs.
- [ ] Backend materializa DTOs, multipart y catálogo de errores (propuesta 20260919 pendiente de ratificación).

## Notas de implementación

- `fileName` es el nombre visible editable; `fileExtension` conserva el formato real del archivo y no se modifica al renombrar.
- `workplaceId` es opcional y se persiste como referencia nullable, según la decisión 5 para cargas de contingencia.
- El filtro "cargado por" es textual parcial sobre el nombre del usuario cargador: la spec §40.3 no define un selector de usuarios y el catálogo de uploaders no existe como endpoint.

## Registro de implementación

- Tipos Zod/TypeScript candidatos en `src/types/documents.ts` con catálogo de tipos y labels en español.
- Servicio `DocumentsService` con listado paginado, detalle, creación en lote, edición, eliminación (204) y descarga.
- Mock determinista con 12 documentos semilla, filtros combinados, rango de fechas y búsqueda normalizada.
- UI: listado con filtros en URL, diálogo de carga y diálogo de detalle con edición, eliminación confirmada y descarga.
- Pruebas de servicio: orden, filtros, búsqueda, atomicidad, edición, eliminación y descarga.

## Review

### Ronda 1 — pendiente
- Veredicto: pendiente
- Ítems: revisión a cargo del rol reviewer del harness.
