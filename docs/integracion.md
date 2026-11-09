# Integración administrativa: diseño y disponibilidad

## Fuente contractual y disponibilidad real

Los acuerdos vigentes y candidatos cross-app se centralizan en [contratos comunes](arquitectura/contratos-api.md). El backend registra autenticación, estructura, empleados/perfil, asistencia/matriz, métricas y archivos en `src/app.module.ts`; `src/main.ts` configura `/api/v1` (health queda fuera), CORS con origen administrativo explícito y credenciales. `backend_api_gdes/docs/03-contratos-api.md` describe el proveedor. Esta evidencia de código no certifica stack local levantado, proveedores/fixtures ni navegador. No se verificó un despliegue remoto.

F-010 sigue pendiente; el frontend opera mock-first. Esta sección describe lo que consume el código para que backend/frontend puedan contrastarlo sin elevar automáticamente un mock a contrato aprobado.

## Transporte y sesión: implementación local y límites

F-014 implementa la base HTTP y la sesión en código, con verificación unitaria; no equivale a certificación de cookies/CORS en navegador ni cierre de F-010.

- `HttpServiceAdapter` conserva `/api/v1`, escapa queries y rechaza escape de origen/prefijo. Usa JSON, `credentials:'include'`, AbortSignal, no-store en auth y manejo de 204/envelopes. HTTP no cae a mocks ante fallos; multipart permanece en A-05/F-018.
- `services.ts` conecta todos los dominios HTTP con el adaptador de `AuthService`: access y CSRF sólo en memoria, Bearer en requests y X-CSRF-Token en mutaciones. El mock-first mantiene sus stores locales; no reemplaza cookies del navegador por storage JS.
- Login/2FA obtienen CSRF preauth; tras verificar obtienen el CSRF autenticado. El challenge acepta `{twoFactorRequired,challengeId}`; message/expiresAt son opcionales y la UI sólo muestra vencimiento si llegó. Bootstrap 401 es estado anónimo normal; no intenta refresh ni OTP automáticamente.
- Renovación single-flight por pestaña ante expiración/401, un único reintento del request protegido y timeout de refresh de 15 s. Respuesta perdida/ambigua invalida la sesión y exige relogin, sin repetir la rotación. Query/cache se limpian al cerrar; epoch local y cancelación impiden restaurar sesiones con respuestas tardías. El aviso de cierre permite solicitar revocación remota antes de volver a ingresar.
- Web Locks serializa rotación/revocación por API; locks de presencia enumeran participantes y BroadcastChannel intercambia estado sólo en memoria. Todos los peers presentes deben responder antes de rotar; peer sin respuesta durante 2 s bloquea sin fallback. La ausencia de APIs también falla explícitamente. Estas barreras locales no agregan campos al DTO ni resuelven la política pendiente de logout offline/recarga.
- Configuración de desarrollo en `.env.http.example`: API `http://localhost:3000/api/v1`, frontend exacto `http://localhost:5173` con Vite `--strictPort`. Requiere el mismo origen en CORS del proveedor y navegador localhost compatible con cookies Secure/HttpOnly/SameSite=Lax. La API local no respondió al health durante F-014; correo/fixtures del proveedor siguen pendientes según `progress/leader/dependencias-integracion.md`. No se probó login/OTP/recarga/dos pestañas con cookies reales.
- Web y backend son proyectos Vercel separados por decisión humana. Los dominios no están fijados: `admin.prolimpservicios.com` es candidato; `backend-gdes.vercel.app` sería cross-site, `api.prolimpservicios.com` same-site/cross-origin. Definir URLs/CSRF/generación y matriz real de navegador; CORS no remedia bloqueo de cookies de terceros. Alternativa same-site/proxy/BFF requiere acuerdo si falla esa matriz.
- `/registro` sólo valida datos; A-02 entregó GET `/catalogs` público con sites value/label convertido explícitamente para el formulario. `/sites` permanece protegido con Bearer. No hay envío de solicitud administrativa, confirmación ni recuperación de contraseña en el router actual. Conservar los flujos aprobados de spec/contrato como requisitos pendientes, incluidos verificación de identidad y protección de cuentas existentes.

## Superficie consumida

| Dominio | Requests del frontend | DTO/evidencia local |
|---|---|---|
| Empleados | GET/POST `/users`, GET/PATCH `/users/:id`, PATCH `/users/:id/account-status`, GET `/sites` | `src/services/user-service.ts`, `src/types/users.ts`; id UUID distinto de employeeId (legajo), relaciones site, campos laborales nullable |
| Organización | GET/POST `/clients`, GET/PUT `/clients/:id`, PATCH status; GET/POST `/workplaces`, GET/PUT detalle, PATCH status | `src/services/organization-service.ts`, `src/types/organization.ts`; ACTIVE/INACTIVE, CIRCLE, radio 10–10000, umbral GPS nullable 1–1000 |
| Registros | GET `/records/monthly`, GET detalle y `/attendance-events/:id`; POST registros, PATCH corrección y `/review` | `src/services/records-service.ts`, `src/types/records.ts`; matriz `{data,pagination,meta}`, snapshots; create usa userId, filtros usan employeeId UUID; expectedVersion en escrituras |
| Planillas | GET/POST `/timesheets`, GET detalle, PATCH status, PUT file, GET download | `src/services/timesheets-service.ts`, `src/types/timesheets.ts`; `{data:{created:[]}}`, PENDING/LOADED/ERROR; descarga requiere downloadUrl/expiresAt |
| Documentos | GET/POST `/documents`, GET/PATCH/DELETE detalle, GET download | `src/services/documents-service.ts`, `src/types/documents.ts`; `{data:{created:[]}}`, DELETE 204; descarga requiere expiresAt |
| Inicio | GET `/dashboard/metrics?month&year` | `src/types/dashboard.ts` exige cuatro contadores y byProvince (id UUID/name/mismos contadores); servicio no envía siteId |

Subidas/reemplazos actuales solo llevan `fileName,fileSizeBytes`: no bytes ni FormData. HTTP serializa JSON; transporte multipart y campos definitivos deben materializarse. No afirmar carga real R2 ni borrado remoto por los blobs mock.

Los nueve tipos actuales del mock son DNI, MEDICAL_CERTIFICATE, CONTRACT, ART, EPP_DOCUMENTATION, MEDICAL_RECORD, INTERNAL_POLICIES, ADDRESS_DECLARATION, OTHER. INTERNAL_POLICIES es una brecha respecto de INTERNAL_RULES ratificado; corregir en A-05. No inventar otros mappings a persistencia backend/mobile. Revisión de registros usa NONE/PENDING/APPROVED/MANUAL_LOADED sin REJECTED; estados de intervalos OPEN/SEMI_CLOSED/CLOSED y origen AUTOMATIC/MANUAL.

A-04 entregó enums separados: MANUAL_LOADED sólo en registro, intervalos NONE/PENDING/APPROVED. Los detalles/eventos conservan metadata escalar e intervalId nullable. Revisión independiente y certificación API/Android aún pendientes. La persistencia/backend no autoriza traducir silenciosamente campos de transporte; verificar DTOs reales sin reabrir acuerdos vigentes.

## Acuerdos y evidencia pendientes

F-012 entrega documental aprobada por reviewer independiente; no representa ratificación humana de candidatos. El contrato común vigente ya acuerda expiresAt, byProvince, INTERNAL_RULES, multipart 1–10/20 MiB, reemplazo con identidad conservada y vuelta a PENDING por expectedVersion, secuencia empleado–lugar–mes–año, edición de tipo/nombre documental y navegación global. La propuesta temporal conserva únicamente puntos abiertos hasta resolución/sync por orchestrator: filtros/permisos/validaciones documentales precisos, semántica de reintento multipart ambiguo y atribución métrica de contingencia. No aplicar como acuerdo antiguo la preservación de estado al reemplazar.

La navegación ratificada conserva mes/año y abre siempre la vista global, desde contadores globales y provinciales, sin provincia automática. El usuario filtra después. La implementación local A-04 entregada adopta navegación global sin provincia inicial y enlaces provinciales hermanos; falta revisión independiente/certificación API y Android. El código no sustituye el acuerdo. La atribución provincial de cargas de contingencia con lugar null sigue pendiente; no inventar lugar o provincia.

Backend debe entregar DTOs/envelopes/nullables/roles/errores y pruebas: matriz bisiesta/31 días/vacía/dos páginas/mutación concurrente, snapshot 410 y mismatch 400; conflictos 409 de duplicado/versión y unicidades; inactivos preservando historia; aprobación sin alterar origen/eventos; atomicidad/secuencia de archivos, descarga 15 min, reemplazo/eliminación R2 y errores. `HttpServiceAdapter` espera `{error:{code,message,retryable}}`; no inferir catálogo real de errores desde mocks.

La validación final requiere cuentas y backend de prueba, matriz navegador de sesión, uploads reales, permisos fuera de UI, secretos fuera del bundle, acceso cartográfico configurado, hosting SPA de deep links, medición de volumen y certificación integrada posterior a las correcciones mock aprobadas F-011/F-013. El warning del chunk >500 kB se trata allí. No se ejecutan ni autorizan despliegues o mutaciones Git por este documento.

## Ejecución local autorizada

A-00 cerró F-011/F-013 y F-012 documental con reviewer independiente, sin alterar dependencias F-010. A-01/F-014 y A-04/F-017 tienen aprobación local independiente; su certificación integrada sigue bloqueada por proveedor/navegador/Android. A-01 se gestiona en F-014; A-02 en F-015 (entrega local aprobada independientemente, certificación API/UUID persistido pendiente); A-03 en F-016; A-04 en F-017; A-05 en F-018. El humano autorizó ejecución Admin el 2026-11-04, sin ratificar decisiones abiertas. El cierre integral requiere backend/archivos/correo local, fixtures y navegador dos pestañas; las pruebas mock/unitarias sólo demuestran sus propios alcances. La contingencia con lugar null está confirmada y debe preservarse.
