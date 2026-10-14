# F-011 — Correcciones de revisión: gestión de empleados (F-004)

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-22

## Contexto

La revisión independiente de F-004 (2026-09-22) arrojó veredicto **cambios requeridos** con 2 hallazgos bloqueantes (deep links rotos y columnas faltantes en la tabla) y varios menores. Ambos bloqueantes fueron confirmados sobre el árbol actual (HEAD `4d20511`). Debe resolverse antes de F-010.

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
- Cambios de contrato P-06 (los DTOs ya tienen DNI y teléfono).
- Nuevas funcionalidades de empleados.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §11.2, §51, §53, §72, §90; `docs/tasks/004-gestion-empleados.md`; `docs/changes_proposals/20260917-p06-contrato-empleados.md`.
- Código: `src/features/users/`, `src/services/user-service.ts`, `src/mocks/user-handlers.ts`, `src/types/users.ts`.

## Criterios de aceptación

- [x] "Ver planillas" y "Ver legajo digital" desde el detalle abren los listados filtrados por ese empleado.
- [x] La tabla muestra nombre completo, legajo, DNI, email, teléfono, provincia y estado (desktop y mobile).
- [x] Formulario con RHF + zod, errores por campo; sin fechas hardcodeadas (mock usa `now` inyectado).
- [x] Toasts de éxito en alta/edición/cambio de estado.
- [x] Estado vacío con acción de limpiar filtros; búsqueda sincronizada con la URL; paginación clampeada.
- [x] `npm run typecheck`, `npm run lint`, `npx vitest run` y `npm run build` en verde; tests nuevos/actualizados para lo que aplique.

## Notas de implementación

Veredicto completo de la revisión en `progress/reviewer/history.md` (entrada 2026-09-22 F-004).

## Registro de implementación

- Implementada el 2026-10-13 sin cambios de contratos P-06 ni archivos sincronizados.
- El árbol actual ya enlazaba planillas con `employeeId` y legajo con `/usuarios/:userId/legajo`; se conservaron las rutas activas y se agregaron tests de regresión.
- DNI y teléfono visibles en tabla desktop y tarjetas mobile, conservando los demás datos mínimos.
- Página separada del formulario RHF + Zod; validación de todos los campos, errores inline accesibles y foco en el primer error. El formulario se remonta por UUID al navegar entre empleados.
- Conflictos de unicidad, provincia y contraseña asociados al campo correspondiente. `INVALID_USER_DATA` revalida el esquema o identifica CUIL/fecha de ingreso/puesto cuando el mensaje permite hacerlo; el resto mantiene un error general, sin inventar campos del envelope.
- Fechas no futuras según calendario Argentina: límites UI dinámicos y mock usando `now` inyectado por request. Los timestamps históricos del seed siguen siendo fixtures, no la fecha actual.
- Conservados toasts existentes de alta/edición y agregado éxito de activación/desactivación.
- Estado vacío con "Limpiar filtros", búsqueda remontada al cambiar `search` en la URL, mock clampeado a última página válida y normalización de URL sin agregar historial extra.
- Tests nuevos: validaciones Zod, flujos UI, links, navegación entre empleados, errores por campo, toasts, historial de búsqueda y paginación. Servicio prueba también fechas con reloj inyectado y borde UTC/Argentina.
- Validación: `npm run typecheck`, `npm run lint`, `npx vitest run` (100 pruebas) y `npm run build` exitosos. Se actualizó el test de autenticación existente para confirmar el cierre de sesión, como exige el shell actual.
- Build conserva la advertencia preexistente del chunk principal mayor a 500 kB; fuera del alcance de F-011.
- Verificación en navegador intentada, pero bloqueada por `404 SANDBOX_NOT_FOUND` del enrutamiento del preview, incluso tras comprobar el puerto activo. No se afirma smoke visual/real exitoso.

## Review

Pendiente de revisión independiente por el reviewer del harness. Los checks automáticos no sustituyen su veredicto; falta además completar el smoke en navegador cuando el preview esté disponible.
