# F-003 — Autenticación y navegación administrativa

## Estado

`in_progress` — activada el 2026-09-17 tras aprobación humana y cierre de F-002.

## Fuentes y límites

- Fuente funcional: `docs/spec_definition.md`, Parte 2 §§9–10 y UX transversal.
- Contrato: `docs/arquitectura/contratos-api.md`, decisiones 6, 7, 9 y 10.
- Tipos base aprobados: P-02 (`WebLoginCandidate`, `AuthUserCandidate`, `WebSessionCandidate`, `WebTokenResponseCandidate`) y P-03.
- No se modifican contratos TypeScript ni archivos `SYNCED-FROM-TEMPLATE`.
- El mock valida comportamiento de UI y estado; no demuestra cookies HttpOnly, CSRF, CORS ni rotación real. Esa evidencia corresponde a F-010.

## Alcance implementable ahora

1. Login administrativo con `identifier`, `password`, `client: "ADMIN"` y `rememberSession`.
2. Respuesta 202 modelada como challenge: ningún token antes de verificar el código de email de 6 dígitos.
3. Verificación 2FA con sesión ADMIN/SUPER_ADMIN, access token solo en memoria y vencimiento absoluto visible para el transporte.
4. Bootstrap de sesión sin destello protegido, guard, destino interno validado, logout y limpieza de caché.
5. Layout administrativo compartido, sidebar persistente y header con identidad/cierre de sesión; rutas de módulos con lazy loading.
6. Mocks deterministas separados del transporte HTTP y pruebas de flujos felices/errores relevantes.

## Alcance bloqueado por contrato materializado pendiente

- Endpoint/body/respuesta definitivos del reenvío 2FA ADMIN.
- Mecanismo CSRF exacto, identificador de generación de sesión, atributos/orígenes definitivos y coordinación real entre pestañas.
- DTOs/rutas definitivos de recuperación/reset y catálogo público de provincias.
- DTOs completos de solicitud administrativa, respuestas neutrales y decisión SuperAdmin materializados por backend.

Estos puntos no se inventan. Se incorporarán a esta feature cuando el backend publique y el humano ratifique sus contratos completos.

## Criterios de aceptación del incremento A

- **CA-01:** El formulario accesible envía exactamente `identifier`, `password`, `client=ADMIN`, `rememberSession`; no persiste credenciales ni tokens.
- **CA-02:** El login exitoso conduce al challenge 2FA y el código debe contener exactamente 6 dígitos.
- **CA-03:** Antes del 2FA no existe usuario autenticado ni contenido protegido.
- **CA-04:** ADMIN y SUPER_ADMIN acceden a las mismas rutas; TO_BE_ADMIN muestra el mensaje contractual exacto; otros roles no acceden.
- **CA-05:** El bootstrap mantiene una pantalla de verificación y el guard conserva solo destinos internos.
- **CA-06:** Logout invalida el estado local, cancela/limpia Query y vuelve al login.
- **CA-07:** Sidebar/header y rutas administrativas son accesibles y adaptables; UI en español.
- **CA-08:** lint, typecheck, tests y build pasan; smoke real cubre login → 2FA → Inicio → logout.

## Exclusiones

No se agrega proveedor de autenticación SaaS, backend local, almacenamiento persistente, recuperación de contraseñas de empleados, edición de perfil propio ni capacidades de módulos F-004+.

## Registro de implementación

Incremento A implementado el 2026-09-17:

- Servicio auth tipado y mock-first para login, 2FA, bootstrap refresh y logout; access token solo en memoria.
- Login accesible con email, contraseña y recordar sesión; challenge separado y sin contenido protegido antes de verificar.
- Guard sin destello, destino interno validado, limpieza de Query al salir y mensaje contractual de TO_BE_ADMIN.
- Layout administrativo responsive con identidad, cierre de sesión, sidebar y rutas lazy para los seis módulos.
- Validación: `npm run lint`, `npm run typecheck`, `npm test -- --run` (5 archivos, 20 tests) y `npm run build`, todos exit 0.
- Smoke real a 1366 × 768 y 390 × 844: login → 2FA → Inicio → logout; sin errores de aplicación en consola. Capturas guardadas fuera del repositorio.

F-003 permanece `in_progress`: falta incorporar los subflujos bloqueados listados arriba cuando exista contrato materializado.

## Review

Pendiente.
