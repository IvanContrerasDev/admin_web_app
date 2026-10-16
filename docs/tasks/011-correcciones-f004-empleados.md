# F-011 — Correcciones de revisión: gestión de empleados (F-004)

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-22

## Contexto

La revisión independiente de F-004 (2026-09-22) arrojó veredicto **cambios requeridos** con 2 hallazgos bloqueantes (deep links rotos y columnas faltantes en la tabla) y varios menores. Los bloqueantes motivaron esta tarea; la implementación actual ya tiene las correcciones descritas abajo. Debe resolverse antes de F-010.

## Alcance

**Incluye:**
- Corrección de los deep links del detalle de empleado: `src/features/users/user-detail-page.tsx:53` usa `?userId=` pero los destinos leen `employeeId` (`timesheets-page.tsx:28`, `documents-page.tsx:28`). Cambiar a `?employeeId=${user.id}` en "Ver planillas" y "Ver legajo digital".
- Tabla de empleados: agregar columnas **DNI** y **teléfono** en desktop y mobile (`src/features/users/users-table.tsx:25-44,61-63`). `UserListItem` ya trae ambos campos (`src/types/users.ts:17,19`). Spec §11.2 (información mínima visible).
- Migrar el formulario de alta/edición a react-hook-form + zod (`user-form-page.tsx`), coherente con la convención del repo (login ya usa `zodResolver`) y spec §90; mapear `INVALID_USER_DATA` por campo cuando sea posible.
- Eliminar la fecha "de hoy" hardcodeada (`user-form-page.tsx:75,84` `max="2026-09-17"`; `src/mocks/user-handlers.ts:77` `'2026-09-17'`). El mock ya recibe `now: () => Date` (línea 106): usarlo.
- Feedback de éxito (toast o mensaje) en alta, edición y cambio de estado de empleado (spec §53/§72).
- Estado vacío del listado con acción "Limpiar filtros" (spec §51, `users-page.tsx:69`).
- Input de búsqueda controlado o sincronizado con `?search=` al navegar atrás/adelante (`users-page.tsx:54`).
- Página fuera de rango: clampear o redirigir a la última página válida (`user-handlers.ts:113-122`).
- Inputs de edición: hacerlos controlados o remontar el form al cambiar de usuario (`user-form-page.tsx`, navegación directa `/usuarios/A/editar` → `/usuarios/B/editar`).

**NO incluye:**
- Cambios de contrato contrato Empleados (los DTOs ya tienen DNI y teléfono).
- Nuevas funcionalidades de empleados.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §11.2, §51, §53, §72, §90; `docs/diseno-frontend.md`; `docs/arquitectura/contratos-api.md` y `docs/integracion.md`.
- Código: `src/features/users/`, `src/services/user-service.ts`, `src/mocks/user-handlers.ts`, `src/types/users.ts`.

## Criterios de aceptación

- [x] "Ver planillas" y "Ver legajo digital" desde el detalle abren los listados filtrados por ese empleado.
- [x] La tabla muestra nombre completo, legajo, DNI, email, teléfono, provincia y estado (desktop y mobile).
- [x] Formulario con RHF + zod, errores por campo; sin fechas hardcodeadas (mock usa `now` inyectado).
- [x] Toasts de éxito en alta/edición/cambio de estado.
- [x] Estado vacío con acción de limpiar filtros; búsqueda sincronizada con la URL; paginación clampeada.
- [x] `npm run typecheck`, `npm run lint`, `npx vitest run` y `npm run build` en verde; tests nuevos/actualizados para lo que aplique.

## Notas de implementación

Veredicto completo de la revisión en `docs/diseno-frontend.md` y criterios activos de esta tarea.

## Implementación y evidencia actual para revisión

Implementada con mocks, sin cambios contractuales. DNI/teléfono visibles desktop/mobile; formulario RHF/Zod por UUID, campos/errores/foco accesibles, fechas Argentina dinámicas con reloj mock inyectado; toasts; búsqueda/historial URL, limpiar filtros y paginación clampeada. Links actuales: planillas `employeeId` UUID y legajo `/usuarios/:userId/legajo`; cubiertos por regresión.

El fallo del catálogo de provincias ya muestra error y Reintentar específico, sin skeleton perpetuo, resultados antiguos ni falso vacío. Tests cubren recuperación y conflictos DNI/legajo/provincia con foco.

Evidencia de la entrega previa (no reejecutada por limpieza documental): 47 pruebas focalizadas, suite completa 157 tests/15 archivos, typecheck/lint/build y diff correctos. Warning de chunk >500 kB reservado a F-010. Smoke Vite real a 384×588/1280×800: login/2FA, DNI/teléfono, búsqueda/vacío/limpiar, detalle a planillas y legajo, alta vacía diez errores/foco Nombre; sin errores de página ni overflow horizontal desktop. Fallo inducido de catálogo no se observó en navegador; su recuperación está acreditada por test UI. Toasts/historial/navegación entre empleados también por tests, no por nuevas mutaciones de navegador.

## Review

Pendiente de reviewer independiente; autorrevisión no equivale a aprobación. El leader conserva ownership de feature_list.json.
