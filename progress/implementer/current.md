# Current — admin

## Tarea activa
F-006 — Matriz mensual y edición/revisión de registros (`docs/tasks/006-matriz-mensual-registros.md`).

## Haciendo ahora
Incremento de alta, corrección y aprobación pura mock-first implementado; pendiente revisión independiente y materialización backend.

## Hecho (esta sesión)
- `REJECTED` eliminado del estado de revisión de registros e intervalos, incluidos tipos, filtros, matriz, detalle y fixtures.
- Corrección con identidad inmutable, `expectedVersion` e intervalos ADD/UPDATE/DELETE; el último intervalo no puede eliminarse.
- Aprobación pura separada en `PATCH /records/{id}/review`, sin modificar origen, datos ni intervalos y con incremento de versión.
- Mocks persistentes para conflicto de versión, totales derivados, origen MANUAL y estado MANUAL_LOADED.
- Documentación funcional y propuesta de cambio sincronizado actualizadas con las decisiones humanas.
- Cobertura de servicio para aprobación pura, DELETE y protección del último intervalo.

## Blockers / Preguntas para el humano
- Backend debe materializar y el orchestrator debe propagar la enmienda contractual aprobada al archivo sincronizado y a las demás apps.
- La revisión individual de intervalos queda fuera de alcance porque no se aprobó una ruta separada; no bloquea la aprobación del registro completo.

## Resultado final
Alta, corrección y aprobación quedan listas en modo mock-first; F-006 continúa `in_progress` por propagación/evidencia backend y revisión independiente pendientes.
