# Current — leader

## Tarea activa

F-004 — Gestión de empleados (`docs/tasks/004-gestion-empleados.md`).

## En revisión

F-003 — Autenticación y navegación administrativa: incremento A entregado, `pending_review`; no existe veredicto independiente porque `kimi --agent reviewer` no está disponible en este entorno.

## Haciendo ahora

Contrato de F-004 relevado. La implementación se detuvo en el límite correcto antes de definir DTOs/rutas/mocks no ratificados.

## Hecho

- F-003 movida a `pending_review` por indicación humana.
- F-004 activada y task spec creada.
- Alcance funcional de empleados, prohibiciones y UX de tablas confirmados contra spec y decisión 11.

## Bloqueo contractual

La decisión 11 deja explícitamente pendiente que backend materialice DTOs completos de users, allowlists de filtros/sort, política de contraseña, rutas de escritura y conflictos. `AGENTS.md` obliga a consultar al humano antes de agregar contratos TypeScript. Se requiere decidir si el humano ratifica ahora un contrato frontend concreto o si F-004 espera al backend.
