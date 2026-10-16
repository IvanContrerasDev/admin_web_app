# Integración administrativa: diseño y disponibilidad

## Fuente contractual y disponibilidad real

Los acuerdos vigentes y candidatos cross-app se centralizan en [contratos comunes](arquitectura/contratos-api.md). `backend_api_gdes/docs/03-contratos-api.md` describe el diseño HTTP; no acredita endpoints implementados. En el código backend actual `src/app.module.ts` registra solamente `HealthController` y `src/main.ts` no configura prefijo global: los dominios administrativos no están disponibles en código. No se verificó un despliegue remoto.

F-010 sigue pendiente; el frontend opera mock-first. Esta sección describe lo que consume el código para que backend/frontend puedan contrastarlo sin elevar automáticamente un mock a contrato aprobado.

## Brechas de transporte y sesión

- Los servicios envían paths absolutos como `/users`. `HttpServiceAdapter` usa `new URL(request.path, baseUrl)`, por lo que una base con `/api/v1` pierde ese prefijo. La base de diseño backend es `/api/v1`; corregir/verificar composición antes de integración.
- El adaptador usa `credentials:'include'`, JSON y AbortSignal. No agrega Bearer ni CSRF; tener access en memoria no autentica automáticamente las consultas.
- `AuthService`: POST `/auth/login` (`identifier,password,client:'ADMIN',rememberSession`); POST `/auth/login/2fa/verify` (`challengeId,code`); GET `/auth/web/session`; POST `/auth/web/refresh` y `/auth/web/logout` con `{}`. Zod exige user, sessionExpiresAt, rememberSession, tokens.accessToken/expiresIn; no hay identificador de generación de sesión en los tipos actuales.
- `AuthProvider` restaura al inicio, sin renovación programada por expiración ni coordinación multi-tab. Cookies reales, CORS con credenciales, CSRF, rotación, respuesta perdida, revocación y expiración absoluta requieren implementación/evidencia backend y navegador.
- Web y backend son proyectos Vercel separados por decisión humana. Los dominios no están fijados: `admin.prolimpservicios.com` es candidato; `backend-gdes.vercel.app` sería cross-site, `api.prolimpservicios.com` same-site/cross-origin. Definir URLs/CSRF/generación y matriz real de navegador; CORS no remedia bloqueo de cookies de terceros. Alternativa same-site/proxy/BFF requiere acuerdo si falla esa matriz.
- `/registro` solo valida datos y consulta `/sites` sin sesión. No hay envío de solicitud administrativa, confirmación ni recuperación de contraseña en el router actual. Conservar los flujos aprobados de spec/contrato como requisitos pendientes, incluidos verificación de identidad y protección de cuentas existentes.

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

Los nueve tipos actuales de documento son DNI, MEDICAL_CERTIFICATE, CONTRACT, ART, EPP_DOCUMENTATION, MEDICAL_RECORD, INTERNAL_POLICIES, ADDRESS_DECLARATION, OTHER. Son candidatos frontend donde aún falta ratificación; no inventar un mapping a enums de persistencia backend/mobile. Revisión de registros usa NONE/PENDING/APPROVED/MANUAL_LOADED sin REJECTED; estados de intervalos OPEN/SEMI_CLOSED/CLOSED y origen AUTOMATIC/MANUAL.

Diferencias exactas con persistencia backend actual (`prisma/schema.prisma`): DocumentType tiene INTERNAL_RULES frente a INTERNAL_POLICIES del frontend; ReviewStatus e IntervalReviewStatus todavía contienen REJECTED; IntervalReviewStatus no contiene MANUAL_LOADED, mientras `recordIntervalSchema` frontend reutiliza reviewStatusSchema que sí lo admite. No son DTOs HTTP materializados ni autorización para mapear o modificar enums en silencio; backend debe alinearlos con el contrato vigente y exponer la traducción de transporte explícita cuando corresponda.

## Acuerdos y evidencia pendientes

F-012 elevó los DTOs de planillas/documentos/métricas, expiresAt obligatorio, reemplazo que conserva estado/metadata original, auditoría/concurrencia del reemplazador, tipos documentales, uploadedBy textual, fechas inclusivas GMT-3, desempates, multipart y nullables. El contrato común debe distinguir ratificado/candidato; su existencia en código no ratifica estas políticas. El código actual además exige byProvince, incluido como punto abierto de la propuesta vigente: requiere decisión humana antes de cerrar el contrato.

La tarjeta Inicio conserva mes/filtro pero no provincia; el desglose no tiene enlaces provinciales. El contador global puede diferir del destino San Juan. Falta decisión de coherencia provincial, sin agregar siteId en silencio.

Backend debe entregar DTOs/envelopes/nullables/roles/errores y pruebas: matriz bisiesta/31 días/vacía/dos páginas/mutación concurrente, snapshot 410 y mismatch 400; conflictos 409 de duplicado/versión y unicidades; inactivos preservando historia; aprobación sin alterar origen/eventos; atomicidad/secuencia de archivos, descarga 15 min, reemplazo/eliminación R2 y errores. `HttpServiceAdapter` espera `{error:{code,message,retryable}}`; no inferir catálogo real de errores desde mocks.

La validación final requiere cuentas y backend de prueba, matriz navegador de sesión, uploads reales, permisos fuera de UI, secretos fuera del bundle, acceso cartográfico configurado, hosting SPA de deep links, medición de volumen y cierre independiente de F-011/F-013. El warning del chunk >500 kB se trata allí. No se ejecutan ni autorizan despliegues o mutaciones Git por este documento.
