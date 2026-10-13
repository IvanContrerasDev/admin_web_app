# Estado actual — leader admin_web_app

Fecha: 2026-09-22

## Feature activa

Ninguna in_progress. Próximas en la cola (orden sugerido): F-011 (bloqueantes de F-004) → F-013 (menores consolidados) → F-012 (propuestas de contrato, documental) → F-010 (integración real).

## Ronda de revisión independiente 2026-09-22

El reviewer independiente (7 instancias, una por feature) veredictó:

- **Aprobadas:** F-003, F-005, F-006, F-007, F-008, F-009 → `done` en feature_list.json.
  - F-008: el veredicto original fue "cambios requeridos" por un gate de typecheck roto en el commit 054af7f (renombre Legajos→Documentos); ese commit ya no está en el árbol (HEAD `4d20511`, verificación 4/4 en verde), así que la condición de aprobación se cumple.
  - F-006: se corrigió la inconsistencia de tracking (figuraba `pending` con `task_spec: null` pese a estar implementada y con 4 commits).
- **Cambios requeridos:** F-004 → 2 bloqueantes (deep links `userId`→`employeeId`; tabla sin DNI/teléfono) + menores. La implementación inicial se cierra como `done`/`changes_required` y las correcciones se trackean en **F-011**.

## Features nuevas creadas (antes de F-010)

- **F-011** — Correcciones de revisión: gestión de empleados. Task spec: `docs/tasks/011-correcciones-f004-empleados.md`.
- **F-012** — Propuestas de contrato pendientes (planillas/documentos/métricas; la referenciada `20260919-f007-f009-...` no existe). Task spec: `docs/tasks/012-propuestas-contrato-pre-f010.md`.
- **F-013** — 17 correcciones menores consolidadas de F-003/F-005/F-006/F-007/F-008/F-009. Task spec: `docs/tasks/013-correcciones-menores-revision.md`.
- F-010 ahora depende también de F-011, F-012 y F-013.

## Decisiones que quedan para el humano (no bloquean F-011/F-013)

- Naming de módulos: sidebar "Clientes"/"Documentos" vs spec §45 ("Legajos").
- Skeletons de carga (spec §50/§67): desviación transversal, decidir globalmente.
- Áreas de clic `min-h-9` (36 px) en tablas compactadas vs §55 (44 px).
- Ratificar la propuesta de contratos de F-012 cuando se eleve.
- Code-splitting de vendors (chunk principal 548 kB) — puede esperar a F-010.
- Flakiness intermitente de 2 tests de login en `src/app/app.test.tsx` (timing) — vigilar.
