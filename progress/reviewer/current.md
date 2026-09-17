# Current — reviewer

## Tarea activa
F-002 — Base técnica y capa de servicios mock-first (`docs/tasks/002-base-tecnica-servicios.md`). Ronda 1 de revisión independiente.

## Haciendo ahora
Revisión completa; veredicto emitido: `changes_requested` (3 ítems).

## Hecho (esta sesión)
- Revisados los 9 criterios de aceptación (CA-01 a CA-09) contra el código real, no contra el registro del implementer.
- Leídas las fuentes de verdad: `docs/spec_definition.md` (Partes 1, 6, 7, 8), `docs/arquitectura/contratos-api.md` (convenciones y Decisiones 8–12), `docs/tasks/001-acuerdos-y-ejecucion-plan.md` (§4 y §7 F-002) y la materialización ratificada `backend_api_gdes/docs/03-contratos-api.md`.
- Inspeccionado todo `src/`, `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `.env.example`.
- Verificación ejecutada personalmente (exit real):
  - `npm ci --ignore-scripts` → exit 0, 0 vulnerabilidades (node v24.19.0, npm 12.0.2).
  - `npm run lint` → exit 0 (eslint con `--max-warnings=0`).
  - `npm run typecheck` → exit 0 (`tsc -b`).
  - `npm test -- --run` → exit 0, 4 archivos, 15 tests aprobados (coincide con el registro).
  - `npm run build` → exit 0, 77 módulos transformados.
  - `scripts/sync-template.sh --check` → OK, sin deriva en archivos SYNCED-FROM-TEMPLATE.
  - `git status` limpio; el commit de la feature no tocó archivos SYNCED ni `docs/spec_definition.md`.
- Confirmado en código: selección de adaptador por `VITE_SERVICE_MODE` con mock por defecto y falla explícita ante modo inválido o falta de `VITE_API_BASE_URL` (`src/services/create-service-adapter.ts`); `MockServiceAdapter` con registro explícito y error `MOCK_ROUTE_NOT_REGISTERED` (`src/services/mock-service-adapter.ts:23-30`); `HttpServiceAdapter` con `credentials: 'include'`, `AbortSignal` y normalización red/HTTP/JSON/envelope (`src/services/http-service-adapter.ts`); envelope y error validados con Zod (`src/services/service-client.ts`); fechas con `Intl` en `America/Argentina/Buenos_Aires` y transporte UTC con tests deterministas (`src/lib/dates.ts`); adjuntos atómicos 20 MiB × 10 con todos los problemas listados (`src/lib/attachments.ts`); UI en español, semántica, skip link, foco visible, `prefers-reduced-motion`, Work Sans con fallback (`src/styles.css`, `index.html`, `src/app/app-shell.tsx`); sin DTOs/fixtures de dominio ni navegación de F-003+.

## Hallazgos (ver detalle en la sección Review del task spec)
1. **Contrato de paginación incumplido:** `Pagination.total` (`src/types/api.ts:8`) y `paginationSchema` (`src/services/service-client.ts:9`) usan `total`, pero el contrato materializado ratifica `totalItems` (`backend_api_gdes/docs/03-contratos-api.md` línea 12; también citado en `docs/arquitectura/contratos-api.md` línea 226). Los nombres deben coincidir de forma directa.
2. **Contradicción documental de tokens (consultar al humano):** el task spec F-002 declara cinco tokens "tomados del plan aprobado" (`#0D80AE`, `#F9FAFC`, `#111827`, `#22C55E`, `#EF4444`), pero el plan aprobado (`docs/tasks/001-acuerdos-y-ejecucion-plan.md` §4, línea 159) y la spec (§44) definen otra paleta (`#0D80AE`, `#62882B`, `#ED701E`, `#0F172A`, `#EDF2F5`). La implementación siguió el task spec; no corresponde al reviewer decidir cuál paleta manda.
3. **`HttpServiceAdapter` rompe respuestas 204:** `parseJson` (`src/services/http-service-adapter.ts:23-36`) se ejecuta siempre; un `204 No Content` con cuerpo vacío (código de éxito documentado en el contrato backend, usado p. ej. por DELETE de documentos) lanza `INVALID_JSON_RESPONSE` aunque la operación haya tenido éxito.

## Blockers / Preguntas para el humano
- ¿Cuál paleta de tokens es la vigente: la del plan aprobado (§4 de F-001 plan) o la declarada en el task spec F-002? (Ítem 2.)

## Resultado final
- Archivos escritos por reviewer: `progress/reviewer/current.md` y sección `## Review` de `docs/tasks/002-base-tecnica-servicios.md`.
- Verificación: los 5 comandos del CA-08 pasaron en mi propia ejecución (salidas arriba); el smoke de navegador real no pude re-ejecutarlo (sin navegador en este entorno) — lo cubre parcialmente el smoke test de rutas en `src/app/app.test.tsx`.
- Status: `changes_requested` — 3 ítems (1 de contrato, 1 de consulta al humano, 1 de bug latente contra contrato).
