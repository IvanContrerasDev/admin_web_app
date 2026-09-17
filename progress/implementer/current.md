# Current — admin

## Tarea activa
F-002 — Base técnica y capa de servicios mock-first (`docs/tasks/002-base-tecnica-servicios.md`).

## Haciendo ahora
Implementación completa; handoff listo para reviewer independiente.

## Hecho (esta sesión)
- Scaffold Vite + React + TypeScript estricto con lockfile y scripts de calidad.
- Router, QueryClientProvider, shell accesible, vista inicial y fallback 404.
- Adaptadores mock/HTTP intercambiables y cliente con validación Zod de envelopes.
- Error tipado común para configuración, red, HTTP, API y contrato.
- Utilidades UTC/GMT-3 y validación atómica de adjuntos 20 MiB × 10.
- Cinco tokens visuales, Work Sans local, responsive, skip link, foco y movimiento reducido.
- 15 tests unitarios/integración/smoke aprobados.

## Blockers / Preguntas para el humano
- Ninguno.

## Resultado final
- Archivos de producto: `package.json`, `package-lock.json`, configuración Vite/TypeScript/ESLint, `index.html`, `.env.example` y `src/**`.
- Decisiones: mocks explícitos sin DTOs de dominio inventados; HTTP con `credentials: include`; fechas mediante `Intl` en `America/Argentina/Buenos_Aires`; Work Sans embebida como dependencia.
- Verificación: npm ci, lint, typecheck, 15 tests y build exitosos; navegador real en desktop/mobile y fallback 404 sin errores de aplicación.
- Status: done; pendiente de aprobación del reviewer antes de cerrar F-002.
