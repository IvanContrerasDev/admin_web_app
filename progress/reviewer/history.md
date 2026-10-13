# History — reviewer

Append-only. Una entrada por tarea cerrada, más reciente arriba.
Formato de entrada:

## YYYY-MM-DD — <id-feature> — <título>
- Qué se hizo: ...
- Veredicto del reviewer: aprobado | cambios requeridos (N rondas)
- Task spec: docs/tasks/NNN-slug.md

## 2026-09-22 — F-009 — Inicio operativo
- Qué se hizo: revisión independiente contra `docs/tasks/009-inicio-operativo.md` y spec §§47–48. Métricas por mes vía servicio con envelope `{data}` y zod; tarjetas enlazan a `/planillas` y `/registros` con query params que los destinos consumen de verdad; `recordsWithAbsence` cuenta días con ausencia conforme a 11.F. Typecheck/lint/62 tests/build en verde.
- Hallazgos menores: propuesta `20260919-f007-f009-...` referenciada pero inexistente y `GET /dashboard/metrics` sin contrato SYNCED (→ F-012); mutaciones de registros no invalidan `['dashboard']` (spec §62) y mes inicial fuera de la URL (→ F-013). Limitación del mock (métricas ignoran registros manuales en runtime) aceptada para mock-first.
- Veredicto del reviewer: aprobado (1 ronda)
- Task spec: docs/tasks/009-inicio-operativo.md

## 2026-09-22 — F-008 — Legajos digitales
- Qué se hizo: revisión independiente contra `docs/tasks/008-legajos-digitales.md` y spec §§38–40 / P-04.E. Los 6 criterios de frontend cumplidos (orden, filtros combinados en URL, lote atómico, edición nombre/tipo, eliminación con confirmación 204, descarga firmada 15 min); 8 tests de servicio.
- Veredicto original: cambios requeridos, condicionado al gate de typecheck que fallaba por `users-page.tsx` ('ALL' fuera del tipo) en el commit 054af7f (renombre Legajos→Documentos). Ese commit ya no está en el árbol: HEAD `4d20511` pasa typecheck/lint/62 tests/build, así que la condición de aprobación se cumple en el estado vigente.
- Hallazgos menores: detalle resuelto con `find()` sobre la página actual sin usar `DocumentsService.get()`; rango de fechas del mock en UTC vs GMT-3 (→ F-013). Observaciones: `expiresAt` de descarga ausente en P-04.E y referencia rota a la propuesta inexistente (→ F-012).
- Veredicto del reviewer: aprobado (1 ronda, condición resuelta por el estado del árbol)
- Task spec: docs/tasks/008-legajos-digitales.md

## 2026-09-22 — F-007 — Planillas
- Qué se hizo: revisión independiente contra `docs/tasks/007-planillas.md`, spec §39 y decisión 11.E. Orden contractual, filtros en URL, carga multi-archivo atómica, cambio de estado, reemplazo con confirmación, descarga firmada 15 min, sin eliminación (§39.5). Validación centralizada en `src/lib/attachments.ts` (20 MiB, 10 archivos). Verificación 4/4 en verde.
- Hallazgos menores: selects de Provincia/Cliente/Lugar/Empleado fuera del `<Form method="get">` (se descartan al buscar); detalle por página actual sin usar `service.get`; blob URLs sin revocar (→ F-013). Referencia rota a la propuesta inexistente (→ F-012).
- Veredicto del reviewer: aprobado (1 ronda)
- Task spec: docs/tasks/007-planillas.md

## 2026-09-22 — F-006 — Matriz mensual y edición/revisión de registros
- Qué se hizo: revisión independiente contra `docs/tasks/006-matriz-mensual-registros.md`, spec Parte 3 (§§59, 65, 66, 82–84), P-01 y decisiones 8/11 con enmienda ratificada. Matriz 28–31 días, sticky headers, scroll acotado, valores iniciales Buenos Aires/San Juan, scroll infinito con snapshot, detalle bajo demanda, alta/corrección con `expectedVersion`, aprobación pura, DELETE de intervalos, `REJECTED` ausente. Verificación 4/4 en verde (62/62).
- Hallazgos menores: snapshot mock sin caducidad ejercitada (410), PATCH rechaza DELETE/ADD sobre WORK OPEN histórico (mock más estricto que el contrato), filtrado de filas antes de injertar registros runtime, total global redondeado a horas (→ F-013). Observación: inconsistencia de tracking (feature_list la marcaba pending con task_spec null) — corregida por el leader el 2026-09-22.
- Veredicto del reviewer: aprobado (1 ronda)
- Task spec: docs/tasks/006-matriz-mensual-registros.md

## 2026-09-22 — F-005 — Clientes, provincias y lugares de trabajo
- Qué se hizo: revisión independiente contra `docs/tasks/005-clientes-lugares.md`, spec §§28–37, P-05, P-07 y decisión humana Google Maps 2026-09-18. 12 criterios cumplidos: carga diferida real (chunk separado), autocomplete restringido a AR que solo centra, selección persistible solo por clic/arrastre/inputs, sin persistir geocoder, degradación controlada, unicidad normalizada, CLIENT_INACTIVE 409, confirmaciones §54. Verificación 4/4 en verde.
- Hallazgos menores: mutar cliente no invalida `['workplaces']` (nombres stale); `requireBody` del mock con código de error genérico; `VITE_GOOGLE_MAPS_API_KEY` sin documentar en `.env.example` (→ F-013). Observaciones para el humano: `min-h-9` vs §55; skeletons §50 (patrón transversal).
- Veredicto del reviewer: aprobado (1 ronda)
- Task spec: docs/tasks/005-clientes-lugares.md

## 2026-09-22 — F-004 — Gestión de empleados
- Qué se hizo: revisión independiente contra `docs/tasks/004-gestion-empleados.md`, contrato P-06 y spec §11.2. Capa de servicios y mock fieles a P-06 (DTOs, rutas, unicidad 409, orden, paginación, contraseña solo en request). Verificación 4/4 en verde.
- Bloqueantes (confirmados en el árbol actual): 1) deep links del detalle usan `?userId=` pero los destinos leen `employeeId` (`user-detail-page.tsx:53` vs `timesheets-page.tsx:28`, `documents-page.tsx:28`) — abren el listado sin filtrar; 2) la tabla omite DNI y teléfono (spec §11.2 y criterio del task). Menores: formulario sin RHF/zod, fecha `2026-09-17` hardcodeada, sin toasts de éxito, estado vacío sin limpiar filtros, búsqueda no controlada, página fuera de rango, inputs de edición no controlados.
- Veredicto del reviewer: cambios requeridos (1 ronda) — correcciones trackeadas en F-011, dependencia de F-010.
- Task spec: docs/tasks/004-gestion-empleados.md

## 2026-09-22 — F-003 — Autenticación y navegación administrativa
- Qué se hizo: revisión independiente contra `docs/tasks/003-autenticacion-navegacion.md`, spec Parte 2 y P-02 (Decisión 9). 8 criterios del incremento A cumplidos: login contractual, challenge 202 sin tokens, 2FA de 6 dígitos, bootstrap sin destello, logout con limpieza, layout en español, rutas lazy; subflujos bloqueados correctamente excluidos. Verificación 4/4 en verde (62/62).
- Hallazgos menores: logout sin catch + advertencia de revocación remota (P-02 §Restauración-5); `safeReturnTo` sin filtrar barras invertidas; sin test de SUPER_ADMIN/rechazo zod; TTL 2FA hardcodeado (→ F-013). Observaciones para el humano: naming "Clientes"/"Documentos" vs §45; chunk principal 548 kB.
- Veredicto del reviewer: aprobado (1 ronda)
- Task spec: docs/tasks/003-autenticacion-navegacion.md
