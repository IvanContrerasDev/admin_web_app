# F-013 — Correcciones menores de la revisión independiente (F-003, F-005, F-006, F-007, F-008, F-009)

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-22

## Contexto

La revisión independiente del 2026-09-22 aprobó F-003, F-005, F-006, F-007, F-008 y F-009 con hallazgos menores accionables. Se consolidan aquí para no dejarlos dispersos antes de F-010. Ninguno es bloqueante por sí solo; todos son de bajo esfuerzo.

## Alcance

**Incluye:**

De F-003 (auth/navegación):
- `src/app/app-shell.tsx:79`: manejar el rechazo de la promesa de logout (`.catch()` o estado de error de la mutación); el contrato común de sesión web pide advertir cuando no se confirma la revocación remota.
- `src/features/auth/login-page.tsx:29`: `safeReturnTo` debe rechazar también barras invertidas (allowlist de forma, p. ej. `/^\/(?!\/|\\)/`).
- Tests: rol `SUPER_ADMIN` con acceso idéntico a ADMIN y rechazo por schema zod de rol no administrativo (`src/services/auth-service.ts:13`).
- `src/features/auth/login-page.tsx:174`: derivar el texto de expiración del código 2FA de `challenge.expiresAt` en vez de hardcodear "10 minutos".

De F-005 (clientes/lugares):
- `src/features/organization/client-form-page.tsx:21`: al crear/editar cliente, invalidar también `['workplaces']` (los listados de lugares embeben `client.name`; el contrato común de clientes/lugares lo exige).
- `src/mocks/organization-handlers.ts:45-47`: parametrizar el código de error de `requireBody` por recurso (`INVALID_CLIENT_DATA` vs `INVALID_WORKPLACE_DATA`).
- `.env.example`: documentar `VITE_GOOGLE_MAPS_API_KEY` (comentada).

De F-006 (registros):
- `src/features/records/records-page.tsx:40-42`: total global del encabezado en formato `h:mm`, sin redondeo a horas enteras.
- `src/mocks/records-handlers.ts:299-331,368`: ejercitar la caducidad del snapshot (`410 MONTHLY_SNAPSHOT_EXPIRED`, tema Matriz mensual) para cubrir el flujo de reinicio desde página 1.
- `src/mocks/records-handlers.ts:437`: el PATCH no debe rechazar DELETE/ADD por un WORK OPEN histórico no tocado (tema Registros: los históricos proyectados no se tocan).
- `src/mocks/records-handlers.ts:291,334-349`: injertar los registros creados en runtime antes de filtrar filas por filtros de día.

De F-007 (planillas):
- `src/features/timesheets/timesheets-page.tsx:104-153`: los selects de Provincia/Cliente/Lugar/Empleado están fuera del `<Form method="get">`; al buscar se descartan. Incluirlos como campos ocultos o manejar el submit preservando `searchParams`.
- Detalle de planilla por id con `TimesheetService.get()` en vez de `find()` sobre la página actual (`timesheets-page.tsx:90`), para que un `?timesheetId=` fuera de la página visible abra el diálogo.
- `src/mocks/timesheets-handlers.ts:130-139`: `URL.revokeObjectURL` tras la descarga simulada.

De F-008 (legajos/documentos):
- Detalle de documento por id con `DocumentsService.get()` (`documents-service.ts:43`) en vez de `find()` sobre la página actual (`documents-page.tsx:86`, `employee-documents-page.tsx:60`); evita además el desmontaje abrupto del diálogo cuando la edición saca al documento de los filtros activos.
- `src/mocks/documents-handlers.ts:146-147`: comparar el rango de fechas en horario Argentina (GMT-3), no por fecha UTC (`createdAt.slice(0,10)`).

De F-009 (inicio operativo):
- `src/features/records/record-detail-dialog.tsx:128` y `record-editor-form.tsx:147`: invalidar también `['dashboard']` tras aprobar/editar registros (spec §62: invalidar métricas relacionadas).
- `src/features/dashboard/dashboard-page.tsx:28-29`: reflejar el mes inicial en la URL (paridad con `records-page.tsx:59-65`).

**NO incluye:**
- La integración real permanece fuera de alcance; skeletons sí están incluidos por ampliación humana aprobada.
- Chunk principal >500 kB (code-splitting de vendors): decisión de performance para F-010.
- Flakiness de timing en `src/app/app.test.tsx` (2 tests de login): vigilar; si reaparece, feature dedicada.
- No reabrir naming/densidad: Clientes/Documentos y mínimo desktop 36 px están aprobados; conservar controles existentes de 44 px.
- Limitación documentada del mock de métricas (ignora registros manuales en runtime): aceptada para mock-first.

## Referencias (fuente de verdad)

- Estado y racional vigente en `docs/diseno-frontend.md`; alcance y evidencia de esta revisión en este task spec.
- Docs: `docs/spec_definition.md` §50, §62; `docs/arquitectura/contratos-api.md` temas Matriz mensual, Registros, Sesión web admin y Clientes/lugares.

## Criterios de aceptación

- [x] Cada ítem "Incluye" resuelto o descartado con justificación registrada.
- [x] Tests nuevos/actualizados donde aplique (snapshot expirado, invalidaciones, safeReturnTo).
- [x] `npm run typecheck`, `npm run lint`, `npx vitest run` y `npm run build` en verde.

## Implementación y evidencia actual para revisión

Todos los ítems de corrección están implementados con mocks; detalles de comportamiento actual en [diseño](../diseno-frontend.md). Recuperación de catálogos fallidos reconsulta solo recursos fallidos, sin reiniciar consultas mensuales sanas; un error de snapshot suspende paginación hasta reinicio. Validación compartida conserva históricos intactos y rechaza solapamientos que involucren intervalos nuevos/modificados, incluidos anidados.

Ampliación humana aprobada: skeletons transversales por estructura y reduced-motion; conservar Clientes/Documentos; mínimo desktop 36 px sin reducir controles de 44 px. Decisiones/racional consolidados en diseño/spec; forman parte de esta revisión.

Evidencia de entrega previa (no reejecutada por limpieza documental): typecheck/lint/build/diff correctos y 153 tests/15 archivos al completar skeletons. F-011 agregó después cuatro tests (157 totales reportados). Smoke Vite real: métricas 384×588, tabla 1280×800, placeholders con mock pausado y transición a datos; tema claro incluso con esquema dark del navegador, sin errores de página/overflow desktop. Medición de controles confirma mínimo 36 y existentes de 44. Matriz móvil con minutos, apertura por teclado y corrección de observaciones preservando WORK OPEN histórico comprobadas en navegador. Reintentos de catálogos/caducidad se acreditan por tests UI: la falla inducida en navegador se recuperó antes de observar el botón.

## Review

Pendiente de reviewer independiente. Limitación aceptada del mock: métricas de registros ignoran cambios runtime. Warning de chunk >500 kB e integración real pertenecen a F-010. No se declara aprobación propia.
