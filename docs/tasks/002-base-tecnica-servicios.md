# F-002 — Base técnica y capa de servicios mock-first

**Estado:** in_progress
**App(s):** admin
**Creada:** 2026-09-17

## Contexto

El repositorio aún no tiene código de producto. Esta feature crea una base React + TypeScript desplegable y verificable, y fija el límite entre UI, servicios mock y transporte HTTP antes de construir módulos de negocio. Debe priorizar una operación administrativa densa, clara, rápida y completamente en español.

## Alcance

**Incluye:**
- Aplicación Vite con React 19, TypeScript estricto, React Router y Tailwind CSS.
- Estructura por `app/`, `components/`, `features/`, `services/`, `lib/`, `types/` y `test/`.
- Router raíz con una vista de base técnica y fallback de ruta no encontrada.
- `QueryClientProvider` con defaults explícitos para consultas y mutaciones.
- Contrato interno de adaptador de servicios y dos implementaciones intercambiables: mock determinista y HTTP real.
- Selección del adaptador por `VITE_SERVICE_MODE=mock|http`; mock por defecto en desarrollo/tests y validación estricta de `VITE_API_BASE_URL` en HTTP.
- Normalización de respuestas `ApiEnvelope<T>`, paginación y errores de red/HTTP/contrato sin cambiar los contratos sincronizados.
- Utilidades transversales para Argentina: formato de fecha/hora con `Intl`, conversión UTC y zona `America/Argentina/Buenos_Aires`.
- Validación reutilizable de adjuntos con límites ratificados de 20 MiB por archivo, 10 archivos por operación y validación atómica.
- Tokens visuales de cinco colores tomados del plan aprobado: `#0D80AE`, `#62882B`, `#ED701E`, `#0F172A`, `#EDF2F5`; tipografía Work Sans con fallback de sistema, foco visible y respeto por movimiento reducido.
- Tests unitarios/integración para selección de adaptador, errores, fechas y adjuntos; smoke test de UI.
- Scripts de `lint`, `typecheck`, `test` y `build`.

**NO incluye:**
- Autenticación, sesión, cookies ni CSRF.
- Endpoints, DTOs o fixtures de empleados, clientes, registros, planillas, legajos o dashboard.
- Conexión a backend real, base de datos, almacenamiento o Geoapify.
- Navegación funcional de módulos F-003 a F-009.
- Cambios en `docs/spec_definition.md` ni archivos `SYNCED-FROM-TEMPLATE`.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` Partes 1, 6, 7 y 8.
- Plan aprobado: `docs/tasks/001-acuerdos-y-ejecucion-plan.md` secciones 4, 5, 6.1, 6.5 y 7 F-002.
- Arquitectura: `docs/arquitectura/contratos-api.md` convenciones generales y Decisiones 8–12.
- Convenciones: `docs/convenciones/flujo-de-trabajo.md`, `docs/convenciones/superpowers.md`.

## Criterios de aceptación

- [x] **CA-01 — Scaffold reproducible:** el proyecto instala con lockfile, usa TypeScript estricto y expone scripts funcionales de desarrollo, lint, typecheck, test y build.
- [x] **CA-02 — Estructura y providers:** la aplicación renderiza mediante router y `QueryClientProvider`, con estructura modular y una ruta fallback accesible.
- [x] **CA-03 — Mock-first intercambiable:** el mismo cliente de servicios usa mock o HTTP según configuración, sin condicionales de transporte en componentes y sin datos de dominio inventados.
- [x] **CA-04 — Errores coherentes:** red, HTTP, payload inválido y error declarado por envelope producen una clase de error tipada, segura para UI y con causa preservada cuando corresponde.
- [x] **CA-05 — Fechas consistentes:** las utilidades convierten valores UTC y formatean fechas/horas en `America/Argentina/Buenos_Aires` mediante `Intl`, con tests deterministas.
- [x] **CA-06 — Adjuntos atómicos:** la validación rechaza el conjunto completo si supera 10 archivos o si cualquier archivo supera 20 MiB, e identifica todos los problemas sin subir parcialmente.
- [x] **CA-07 — Base visual accesible:** la vista inicial está en español, es responsive, usa HTML semántico, skip link, foco visible, contraste suficiente y `prefers-reduced-motion`.
- [x] **CA-08 — Verificación fresca:** `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build` y el smoke test de navegador finalizan correctamente.
- [x] **CA-09 — Disciplina documental:** el implementer completa el registro y progreso sin editar fuentes sincronizadas ni contratos.

## Notas de implementación

- No se crean contratos de negocio nuevos. Los tipos base reflejan únicamente envelopes y errores ya documentados.
- El mock adapter debe responder solo rutas registradas por tests/fixtures futuros; una ruta no registrada falla de forma explícita.
- El HTTP adapter debe usar `credentials: 'include'`, aceptar `AbortSignal`, enviar JSON cuando corresponda y no registrar datos sensibles.
- La pantalla de F-002 es evidencia del scaffold, no una simulación de módulos aún no implementados.
- Los detalles de sesión todavía abiertos en la Decisión 9 se mantienen fuera de esta feature.

## Registro de implementación

Implementación completada el 2026-09-17.

- Scaffold: Vite 8, React 19, TypeScript estricto, Tailwind CSS 4, React Router 7 y TanStack Query 5; manifiesto y `package-lock.json` reproducibles con npm 11.
- Arquitectura: providers/router en `src/app/`, pantallas en `src/features/`, contratos base en `src/types/`, adaptadores y cliente en `src/services/`, utilidades transversales en `src/lib/`.
- Servicios: `MockServiceAdapter` exige registro explícito; `HttpServiceAdapter` usa cookies, abort signals y normaliza red, HTTP, JSON y errores API; `ServiceClient` valida envelopes con Zod.
- Reglas compartidas: zona `America/Argentina/Buenos_Aires`, transporte UTC y validación atómica de 20 MiB × 10 archivos.
- Interfaz: pantalla de scaffold en español, fallback 404, cinco tokens de color, Work Sans local, skip link, foco visible, diseño responsive y movimiento reducido.
- Tests: 17 casos para adaptadores/errores, envelopes, paginación, respuestas 204, fechas, adjuntos y rutas.

Verificación fresca:
- `npm ci --ignore-scripts`: exit 0.
- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test -- --run`: 4 archivos, 17 tests aprobados tras las correcciones de la ronda 1.
- `npm run build`: exit 0; 77 módulos transformados.
- Navegador real: `/` y `/ruta-inexistente` verificadas; screenshots desktop 1366×768 y mobile 390×844 sin desbordes ni errores de consola de la aplicación.

Incidencia resuelta: el primer test de formato horario omitía solicitar `minute`, aunque esperaba `12:30`; se corrigió el test. Una ejecución paralela de `npm ci` y Vitest produjo transitoriamente un módulo ausente mientras npm reemplazaba `node_modules`; la suite secuencial posterior pasó completa.

## Review

### Ronda 1 — 2026-09-17

**Veredicto: cambios requeridos** (3 ítems).

Verificación ejecutada por el reviewer (no se confió en el registro): `npm ci --ignore-scripts` exit 0; `npm run lint` exit 0; `npm run typecheck` exit 0; `npm test -- --run` exit 0 (4 archivos, 15 tests); `npm run build` exit 0 (77 módulos); `sync-template.sh --check` sin deriva; `git status` limpio y ningún archivo SYNCED-FROM-TEMPLATE modificado. El smoke de navegador real no se re-ejecutó (entorno sin navegador); las rutas `/` y fallback están cubiertas por `src/app/app.test.tsx`.

Lo verificado como correcto: scaffold estricto y reproducible (CA-01), router + providers + fallback accesible (CA-02), mock-first intercambiable sin condicionales de transporte ni DTOs de dominio (CA-03), jerarquía de errores tipada con causa preservada (CA-04), fechas `Intl`/`America/Argentina/Buenos_Aires` con tests deterministas (CA-05), adjuntos atómicos 20 MiB × 10 (CA-06), base visual accesible en español (CA-07), comandos frescos en verde (CA-08) y disciplina documental sin tocar fuentes sincronizadas (CA-09).

Ítems de corrección:

1. **Paginación fuera de contrato** — `src/types/api.ts:8` y `src/services/service-client.ts:9`: el campo se llama `total`, pero el contrato ratifica `totalItems` (`backend_api_gdes/docs/03-contratos-api.md`, "Formato de respuesta"; también citado en `docs/arquitectura/contratos-api.md` línea 226). Renombrar a `totalItems` en el tipo, el schema Zod y lo que dependa de ellos.
2. **Consultar al humano — paleta de tokens contradictoria:** este task spec (línea 23) declara cinco tokens "tomados del plan aprobado" (`#0D80AE`, `#F9FAFC`, `#111827`, `#22C55E`, `#EF4444`), pero el plan aprobado (`docs/tasks/001-acuerdos-y-ejecucion-plan.md` §4, línea 159) y la spec (§44) definen otra paleta (`#0D80AE`, `#62882B`, `#ED701E`, `#0F172A`, `#EDF2F5`). La implementación siguió el task spec; el humano/leader debe definir cuál paleta manda y corregir el documento que corresponda.
3. **`HttpServiceAdapter` rechaza respuestas 204 exitosas** — `src/services/http-service-adapter.ts:23-36`: `parseJson` se ejecuta sobre toda respuesta; un `204 No Content` con cuerpo vacío (código de éxito documentado en el contrato backend, usado por DELETE de documentos) termina en `INVALID_JSON_RESPONSE` pese al éxito. Manejar 204/cuerpo vacío antes de parsear.

## Respuesta de implementación a la ronda 1

Correcciones aplicadas el 2026-09-17:

1. `Pagination.total` y el schema Zod fueron renombrados a `totalItems`, con prueba del envelope paginado ratificado.
2. El humano confirmó que rige la paleta del plan aprobado F-001: `#0D80AE`, `#62882B`, `#ED701E`, `#0F172A`, `#EDF2F5`. Se corrigieron este task spec, los tokens implementados y el `theme-color` del documento.
3. `HttpServiceAdapter` ahora devuelve `undefined` ante `204 No Content` exitoso sin intentar parsear JSON; se agregó una prueba de DELETE.

Verificación posterior: lint, typecheck, 17 tests y build finalizaron con exit 0. La vista principal se volvió a comprobar en navegador real a 1366 × 768 con la paleta aprobada y sin errores de aplicación en consola.

Pendiente: re-revisión independiente y nuevo veredicto del reviewer.
