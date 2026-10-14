# Current — admin

## Tarea activa
F-013 implementada y entregada para revisión independiente (2026-10-13).

## Hecho (esta sesión)
- Correcciones de F-003/F-005/F-006/F-007/F-008/F-009 conforme al alcance de `docs/tasks/013-correcciones-menores-revision.md`.
- Logout con limpieza local, advertencia y reintento de revocación remota; retorno seguro, roles administrativos y vencimiento 2FA real.
- Invalidación de lugares al guardar cliente y de dashboard al mutar registros.
- Snapshots de lectura congelados con TTL fijo de 15 minutos, caducidad 410 y reinicio desde página 1; runtime incorporado antes de filtros; históricos abiertos no tocados preservados en mock/UI; total `h:mm`.
- Filtros de búsqueda de planillas conservados; detalles de planillas/documentos consultados por ID fuera de la página visible; diálogo de documento estable tras cambios de filtros.
- Fechas civiles Argentina para documentos; cleanup de blob de planilla al expirar su vigencia; mes inicial del dashboard reflejado en URL.
- Sin cambios de contratos ratificados, dependencias ni integración real: se mantiene mock-first.

## Verificación
- Typecheck, lint, 132 tests (14 archivos) y build correctos; `git diff --check` correcto.
- Navegador real de preview Vite, 1048×800 dark: login/2FA, mes en URL, filtros de planillas, detalle de documento con lista vacía y edición persistente, logout. Sin errores de página.

## Pendientes / fuera de alcance
- Revisión independiente de F-013; no se declara aprobación propia.
- Warning de chunk principal >500 kB: ya excluido de F-013, reservado a F-010.
- Limitación aceptada: métricas mock no incorporan cambios de registros runtime.
- Integración real/materialización backend: F-010, no abordada en esta entrega.

## Resultado final
F-013 queda en `pending_review`; evidencia y decisiones de implementación en su task spec. Se conserva la rama existente `v0/implement-f011`.
