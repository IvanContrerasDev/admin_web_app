# Current — leader

## Tarea activa

F-004 — Gestión de empleados (`docs/tasks/004-gestion-empleados.md`).

## En revisión

F-003 — Autenticación y navegación administrativa: incremento A entregado, `pending_review`; no existe veredicto independiente porque `kimi --agent reviewer` no está disponible en este entorno.

## Haciendo ahora

P-06 redactada como contrato frontend explícito para F-004. La implementación permanece detenida hasta ratificación humana expresa.

## Hecho

- F-003 movida a `pending_review` por indicación humana.
- F-004 activada y task spec creada.
- El humano eligió la alternativa de contrato frontend.
- P-06 define DTOs seguros, rutas, paginación/filtros, escrituras, estado, validaciones, política de contraseña y catálogo de errores.

## Bloqueo contractual

Ratificar o ajustar `docs/changes_proposals/20260917-p06-contrato-empleados.md`. Según `AGENTS.md`, no se escribirán contratos TypeScript, servicios ni mocks antes de esa aprobación.
