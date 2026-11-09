# Plan F-015 — A-02 organización/empleados

Implementer-admin. Ejecución autorizada; sin commits/worktrees. Correcciones de dominio pueden correr en paralelo con F-014 con archivos disjuntos; validación integrada espera transporte, sin editar su lifecycle.

1. Contrastar src/types/users.ts y organization.ts, servicios y filtros con secciones Empleados/Clientes y lugares del contrato, y DTOs reales de proveedor. Agregar pruebas para UUID y nullables laborales, filtros/errores y métodos correctos. Si detalle proveedor contradice acuerdo, registrar brecha sin cambiar requisito.
2. Agregar servicio/schema público de GET /catalogs con sites `{value,label}`. En src/features/auth/registration-form.tsx sustituir userService.listSites por catálogo público, mapeando al formato local de opciones explícitamente. No alterar /sites de formularios Admin ni inventar datos. Cubrir catálogo error/retry/vacío y acceso sin auth.
3. En servicios/queries de organización y usuarios alinear invalidación de listas/detalles y workplaces embebiendo cliente; pruebas de create/update/status HTTP con adapter controlado, sin usar fallback mock.
4. En src/features/organization/workplace-form-page.tsx/workplace-map.tsx verificar coordenadas manuales y radio sin API key. Error/carga del mapa no borra latitude/longitude/radius ni impide guardar dato válido. Prueba UI de error de mapa y alta sin key.
5. Ejecutar typecheck/lint, suites users/organization/registration y full vitest/build. Evidencia fresca en Registro y progress/implementer-015/current.md.
6. Con fixture/API real habilitados por backend, comprobar creación y posterior GET del mismo UUID; usar ese dato en futura prueba Android. No sembrar cuentas/restablecer base backend desde Admin. Registrar archivo de bloqueo si endpoint/fixture no disponibles.

## Foco de revisión

Catálogo público frente a /sites protegido; nullable omitido vs null; UUID frente a legajo; error de mapa preserva coordenadas; invalidación de nombre de cliente en lugares.
