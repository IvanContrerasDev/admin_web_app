# F-014 — A-01 Transporte y sesión HTTP

**Estado:** blocked (entrega local aprobada; certificación integral pendiente)
**App(s):** admin
**Creada:** 2026-11-04

## Contexto

La ejecución local A-00–A-05 fue autorizada en el inbox 20261102. El adaptador HTTP pierde `/api/v1`, omite Bearer/CSRF y el challenge exige campos ausentes en backend. Resolver la base común habilita dominios sin declarar F-010 finalizada ni cambiar sus dependencias heredadas.

## Alcance

**Incluye:** composición segura de URL base; JSON/envelopes/204/errores/cancelación; Bearer desde memoria; CSRF preauth y de sesión; challenge real; bootstrap anónimo; renovación por expiración/401 coordinada entre requests y pestañas; limpieza al cerrar sesión y protección ante respuestas tardías. Configuración local mínima con origen explícito y HTTP sin fallback mock.

**NO incluye:** cambios de DTO por inferencia, producción, debilitar Secure/HttpOnly/SameSite/CORS, ratificar fallback sin Web Locks/BroadcastChannel ni política logout offline/recarga. Los casos sin acuerdo se registran como bloqueo parcial y no impiden corregir lo acordado. No tocar otros dominios de producto salvo adaptaciones mínimas necesarias de auth/tests.

## Referencias (fuente de verdad)

- docs/arquitectura/contratos-api.md: Sesión web admin y Convenciones; docs/integracion.md; docs/spec_definition.md; docs/diseno-frontend.md.
- Contrato proveedor sólo lectura: ../backend_api_gdes/docs/03-contratos-api.md y ../backend_api_gdes/docs/04-auth-y-seguridad.md. Código proveedor sólo evidencia de detalles técnicos; si contradice acuerdo, registrar brecha.
- src/services/{http-service-adapter,auth-service,create-service-adapter,service-client,services}.ts; src/features/auth/; src/types/auth.ts; src/app/query-client.ts.
- Plan: docs/tasks/014-transporte-sesion-http-plan.md.

## Criterios de aceptación

- [x] Base con `/api/v1` conserva el prefijo para todo path interno; queries escapadas; HTTP no usa mocks ante fallos.
- [x] Headers Bearer/CSRF correctos y access sólo en memoria; FormData se reserva a F-018 sin serializar bytes aquí. 204, error envelope y abort funcionan.
- [x] Login acepta challenge `{twoFactorRequired,challengeId}` sin exigir expiresAt/message inexistentes ni inventarlos como datos backend; mock/UI compatibles sin afirmar expiración desconocida.
- [x] GET csrf antes de login/2FA y CSRF renovado tras autenticar según protocolo; bootstrap sin sesión es estado anónimo normal. Cookies reales no se sustituyen por almacenamiento JS.
- [x] Una renovación por pestaña y coordinación Web Locks/BroadcastChannel; expiración/401 no repite refresh ambiguo ni OTP; respuestas anteriores no reabren sesión tras logout; limpia Query/cache y cancela requests.
- [x] Tests de prefijo, headers, errores/204/cancelación, bootstrap 401, challenge mínimo, concurrencia/401/refresh ambiguo/logout tardío; npm ci, typecheck, lint, vitest run, build con evidencia fresca.
- [ ] Navegador real con API local: login/2FA/recarga y dos pestañas, cookies/CSRF; si falta stack/fixture/origen, registrar archivo/evidencia y no declarar validación integral ni done.
- [x] Fallback/logout offline aún abiertos quedan explícitos; implementación parcial no ratifica políticas.

## Notas de implementación

Construir sobre React/Vite/Query actuales. No agregar campos de generación de sesión al DTO. Testear carrera refresh/logout con control local de vigencia. Separar prueba unitaria de certificación de cookies en navegador. Una limitación de integración no impide entregar cambios locales comprobables.

## Registro de implementación

Entrega local implementada y aprobada por reviewer independiente; certificación integrada pendiente. **Status del implementer: blocked para cierre integral** por dependencia de proveedor/navegador; no se declara F-010 finalizada ni se autoaprueban F-011/F-013.

- Transporte conserva base `/api/v1`, query escapada, credentials include, errores/envelopes/204/cancelación, no-store auth y rechaza escape del prefijo/origen. HTTP no usa fallback mock; multipart reservado a F-018.
- `AuthService` mantiene access/CSRF únicamente en memoria y provee adaptador compartido para dominios HTTP. CSRF preauth antes de login/verify y renovado al autenticar; challenge mínimo `{twoFactorRequired,challengeId}` aceptado, campos extras opcionales sin TTL inferido. Bootstrap 401 es null normal.
- Refresh single-flight con timeout 15 s, expiración/401 y un solo retry del request protegido; OTP nunca dispara refresh. Cualquier refresh perdido/ambiguo exige relogin, no repetición. Web Locks serializa refresh/logout; locks de presencia enumeran peers, BroadcastChannel exige ack de todos antes de rotar. Peer sin ack 2 s o APIs ausentes falla explícitamente, sin adoptar fallback abierto. Coordinación/credenciales en memoria, sin campo de generación en DTO.
- Logout limpia/cancela Query y requests de inmediato; vigencia local impide reabrir por bootstrap/verify/refresh tardío. Suscripción mantiene UI actualizada tras refresh/logout de otro tab; renovación válida no cancela lecturas en curso. Aviso deja disponible confirmar revocación remota antes de reingresar si la sesión se perdió. Política offline/recarga sigue abierta y no queda ratificada.
- Corregidas las expectativas heredadas del heading de login en `src/app/app.test.tsx`, conservando ambas pruebas funcionales. Fixtures de roles con fecha expirada ajustadas a 2030; no se suprimió cobertura. No se editaron specs/veredictos heredados.
- Configuración local en `.env.http.example`: frontend exacto `http://localhost:5173` (`--strictPort`), API `http://localhost:3000/api/v1`. Cookies Secure/HttpOnly/SameSite no se degradan. Documentación auth local actualizada en integración/diseño frontend.

**Evidencia fresca:** npm ci exit 0; typecheck y lint exit 0; `npx vitest run --maxWorkers=2` **222/222 tests, 28/28 archivos**, exit 0; git diff --check exit 0. `npm run build` exit 0, warning existente de chunk >500 kB (576.01 kB), pendiente F-010. Cobertura nueva de prefijo/query, headers HTTP/CSRF, 204/error/abort, challenge mínimo/UI sin TTL, bootstrap anónimo, expiración/401 concurrentes/retry único, refresh ambiguo/timeout, dos instancias de pestaña y peer suspendido, logout cross-tab, respuestas tardías y limpieza inmediata de cache. Estas pruebas jsdom/fetch controlado no acreditan cookies reales.

**Bloqueo concreto de navegador:** `curl --max-time 3 --silent --show-error http://localhost:3000/health` exit 7 (conexión rechazada). API operativa, cuenta opt-in, correo OTP y fixture B-02/B-03 aún pendientes según `progress/leader/dependencias-integracion.md`; no se fabricaron credenciales ni modificó backend. Sin evidencia real de login/2FA/recarga/dos pestañas/cookies/CSRF. Fallback sin APIs, soporte de navegadores y logout offline/recarga permanecen pendientes de acuerdo. Reviewer evalúa entrega local sin certificar integración completa.

Archivos/decisiones/evidencia detallados: `progress/implementer/current.md`.

## Review

**Veredicto: aprobado** para la entrega local de transporte/sesión (2026-11-04). 0 defectos locales pendientes; cierre integral bloqueado por API/correo/fixtures y prueba de navegador.

Revisión independiente: contraste de código/plan con Sesión web admin y documentación local. Prefijo/origen/query y modo HTTP sin fallback correctos; Bearer/CSRF en memoria y credentials include; 204/envelopes/abort y no-store auth; challenge mínimo sin TTL inventado, CSRF preauth y posterior a autenticación, bootstrap 401 anónimo. Single-flight por pestaña y Web Locks por API: el inventario de locks de presencia exige respuestas explícitas de peers mediante BroadcastChannel; el timeout rechaza, nunca acredita recepción ni permite rotar sin respuesta. El pull obtiene estado vigente antes de decidir otra rotación. 401 protegido admite un retry, OTP no refresca, refresh ambiguo/timeout exige relogin; epoch/AbortController y guards de provider impiden restauración tardía, cancelan requests y limpian Query. No se detectaron pendientes corregibles de este alcance.

Verificación fresca propia: `npx vitest run --maxWorkers=2 --reporter=dot` exit 0, 222/222 en 28 archivos; `npm run typecheck && npm run lint && npm run build` exit 0; `git diff --check` exit 0. Warning existente chunk 576,01 kB queda para F-010; aviso HydrateFallback no falla tests. No se repitió npm ci contra dependencias ya instaladas/verificadas por implementer. Incluye tests de coordinación de dos instancias, peer suspendido, expiración/401 concurrentes, refresh ambiguo, logout tardío y cleanup; esas pruebas son fetch controlado/jsdom y no certifican cookies reales.

Criterios 1–6 y 8 corroborados en entrega local; criterio 7 NO certificado. `curl --max-time 3 --silent --show-error http://localhost:3000/health` informa error 7/conexión rechazada. `progress/leader/dependencias-integracion.md` mantiene B-02/B-03 sin cuenta opt-in, bandeja OTP/fixture operativo. No se ejecutó navegador real ni API/dos pestañas/cookies/CSRF con proveedor. Configuración .env.http.example conserva atributos Secure/HttpOnly/Lax y origen exacto; no garantiza compatibilidad real. Fallback sin APIs, soporte de navegadores y logout offline/recarga permanecen abiertos; el fail-closed local no ratifica una política nueva. Esta aprobación no autoriza cerrar F-010 ni dar la integración por done. Leader conserva ownership de estado y dependencias.
