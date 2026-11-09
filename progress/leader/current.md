# Estado actual — leader admin

Ejecución A-00–A-05 autorizada por humano el 2026-11-04 y reanudada el 2026-11-05, documentada en docs/integracion.md. No se autoriza ratificar DTOs abiertos. Sin producto escrito por leader, Git ni instalaciones de skills.

## Estado por paquete

- A-00 cerrado: F-011/F-013 y F-012 documental done con reviewer independiente. Specs/inbox heredados resueltos retirados; evidencia consolidada en docs/diseno-frontend.md, docs/integracion.md y backlog. F-010 conserva dependencias, sin cierre integral.
- A-01/F-014: implementación local aprobada por reviewer; backlog pending y review_status approved_local_integral_blocked. Spec/plan activos por certificación API/cookies/dos pestañas pendiente. Progreso progress/implementer/current.md.
- A-04/F-017: implementación local y corrección visual aprobadas independientemente; pending/integral bloqueado. Progreso progress/implementer-017/current.md. Navegación global con mes/año, enums separados, snapshots y métricas runtime documentados; no atribuir provincia a lugar null.
- A-02/F-015 aprobada localmente por reviewer independiente tras corregir carrera catálogo/bootstrap. Backlog pending/approved_local_integral_blocked;241/241 tests ytypecheck/lint/build verdes. API/UUID persistido/navegador/Android pendientes. Gates locales para A-03/A-05 cumplidos sin cerrar integral.
- A-03/F-016 entregada pending_review, estado progress/implementer-016/current.md; revisión independiente preparada en progress/leader/review-016.md. Solicitud/OTP/PENDING, recovery/reset y decisión email. Habilitadores locales aprobados; no ratificar requisitos abiertos.
- A-05/F-018 pending, spec/plan/despacho preparados; siguiente por turno, no tocar transporte simultáneamente.

## Verificación y bloqueos actuales

Entrega nueva F-016 reporta263/263 tests en34archivos, npm ci offline/typecheck/lint/build/diff-check exit0 y smoke navegador mock de pantallas con token; pendiente reviewer. La aprobación independiente local vigente de F-015 corroboró241/241 en31archivos y checks exit0. npm ci exit0 por implementer, sin repetir instalación. Chunk576kB >500 pendiente F-010. Pruebas unitarias/jsdom no certifican cookies, API o Android. F-017 área mínima36px corroborada por CSS compilado; no medición real desktop.

Dependencias reverificadas el 2026-11-05 en progress/leader/dependencias-integracion.md: API localhost:3000/health sin conexión; backend B-01 cerrado pero entorno operativo no levantado, B-02 correo y B-03 fixture/cuenta pendientes, B-04 lugar null/Q-01 pendientes. No sembrar/restablecer credenciales desde Admin ni editar backend.

Fallback sin Web Locks/BroadcastChannel, logout offline/recarga, lecturas/filtros/validaciones documentales precisas, reintento multipart ambiguo y atribución provincial de contingencia siguen abiertos. Carga workplaceId null y enlaces de contadores a vista global están acordados.

## Capacidad y siguiente paso

Revisión inicial Admin cumplida; mobile reactivado para trabajo independiente. A-03 entregada para revisión y A-05 preparada. Reviewer inactivo hasta entrega y turno disponible; coordinar capacidad sin exigir cierre integral del otro repo. Suites completas/build serializadas.

Capacidad actual: F-016 entregada; implementer mobile F-012 ocupa slot y luego corresponde reviewer Admin F-016, según progress/leader/capacidad-mobile.md; no es bloqueo funcional ni motivo de cierre.
