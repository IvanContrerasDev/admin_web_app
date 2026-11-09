# Revisión vigente — 2026-11-05

Skill aplicada: verification-before-completion. Recheck independiente F-015 terminado y aprobado localmente; revisiones locales anteriores conservadas. Backlog/dependencias bajo ownership del leader.

| Entrega | Veredicto | Ítems locales |
|---|---|---|
| F-011 cerrada; docs/diseno-frontend.md | aprobado | 0 |
| F-013 cerrada; docs/diseno-frontend.md | aprobado | 0 |
| F-012 documental consolidada en docs/integracion.md | aprobado documental | 0 |
| docs/tasks/014-transporte-sesion-http.md | aprobado local; integral bloqueado | 0 |
| docs/tasks/017-matriz-metricas-http.md | aprobado local; integral bloqueado | 0 |
| docs/tasks/015-organizacion-empleados-http.md | aprobado local; integral bloqueado | 0 |

F-015 aprobado local, 0 pendientes: /catalogs usa send no ligado a sesión y conserva señal propia; auth/privados mantienen generación/controller/headers y cancelación por logout. Las tres regresiones de bootstrap401+catálogo diferido, cancelación propia y privado/logout con éxito tardío pasan. /sites sigue protegido con Bearer. Sin cambios de coordinación/cookies/CSRF/política offline.

Verificación fresca F-015: suite global241/241 en31 archivos, typecheck/lint/build y diff-check exit0. Chunk576,29 kB warning pendiente F-010. DTOs/métodos/nullables/filtros y retiro de siteId extra contrastados; invalidación workplace detalle y Maps/manuales/radio175 corroborados con tests. API/cuenta opt-in/OTP/fixture no disponibles según dependencias; navegador/API/Android no ejecutados. Criterios1–4 y6 corroborados localmente; criterio5 integral NO certificado. Sin producto/backlog/SYNCED/Git mutados. Slot liberado para reviewer mobile.

F-014: transporte/prefijo/headers, challenge mínimo, CSRF preauth/sesión, bootstrap anónimo, memoria, refresh/401/expiración, generación/cancelación/limpieza y coordinación contrastados con contrato y tests. Locks de presencia enumeran peers, pull exige respuestas explícitas antes de rotar y adopta estado vigente; timeout es rechazo y no evidencia de recepción. No se detectaron defectos locales. Ver Review del spec con criterio 7 explícitamente no certificado. Fallback sin APIs, navegadores y logout offline/recarga siguen abiertos; no se ratifican por esta implementación.

F-011/F-013: resuelto el selector heredado de login conservando pruebas funcionales. Criterios y cobertura local verificados; aprobaciones independientes del cierre de integración.

F-017 recheck aprobado local: enlaces provinciales con inline-flex/min-h-9/min-w-9/padding/foco corrigen el área de acción; destino global/período y enlaces hermanos preservados. CSS compilado confirma caja mínima 2,25 rem por escala actual; no se ejecutó medición real de navegador. Focalizados frescos tras corrección 34/34 en 3 archivos. Diseño/integración ya consolidados para enums/global/runtime, sin nuevos pendientes documentales de ese hallazgo. Criterios integrales API/Android no certificados; bloqueos externos separados del resultado local.

## Evidencia propia vigente

- `npx vitest run --maxWorkers=2 --reporter=dot`: exit 0, 241/241 tests, 31/31 archivos (recheck F-015).
- `npm run typecheck && npm run lint && npm run build`: exit 0. Chunk 576,29 kB warning existente reservado a F-010; aviso de HydrateFallback no falla tests.
- `git diff --check`: exit 0; no mutaciones Git.
- Lectura independiente de código, plan, contratos y docs de F-014; tests de transporte/headers/challenge, expiración/401/retry único, timeout/refresh ambiguo, dos instancias/peer suspendido, logout tardío y cleanup. Tests son unitarios/fetch controlado/jsdom.
- Health API `http://localhost:3000/health` devuelve error curl 7, conexión rechazada. No se ejecutaron navegador real, cookies/CORS/CSRF/OTP o dos pestañas contra API. No se fabricaron credenciales ni se modificó backend.

## Límites y siguiente responsable

Proveedor/leader deben resolver API operativa, B-02 correo/bandeja OTP y B-03 cuenta opt-in/fixture; B-04 contingencia y Q-01 siguen según dependencias. F-010 permanece pendiente. F-014 requiere navegador real antes de cierre integral; entrega local aprobada no satisface automáticamente ese criterio. Leader procesa estados y consolida referencias a las revisiones aprobadas. F-017 mantiene validación API/Android y dependencias externas pendientes. No se repitió npm ci instalado/verificado por implementer ni se atribuyen sus comandos como propios.

Slot de verificación liberado: sin suites/build de reviewer en ejecución; siguiente reviewer mobile.
