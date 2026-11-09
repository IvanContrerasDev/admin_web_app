# Plan F-017 — A-04 matriz y métricas

Implementer-admin, UNA feature. Ejecución autorizada; no commits ni worktrees. Trabajo de dominio independiente del transporte F-014; validación integrada espera su entrega. No modificar auth, adaptadores, servicios compartidos, catálogos/organización ni app.test.tsx.

1. En src/types/records.ts y pruebas, separar enum de intervalo (NONE/PENDING/APPROVED) del registro (además MANUAL_LOADED). Afirmar rechazo de MANUAL_LOADED en intervalos y aceptación sólo en registro. Alinear metadata scalar y nullables usando contrato/proveedor sin inventar límites aún abiertos.
2. En src/features/records/records-page.tsx y hooks/tests propios, eliminar provincia inicial automática en entradas globales; consulta mensual sin siteId es global. Conservar filtros explícitos del usuario y mes/año. Contrastar GET /records/monthly, schema/pagination/meta/snapshot del proveedor.
3. En src/features/dashboard/dashboard-metric-card.tsx y dashboard-page/tests, asegurar enlaces globales/provinciales a sección global con mismo mes/año y filtro de condición, nunca siteId automático. Contadores conservan alcance provincial. Evitar enlaces anidados al dar enlaces a provincias.
4. En records-service, hooks/UI/tests de matriz, cubrir dos páginas con snapshot único, 410 reinicia página 1 sin mezclar, 409 conserva edición y solicita recargar. expectedVersion obligatorio; no consultar eventos por celda, sólo bajo demanda. Mantener aprobación separada y origen/eventos intactos.
5. Tests de meses 28/29/30/31, vacío, dos páginas, metadata nullable, invalidación de dashboard tras edición/aprobación y evento nuevo. Las pruebas mock no certifican el evento Android real; registrarlo pendiente si falta proveedor/dispositivo.
6. Ejecutar typecheck/lint, suites focalizadas y full vitest/build una vez que no haya npm ci concurrente. Si falla por trabajo ajeno, registrar path/test exacto y verificar propias sin ocultar regresiones.
7. API/navegador/Android sólo con stack/fixture autorizado y sin modificar backend. Registrar evidencia o bloqueo preciso. Completar Registro del spec y estado exclusivo progress/implementer-017/current.md; devolver paths/status.

## Foco de revisión

Entrada global sin provincia; enlaces provinciales conservan período; 410 entre páginas; versión obsoleta 409; enums intervalo/registro. Cada caso requiere prueba en su paso propietario. No ratificar atribución métrica de workplaceId null ni límites de asistencia abiertos.
