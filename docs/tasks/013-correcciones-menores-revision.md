# F-013 — Correcciones menores de la revisión independiente (F-003, F-005, F-006, F-007, F-008, F-009)

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-22

## Contexto

La revisión independiente del 2026-09-22 aprobó F-003, F-005, F-006, F-007, F-008 y F-009 con hallazgos menores accionables. Se consolidan aquí para no dejarlos dispersos antes de F-010. Ninguno es bloqueante por sí solo; todos son de bajo esfuerzo.

## Alcance

**Incluye:**

De F-003 (auth/navegación):
- `src/app/app-shell.tsx:79`: manejar el rechazo de la promesa de logout (`.catch()` o estado de error de la mutación); P-02 §Restauración-5 pide advertir cuando no se confirma la revocación remota.
- `src/features/auth/login-page.tsx:29`: `safeReturnTo` debe rechazar también barras invertidas (allowlist de forma, p. ej. `/^\/(?!\/|\\)/`).
- Tests: rol `SUPER_ADMIN` con acceso idéntico a ADMIN y rechazo por schema zod de rol no administrativo (`src/services/auth-service.ts:13`).
- `src/features/auth/login-page.tsx:174`: derivar el texto de expiración del código 2FA de `challenge.expiresAt` en vez de hardcodear "10 minutos".

De F-005 (clientes/lugares):
- `src/features/organization/client-form-page.tsx:21`: al crear/editar cliente, invalidar también `['workplaces']` (los listados de lugares embeben `client.name`; P-07 lo exige).
- `src/mocks/organization-handlers.ts:45-47`: parametrizar el código de error de `requireBody` por recurso (`INVALID_CLIENT_DATA` vs `INVALID_WORKPLACE_DATA`).
- `.env.example`: documentar `VITE_GOOGLE_MAPS_API_KEY` (comentada).

De F-006 (registros):
- `src/features/records/records-page.tsx:40-42`: total global del encabezado en formato `h:mm`, sin redondeo a horas enteras.
- `src/mocks/records-handlers.ts:299-331,368`: ejercitar la caducidad del snapshot (`410 MONTHLY_SNAPSHOT_EXPIRED`, decisión 8) para cubrir el flujo de reinicio desde página 1.
- `src/mocks/records-handlers.ts:437`: el PATCH no debe rechazar DELETE/ADD por un WORK OPEN histórico no tocado (decisión 11: los históricos proyectados no se tocan).
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
- Skeletons de carga (spec §50/§67): desviación transversal a toda la app; requiere decisión global del humano, no va en esta feature.
- Chunk principal >500 kB (code-splitting de vendors): decisión de performance para F-010.
- Flakiness de timing en `src/app/app.test.tsx` (2 tests de login): vigilar; si reaparece, feature dedicada.
- Naming de módulos "Clientes"/"Documentos" vs spec §45 y áreas de clic `min-h-9` vs §55: decisiones del humano.
- Limitación documentada del mock de métricas (ignora registros manuales en runtime): aceptada para mock-first.

## Referencias (fuente de verdad)

- Veredictos completos en `progress/reviewer/history.md` (entradas 2026-09-22).
- Docs: `docs/spec_definition.md` §50, §62; `docs/arquitectura/contratos-api.md` decisiones 8 y 11, P-02, P-07.

## Criterios de aceptación

- [x] Cada ítem "Incluye" resuelto o descartado con justificación registrada.
- [x] Tests nuevos/actualizados donde aplique (snapshot expirado, invalidaciones, safeReturnTo).
- [x] `npm run typecheck`, `npm run lint`, `npx vitest run` y `npm run build` en verde.

## Notas de implementación

Son 17 ítems independientes y pequeños; conviene resolverlos en una sola pasada con commits separados por feature de origen.

## Registro de implementación

2026-10-13 — Implementación entregada, sin cambios en contratos TypeScript/API ratificados y manteniendo el modo mock-first.

- F-003: logout captura el rechazo, limpia sesión/datos locales incluso ante fallo remoto, evita restauración automática y muestra advertencia persistente con reintento en login; retorno interno rechaza barras invertidas y caracteres de control; ADMIN/SUPER_ADMIN tienen cobertura equivalente y roles no administrativos se rechazan por Zod; vencimiento 2FA mostrado a partir de `expiresAt` en hora Argentina.
- F-005: crear/editar cliente invalida clientes y lugares; cambio de estado ya lo hacía y se conserva; cuerpos inválidos devuelven código específico de cliente/lugar (incluidos PUT y PATCH de estado); clave pública Maps comentada en `.env.example`, con restricciones de referrer/API.
- F-006: total global conserva minutos (`h:mm`); snapshots opacos congelan filas/totales con TTL fijo de 15 minutos, validan filtros/tamaño de página y devuelven 410 no reintentable al caducar; botón Reintentar restablece desde página 1 sin token anterior; registros creados/modificados se injertan antes de filtrar filas y recalculan `matchesFilters`; ADD/DELETE/observaciones conservan WORK OPEN histórico no tocado, tanto en mock como en validación del editor; las escrituras nuevas/modificadas siguen exigiendo extremos y validación de superposición.
- F-007: búsqueda preserva provincia/cliente/lugar/empleado mediante campos ocultos; detalle por ID se obtiene del servicio independientemente de la página visible, con carga/error/reintento/cierre; URLs blob se revocan al terminar sus 15 minutos de vigencia, no antes para no romper el contrato ni la apertura/descarga.
- F-008: listado global y legajo consultan detalle por ID, sin desmontarlo cuando una edición lo excluye de filtros; el legajo verifica pertenencia al empleado; rango inclusivo de fechas comparado por fecha civil Argentina, probado a ambos lados de medianoche UTC/GMT-3.
- F-009: editar/crear/aprobar registros invalida también dashboard; mes inicial/ inválido del dashboard se normaliza en URL con replace preservando otros parámetros.

### Evidencia

- `npm run typecheck`: correcto.
- `npm run lint`: correcto, cero warnings.
- `npx vitest run`: 14 archivos, 132 tests correctos (32 adicionales respecto de los 100 previos).
- `npm run build`: correcto; permanece el warning conocido de chunk principal >500 kB, excluido expresamente de esta feature y reservado a F-010.
- `git diff --check`: correcto.
- Navegador real, preview Vite, 1048×800, esquema dark del usuario: login y vencimiento 2FA, dashboard con mes inicial en URL, búsqueda de planillas preservando los cuatro filtros organizacionales, documento por deep link con listado vacío, edición de tipo sin desmontar diálogo y logout confirmado hacia login. Sin errores de página.
- Regresiones de UI/servicio adicionales: fallo remoto de logout y reintento, SUPER_ADMIN, retorno seguro/válido, invalidación de lugares/métricas, totales con minutos, planillas/documentos fuera de página y detalle inexistente, snapshot fijo/expirado/con filtros distintos/reinicio, runtime y WORK OPEN histórico.

Se mantienen fuera de alcance todas las exclusiones originales, incluida la limitación aceptada del mock de métricas sobre cambios de registros runtime.

## Review

Pendiente de revisión independiente. No se declara aprobación del reviewer.
