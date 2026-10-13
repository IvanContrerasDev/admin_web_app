# F-012 — Propuestas de contrato pendientes pre-integración (planillas, documentos, métricas)

**Estado:** pending
**App(s):** admin
**Creada:** 2026-09-22

## Contexto

Las revisiones independientes de F-007, F-008 y F-009 (2026-09-22) detectaron que los task specs referencian `docs/changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md`, **archivo que no existe**. Según AGENTS.md, agregar/modificar contratos TS exige consulta obligatoria al humano vía propuesta. F-010 exige "contratos ratificados y propagados", así que estas propuestas deben existir y elevarse antes.

## Alcance

**Incluye:**
- Crear la propuesta en `docs/changes_proposals/` con los DTOs candidatos usados por el frontend mock-first:
  - Planillas (`src/types/timesheets.ts`): DTO de planilla, orden año/mes/secuencia, endpoints `GET/POST /timesheets`, `PATCH /timesheets/{id}/status`, `PUT /timesheets/{id}/file`, `GET /timesheets/{id}/download`; decisión "el reemplazo conserva el estado" (mencionada en `docs/tasks/007-planillas.md:28,49` sin artefacto).
  - Documentos/legajos (`src/types/documents.ts`): DTO de documento, 9 tipos, endpoints, descarga firmada 15 min. Incorporar `expiresAt` en la respuesta de descarga (el schema `documentDownloadSchema` lo exige y P-04.E solo propone `{ downloadUrl }`).
  - Métricas de inicio (`src/services/dashboard-service.ts`): DTO de `GET /dashboard/metrics` (4 contadores, semántica de decisión 11.F) y la duda de coherencia contador global vs. matriz filtrada por provincia (mencionada en `docs/tasks/009-inicio-operativo.md:23,43`).
- Corregir las referencias rotas en `docs/tasks/007-planillas.md`, `docs/tasks/008-legajos-digitales.md` y `docs/tasks/009-inicio-operativo.md` para que apunten al archivo real creado.
- Elevar la propuesta al humano para ratificación (queda en `progress/leader/inbox/` o como ítem explícito al humano).

**NO incluye:**
- Modificar `docs/arquitectura/contratos-api.md` (SYNCED; la propagación la hace el orchestrator de GdesProject tras ratificación humana).
- Cambios de código frontend.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` (Parte 8); `docs/arquitectura/contratos-api.md` (decisión 11, P-04.E); propuestas existentes `docs/changes_proposals/20260917-p04-dtos-y-reglas.md`, `20260919-f006-aprobacion-y-eliminacion-intervalos.md`.
- Código: `src/types/timesheets.ts`, `src/types/documents.ts`, `src/services/dashboard-service.ts`, `src/mocks/timesheets-handlers.ts`, `src/mocks/documents-handlers.ts`, `src/mocks/dashboard-handlers.ts`.

## Criterios de aceptación

- [ ] Existe la propuesta con los DTOs candidatos de planillas, documentos (incl. `expiresAt`) y métricas, siguiendo el formato de las propuestas existentes.
- [ ] Las 3 referencias rotas en task specs apuntan al archivo creado.
- [ ] La propuesta queda elevada al humano (registro en `progress/`).
- [ ] Ningún contrato de la Parte 8 ni archivo SYNCED fue modificado.

## Notas de implementación

Tarea documental; la ratificación es humana. La feature puede cerrarse con la propuesta elevada aunque la ratificación llegue después (registrarlo en notes).

## Registro de implementación

(pendiente)

## Review

(pendiente)
