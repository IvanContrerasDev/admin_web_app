# Estado actual — implementer admin

## Resultado final

F-014: base local de transporte y sesión implementada; **blocked para cierre integral** por falta de API/correo/fixtures y certificación en navegador. Pendiente reviewer independiente; no autoaprobación ni cambios del backlog/git. Despacho y feedback del leader leídos. Se aplicaron TDD, diagnóstico, verificación y checklist React.

## Archivos de la entrega

- Transporte y wiring: `src/services/http-service-adapter.ts`, `services.ts`, `.env.http.example`.
- Protocolo/sesión: `src/services/auth-service.ts`, `session-coordination.ts`, `src/types/auth.ts`, `src/mocks/auth-handlers.ts`.
- UI/ciclo de vida: `src/features/auth/auth-provider.tsx`, `login-page.tsx`.
- Tests: `src/services/{http-service-adapter,auth-service,web-session,session-coordination}.test.ts`, `src/features/auth/auth-provider.test.tsx`, `src/test/session-browser.ts`, `src/app/app.test.tsx`.
- Documentación local: `docs/integracion.md` (sección transporte/sesión), `docs/diseno-frontend.md` (auth), Registro en `docs/tasks/014-transporte-sesion-http.md` y este estado. No se editaron SYNCED ni producto fuera de auth/transporte.

## Comportamiento y decisiones de implementación

Prefijo `/api/v1` preservado, query escapada, escape del origen/prefijo rechazado; credentials include, JSON/envelopes/204, abort y no-store en auth. Sin fallback HTTP→mock. Multipart sigue en F-018.

Challenge mínimo real admitido, sin TTL/mensaje inventados como backend; UI muestra ayuda propia y sólo muestra vencimiento cuando llegó. CSRF preauth antes de login/verify y autenticado después; access/CSRF únicamente memoria, cookies HttpOnly gestionadas por navegador. Bootstrap 401 devuelve null sin refresh; fixtures auth expiradas se actualizaron a 2030 conservando validación de roles.

AuthService comparte credenciales con todos los dominios HTTP. Refresh single-flight, expiración/401 y un retry máximo del request protegido. OTP no se repite. Refresh tiene timeout 15 s; error/respuesta ambigua invalida y exige relogin sin repetir rotación. Provider renueva anticipadamente, cancela y limpia Query al cerrar, y protege callbacks tardíos con vigencia local. Aviso permite solicitar cierre remoto si la sesión se perdió y la cookie pudiera seguir activa.

Web Locks serializa por API y mantiene locks de presencia por pestaña. Antes de rotar, todos los peers enumerados deben responder por BroadcastChannel; timeout 2 s o APIs ausentes falla cerrado/no reintentable y limpia sesión. Acceso/CSRF y sincronización quedan en memoria, sin campos nuevos DTO o generación común. Logout invalida/cancela de inmediato y serializa revocación online. Respuestas tardías no reabren sesión. Recibir renovación válida de otro tab conserva lecturas en curso; recibir logout las cancela. Mock-first conserva stores locales.

## Verificación fresca

- `npm ci`: exit 0 (261 paquetes).
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run --maxWorkers=2`: **222/222 tests, 28/28 archivos**, exit 0. Suite final serializada tras liberación de F-017. Incluye headers HTTP reales con fetch controlado, 401 bootstrap, challenge UI sin TTL, timeout/refresh ambiguo, expiración, 401 concurrentes/retry único, coordinación entre dos instancias, peer sin ack, logout cross-tab y respuestas tardías, cancelación/limpieza Query. Son pruebas unitarias/jsdom, sin certificar cookies.
- `git diff --check`: exit 0; sólo lectura Git.
- `npm run build`: exit 0; chunk principal 576.01 kB, warning existente >500 kB reservado a F-010.

## Bloqueos y límites vigentes

`curl --max-time 3 --silent --show-error http://localhost:3000/health`: exit 7, conexión rechazada. No existe API local operativa para esta ejecución. `progress/leader/dependencias-integracion.md` y proveedor `progress/leader/integracion-local-entorno.md` confirman cuenta opt-in, correo OTP/fixtures B-02/B-03 pendientes; no se crean credenciales, no se arranca/migra backend desde Admin. Configuración preparada para API `http://localhost:3000/api/v1` y origen exacto `http://localhost:5173` con Vite strictPort; preserve Secure/HttpOnly/Lax. No se ejecutó login/OTP/recarga/dos pestañas con cookies reales.

Fallback sin Web Locks/BroadcastChannel, navegadores soportados y política logout offline/recarga siguen abiertos. El comportamiento actual limpia localmente y ofrece reintento remoto; no garantiza revocación offline ni impide restauración por cookie al recargar sin acuerdo adicional. La decisión de generación de sesión común no se resolvió por el contador privado de vigencia local. F-010 no se cierra por esta entrega.

## Siguiente responsable

Leader/reviewer: revisar entrega local y coordinar proveedor para prueba real de login→2FA→recarga, dos pestañas, renovación/logout, cookies/CORS/CSRF. Los fallos transitorios detectados antes de la suite final ya no están presentes; no conservarlos como bloqueos actuales. No se heredan aprobaciones F-011/F-013.
