# F-004 — Gestión de empleados

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-17

## Contexto

Construir la gestión administrativa de empleados sin exponer roles, contraseñas ni operaciones de borrado. F-003 queda pendiente de revisión independiente; el humano autorizó avanzar este incremento sin considerar F-003 aprobada.

## Alcance

**Incluye:**
- Tabla paginada, densa y accesible con datos mínimos, búsqueda parcial, filtro de estado y orden server-side por apellido/nombre.
- Estados de carga, vacío, error y paginación tradicional.
- Deep links a perfil, planillas y legajo.
- Cuando el contrato quede ratificado: alta de diez campos, edición permitida y activación/desactivación con confirmación.

**NO incluye:**
- Gestión de roles, borrado de empleados o visualización/reset de contraseñas.
- Filtros locales sobre una página como sustituto del backend.
- DTOs, rutas, códigos de conflicto o política de contraseña inventados.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§11, 49–55, 58 y Parte 8.
- Plan: `docs/tasks/001-acuerdos-y-ejecucion-plan.md`, F-004.
- Contratos: `docs/arquitectura/contratos-api.md`, decisiones 1, 3, 4 y 11; P-04.C/D.
- Código: `src/services`, `src/app/router.tsx`, `src/features/modules/module-pages.tsx`.

## Criterios de aceptación

- [ ] Consulta paginada validada mediante la capa de servicios y React Query.
- [ ] Búsqueda y estado viajan como parámetros del servicio; orden fijo apellido/nombre.
- [ ] Tabla muestra nombre completo, legajo, DNI, email, teléfono, provincia y estado.
- [ ] Carga, vacío, error y reintento manual son claros y accesibles.
- [ ] Perfil, planillas y legajo tienen deep links válidos.
- [ ] Alta valida los diez campos y presenta conflictos globales por campo, sin conservar contraseña tras éxito.
- [ ] Edición no ofrece rol ni contraseña.
- [ ] Activación/desactivación solicita confirmación y conserva historia.
- [ ] lint, typecheck, tests, build y smoke real pasan.

## Notas de implementación

P-04 ratificó reglas funcionales, pero la decisión 11 todavía marca como tarea backend materializar el DTO completo de users, allowlists de filtros/sort, rutas de escritura, códigos de unicidad y política de contraseña. Según `AGENTS.md`, agregar o mejorar contratos TypeScript exige consulta humana. No se implementará un mock que convierta candidatos en API ficticia.

El humano eligió adoptar ahora un contrato frontend explícito. La propuesta completa está en `docs/changes_proposals/20260917-p06-contrato-empleados.md` y requiere ratificación expresa antes de escribir tipos, servicios o mocks.

## Registro de implementación

- F-004 activada y límites contractuales relevados.
- Alternativa “contrato frontend” elegida por el humano.
- P-06 redactada con DTOs, rutas, validaciones, política de contraseña y errores propuestos.
- P-06 ratificada expresamente por el humano el 2026-09-17; contrato desbloqueado para implementación mock-first.
- Materializados DTOs Zod/TypeScript y `UserService` para las rutas ratificadas.
- Mock stateful con seis provincias, búsqueda, filtro, paginación, unicidad, validaciones y cambios de estado.
- UI responsive: listado, alta, edición, detalle, links relacionados y confirmación de activación/desactivación.
- Validación automática: typecheck, 25 pruebas y build de producción exitosos.
- Validación real en navegador: listado desktop/mobile, detalle, confirmación y cambio de estado, y formulario de alta.

## Review

Pendiente de revisión independiente. El runtime de reviewer continúa no disponible; no se emitió veredicto sustituto.
