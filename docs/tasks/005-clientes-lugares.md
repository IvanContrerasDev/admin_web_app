# F-005 — Clientes, provincias y lugares de trabajo

**Estado:** pending_review
**App(s):** admin
**Creada:** 2026-09-17

## Contexto

Construir la gestión de la estructura organizacional y la configuración geográfica circular de cada lugar de trabajo. F-003 y F-004 siguen pendientes de revisión independiente; el humano autorizó continuar con la siguiente etapa sin considerarlas aprobadas.

## Alcance

**Incluye:**
- Clientes: listado paginado, búsqueda parcial, filtro de estado, alta, edición y activación/desactivación.
- Provincias: catálogo consultable de las seis provincias habilitadas, sin CRUD.
- Lugares de trabajo: listado paginado, búsqueda y filtros por cliente, provincia y estado; alta, edición, detalle y activación/desactivación.
- Configuración `CIRCLE` con centro, radio en metros y umbral GPS opcional.
- Mapa Leaflet cargado de forma diferida, tiles y geocodificación Geoapify, búsqueda accesible, selección de resultado, marcador movible y círculo real en metros.
- Servicio de geocodificación desacoplado con adaptador mock determinista antes del adaptador real.

**NO incluye:**
- CRUD de provincias, eliminación de clientes/lugares, polígonos, zonas múltiples o geocodificación inversa.
- Desactivación en cascada ni alteración de registros/planillas históricos.
- Cálculo frontend de validez GPS o reescritura de revisiones históricas.
- Persistir texto de dirección o identificadores de Geoapify en el dominio.
- Implementar DTOs, rutas, límites numéricos o errores sin ratificación humana.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§28–37, 49–55, 58 y Parte 8.
- Plan: `docs/tasks/001-acuerdos-y-ejecucion-plan.md`, F-005.
- Contratos: `docs/arquitectura/contratos-api.md`, decisiones 1, 3, 4, 11 y 12; P-04.C/D y P-05.
- Propuesta específica: `docs/changes_proposals/20260917-p07-contrato-clientes-lugares.md`.
- Código base: `src/services`, `src/app/router.tsx`, `src/features/users` y `src/features/modules/module-pages.tsx`.

## Criterios de aceptación

- [ ] Clientes y lugares consultan mediante servicios + React Query con paginación y filtros server-side reproducidos por mocks.
- [ ] Los listados distinguen carga inicial, actualización, vacío y error, con reintento manual accesible.
- [ ] Alta/edición/estado respetan el contrato P-07 ratificado y no ofrecen borrado.
- [ ] Un lugar siempre referencia cliente y provincia existentes; una entidad inactiva no queda disponible para nuevas operaciones.
- [ ] Desactivar exige confirmación, revalida estado al guardar y no propaga estado a entidades relacionadas.
- [ ] La configuración geográfica conserva centro, radio y umbral GPS opcional; `shapeType` permanece `CIRCLE`.
- [ ] Buscar dirección admite teclado, debounce y cancelación; seleccionar o arrastrar actualiza el centro sin inventar dirección inversa.
- [ ] El círculo usa metros reales y el mapa ofrece inputs equivalentes para operación por teclado.
- [ ] Fallos de tiles/geocodificación no borran una selección existente y muestran recuperación explícita.
- [ ] Leaflet/Geoapify se cargan solo en el flujo geográfico y la atribución permanece visible.
- [ ] lint, typecheck, tests, build y validación en navegador desktop/mobile pasan.

## Notas de implementación

Se adopta Leaflet como renderizador técnico porque la configuración requerida es raster, circular y de marcador único; evita incorporar un motor vectorial mayor sin necesidad funcional. Geoapify sigue siendo el proveedor ratificado. La clave `VITE_GEOAPIFY_API_KEY` será pública y deberá restringirse por origen/producto; no se codificará ni se sustituirá silenciosamente por servicios OSM públicos.

P-04 ratificó las reglas de inactividad e historia, pero dejó como tarea del backend materializar DTOs por recurso. Según `AGENTS.md`, agregar o mejorar contratos TypeScript exige consulta humana. P-07 debe ratificarse antes de escribir tipos, servicios o mocks de F-005.

## Registro de implementación

- F-005 activada por decisión humana el 2026-09-17, manteniendo F-003/F-004 en revisión pendiente.
- Leaflet seleccionado como detalle técnico permitido por P-05.
- P-07 ratificada por decisión humana el 2026-09-17.
- DTOs, rutas, unicidades, límites geográficos y catálogo de errores habilitados para implementación mock-first.
- Materializados DTOs Zod/TypeScript, `OrganizationService` y mocks stateful para clientes, provincias y lugares.
- Listados, filtros, paginación, altas, ediciones, detalles y cambios de estado conectados con React Query.
- Geocodificación mock determinista con debounce/cancelación y adaptador Geoapify para modo HTTP.
- Mapa Leaflet diferido con marcador, círculo en metros, operación por teclado y recuperación sin tiles cuando falta la clave pública.
- Validación automática: lint, typecheck, 33 pruebas y build de producción exitosos.
- Validación real en navegador: listados desktop/mobile, búsqueda de dirección, selección de coordenadas, mapa y alta completa hasta el detalle.

## Review

Pendiente de revisión independiente. La clave pública restringida de Geoapify sigue siendo un requisito de la integración HTTP real; el modo mock no usa servicios públicos alternativos.
