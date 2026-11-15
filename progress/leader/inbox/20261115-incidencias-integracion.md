# Todos los roles, conflicto de registro y lecturas integradas

## Objetivo y evidencia

El humano confirmó mostrar EMPLOYEE, TO_BE_ADMIN, ADMIN y SUPER_ADMIN, conservando edición/desactivación solo para EMPLOYEE. El proveedor `UsersService.list/detail` hoy excluye roles no empleados. No es evidencia de que la cuenta admin no exista. El filtro San Juan previamente acordado se conserva: todos los roles no significa todas las provincias.

Mobile todavía simula marcaciones/cargas y perfil: `registerService`, `uploadDocumentService`, `documentService` y `PerfilScreen`. Admin DEV consume HTTP; DEMO no comparte DB. La ausencia de esos datos no se corrige solo invalidando caché.

## Trabajo a planificar

1. Integrar listado/detalle de todos los roles y `role` de lectura del contrato común tras entrega backend; identificar el rol en la vista sin habilitar gestión de roles. Mantener filtros provinciales/búsqueda/estado y paginación. Cuentas no EMPLOYEE de solo lectura; backend también debe impedir mutación. Alta continúa creando EMPLOYEE. Revisar consumidores de listados/selectores operativos para no tratar administradores como empleados; no modificar métricas/elegibilidad implícitamente.
2. Investigar el flujo `/register` → código email → `ADMIN_REQUEST_IDENTITY_CONFLICT`. `registration-form.tsx` transforma initialPassword a password, inicia challenge y limpia formulario; `registration-challenge.tsx` solo ofrece verificar/reenvío; `access-ui.tsx` muestra mensaje upstream. Backend compara email normalizado, DNI y legajo después de OTP. Verificar transporte/vínculo de challenge/datos ingresados antes de afirmar defecto. Añadir mensaje accionable y retorno al formulario para solicitud corregida/challenge nuevo, sin contraseñas persistidas, duplicar cuentas, saltar OTP ni mezclar con login 2FA.
3. Validar lecturas reales de registros, planillas y documentos tras escrituras Mobile DEV en la misma API/DB: período y filtros correctos, nueva lectura al actualizar/volver y descarga de bytes. Inspeccionar cache/envelopes solo si el dato existe en backend. No agregar WebSockets o polling por asumir que se pidió tiempo real.
4. Mantener feedback de política compatible en registro/reset, incluidas reglas de neutralidad y contraseñas existentes de solicitud administrativa. No inferir campo desde VALIDATION_ERROR.

## Dependencias y aceptación

Backend amplía lecturas/role sin ampliar permisos de escritura e investiga identidad con datos controlados. Mobile completa operaciones reales M-04/M-06 y modos aislados. Revisar con todos los roles, usuario propio en provincia coincidente, filtros/paginación coherentes y rechazo servidor al editar no empleados. Registro nuevo consistente y empleado existente con identidad/contraseña correctas deben avanzar según contrato; conflictos reales informan cómo corregir, preservan cuentas y no repiten OTP inútilmente. El caso humano continúa sin reproducción de DB; no marcarlo resuelto por pruebas mock.

## Coordinación

Fuente común: `docs/arquitectura/contratos-api.md` (Empleados, feedback de contraseña, solicitud administrativa y aceptación entre consumidores) y `docs/arquitectura/experiencia-usuario.md`. Requisitos acordados pendientes de implementación; evidencia estática no certifica el entorno de la prueba. Este inbox complementa `20261115-mejoras-integracion-*`, no cancela sus pendientes ni la política 8–30.

El leader incorpora la instrucción al backlog/specs propios, reutiliza features existentes y mantiene dependencias y revisión independiente. No se crean tasks desde GdesProject ni se modifican estados/aprobaciones. No Git sin confirmación, no tocar DB manual ni resetear cuentas/volúmenes. Consolidar evidencia vigente en docs locales antes de retirar inbox resuelto.
