# Estado actual — leader Admin

## Entrega vigente
F-021 y F-022 done, aprobadas por reviewer independiente con 0 ítems. Siete puntos Admin implementados y alineación de contraseña nueva 8–30 Unicode. Evidencia, decisiones actuales y límites en docs/diseno-frontend.md; requisitos en docs/spec_definition.md y UX común. Specs/plans/inbox resueltos retirados tras consolidación. Sin Git, otros repos ni archivos SYNCED modificados por este ciclo.

## Verificación
F-021: 70/70 focales y suite completa290/290 con typecheck/lint/build/diff0; QA Chromium DEMO cinco tamaños 1440×900,1280×480,1024×320,390×640,390×320 acredita paneles estables sin scroll vertical propio y accesos/formulario/submit alcanzables.
F-022: suite305/305 (35 archivos, maxWorkers=1), re-review63/63 y typecheck/lint/build/diff0. QA Chromium preview estable: Mes completo en anchos325–1607CSS sin overflow, tarjeta única clic/desglose/Enter global con período/métrica, Usuarios San Juan/cambio Mendoza sin Todas y Registros Todas persistente tras mes/back/reload+relogin mock. Timeouts bajo concurrencia no reprodujeron al limitar worker. Warning chunk>500kB conserva pendiente F-010.

## Límites y pendientes vigentes
No se certifica recorrido browserDEV autenticado por falta de credenciales/OTP reales; backend+servicio cliente tienen pruebas automatizadas independientes. No Android/otros motores ni creación tras OTP real. F-010/F-014–018 conservan estados, dependencias y pendientes anteriores. Contratos concurrentes mensajes auth/conflictos/todos los roles quedan fuera de este alcance; trabajo ajeno preservado. Inbox LAN/aceptación/runtime previo no resuelto por estas mejoras se mantiene. No hay ciclo implementer/reviewer activo.
