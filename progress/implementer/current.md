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

## Autorrevisión — 2026-10-14
- Recuperación de catálogos fallidos mediante Reintentar, sin reiniciar consultas mensuales sanas.
- Paginación automática suspendida tras error de snapshot hasta reinicio explícito.
- Solapamientos históricos intactos preservados; validación compartida UI/mock rechaza solapamientos nuevos o modificados, incluidos anidados.
- Decisiones humanas aprobadas: implementar skeletons ahora, conservar Clientes/Documentos y mínimo desktop de 36 px para controles compactos. Se agregan skeletons accesibles por estructura, conservando errores/reintentos, estados vacíos y feedback de mutaciones; no se reducen controles de 44 px ni se alteran contratos.

## Verificación
- Typecheck, lint, 140 tests (14 archivos) y build correctos; `git diff --check` correcto (+8 regresiones en esta revisión).
- Navegador real Vite 384×588, esquema dark solicitado y tema claro MVP: login/2FA, matriz con minutos, apertura por teclado y corrección de observaciones preservando WORK OPEN histórico. Sin errores de página.
- Reintento de catálogos y suspensión/reinicio de paginación caducada cubiertos por tests de UI; la inducción de catálogo fallido en navegador se recuperó automáticamente y no confirmó allí el botón.

## Ampliación aprobada — skeletons y decisiones UX
- Skeletons transversales por estructura: métricas, tablas/matriz, formularios, detalles, mapas lazy, sesión y metadata/paginación; reduced-motion y anuncios solo accesibles.
- Clientes/Documentos conservados; mínimo desktop de 36 px en capa base sin sobrescribir controles de 44 px.
- Typecheck, lint, build y diff correctos; 153 tests en 15 archivos (+13). Persiste warning de chunk >500 kB.
- Navegador Vite, dark solicitado y tema claro MVP: skeleton de métricas 384×588 y tabla 1280×800 con consultas mock demoradas y posterior resolución; sin errores de página. Mediciones desktop confirman mínimo de 36 px y controles existentes de 44 px sin reducción.

## Pendientes / fuera de alcance
- Revisión independiente de F-013; no se declara aprobación propia.
- Warning de chunk principal >500 kB: ya excluido de F-013, reservado a F-010.
- Limitación aceptada: métricas mock no incorporan cambios de registros runtime.
- Integración real/materialización backend: F-010, no abordada en esta entrega.

## Resultado final
F-013 queda en `pending_review`; evidencia y decisiones de implementación en su task spec. Se conserva la rama existente `v0/implement-f011`.
