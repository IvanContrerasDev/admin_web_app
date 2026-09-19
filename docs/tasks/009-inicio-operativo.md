# F-009 — Inicio operativo

**Estado:** in_progress
**App(s):** admin | backend
**Creada:** 2026-09-19

## Contexto

La página de Inicio debe mostrar el estado general de la operación como vista rápida de tareas pendientes, no un panel analítico (spec §47). La decisión 11.F ratificó el alcance temporal: contadores del **mes seleccionado** con selector de mes y enlaces a la vista filtrada del mismo período. Los nombres de campos son los ratificados: `pendingTimesheets`, `incompleteRecords`, `pendingReviewRecords`, `recordsWithAbsence`.

## Alcance

**Incluye:**
- Selector de mes (mes y año) con valor inicial del mes corriente en `America/Argentina/Buenos_Aires`, reflejado en la URL.
- Cuatro métricas del mes seleccionado: planillas pendientes (`PENDING`), registros incompletos (`recordStatus = INCOMPLETE`), registros pendientes de validación (`reviewStatus = PENDING`) y registros con al menos una ausencia.
- Cada métrica funciona como acceso rápido a la vista filtrada del mismo período: planillas con `status=PENDING`, registros con `status=INCOMPLETE`, `reviewStatus=PENDING` y `hasAbsence=true`.
- Servicio y mock contractuales para `GET /dashboard/metrics?month&year` con envelope `{ data }`.
- Estados de carga, error con reintento y conservación de los accesos principales existentes.

**NO incluye:**
- Gráficos analíticos, tendencias ni métricas históricas acumuladas (spec §47 y §56).
- Filtro por provincia en métricas: `siteId` no fue ratificado para este endpoint (P-04.F); los contadores son globales del mes y la matriz de registros aplica su provincia por defecto al navegar.
- Cambios al contrato sincronizado: el DTO es candidato en `docs/changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md`.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§47–48, 50–53.
- Contratos: `docs/arquitectura/contratos-api.md`, decisión 11.F; `docs/changes_proposals/20260917-p04-dtos-y-reglas.md` (P-04.F).
- Código: `src/features/dashboard/dashboard-page.tsx`, `src/services/dashboard-service.ts`, `src/mocks/dashboard-handlers.ts`, `src/types/dashboard.ts`.

## Criterios de aceptación

- [x] El selector de mes actualiza las cuatro métricas y se conserva en la URL.
- [x] Los cuatro contadores provienen del servicio y corresponden al mes seleccionado, no a la página visible ni a sumas locales.
- [x] Cada tarjeta enlaza a la vista filtrada del mismo mes y año.
- [x] `recordsWithAbsence` cuenta registros con al menos una ABSENCE, no intervalos ni horas.
- [x] La carga y el error muestran estados dedicados con reintento.
- [ ] Backend materializa `GET /dashboard/metrics` con los nombres ratificados (propuesta 20260919 pendiente).

## Notas de implementación

- El mock de métricas comparte el store de planillas (`createTimesheetsStore` inyectado por `create-service-adapter`), por lo que cargas y cambios de estado se reflejan en el contador. Los contadores de registros se derivan de la generación determinista de la matriz; los registros manuales creados en runtime no se reflejan en las métricas mock (limitación documentada, sin efecto en backend real).
- La coherencia métrica → destino se limita al período: la matriz de registros exige una única provincia y aplica San Juan por defecto (decisión 8), por lo que el contador global puede diferir del listado filtrado por provincia. Se eleva en la propuesta para definición con el humano.

## Registro de implementación

- Tipos y servicio `DashboardService.getMetrics` con validación Zod del envelope.
- Mock `GET /dashboard/metrics` con contadores del mes y validación de mes/año.
- `computeMonthlyRecordMetrics` exportado desde `records-handlers` reutilizando la generación determinista.
- Dashboard con selector de mes, cuatro tarjetas-métrica enlazables y accesos principales conservados.
- Pruebas de servicio: contadores del mes, cambio de período y reflejo de cambios de estado de planillas.

## Review

### Ronda 1 — pendiente
- Veredicto: pendiente
- Ítems: revisión a cargo del rol reviewer del harness.
