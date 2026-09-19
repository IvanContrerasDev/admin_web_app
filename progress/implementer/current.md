# Current — admin

## Tarea activa
F-006 — Matriz mensual y edición/revisión de registros (`docs/tasks/006-matriz-mensual-registros.md`).

## Haciendo ahora
Incremento B de alta y corrección mock-first implementado; pendiente revisión independiente y materialización backend.

## Hecho (esta sesión)
- Alta manual global y desde celdas `EMPTY` confirmadas.
- Corrección con identidad inmutable, `expectedVersion`, intervalos ADD/UPDATE y sin DELETE.
- Validaciones de WORK completo, rango temporal y solapamiento; ausencia permite extremos opcionales.
- Mocks persistentes para duplicado, conflicto de versión, totales derivados, origen MANUAL y estado MANUAL_LOADED.
- Aviso de cambios sin guardar y recuperación de la versión actual sin sobrescritura.
- Cobertura de servicio para alta, corrección, duplicado, concurrencia y solapamientos.

## Blockers / Preguntas para el humano
- La revisión pura APPROVED/REJECTED y la revisión por intervalo siguen bloqueadas hasta que backend materialice sus rutas exactas. No se sobrecarga `PATCH /records/{id}` para evitar convertir una revisión en corrección manual.
- La verificación visual automática no pudo ejecutarse: el sandbox de `agent-browser` devolvió “Sandbox could not be found” y el Playwright Python local no está instalado. La validación de código continúa con lint, typecheck, tests y build.

## Resultado final
Alta y corrección quedan listas en modo mock-first; F-006 continúa `in_progress` por revisión pura y evidencia backend pendientes.
