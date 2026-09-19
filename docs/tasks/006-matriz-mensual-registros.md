# F-006 — Matriz mensual y edición de registros

**Estado:** in_progress
**App(s):** admin | backend
**Creada:** 2026-09-18

## Contexto

Entrega incremental de F-006: consulta mensual densa y continua sobre P-01, seguida de detalle, alta, corrección y aprobación pura mock-first. El humano ratificó la ruta separada de aprobación, la eliminación del estado `REJECTED` y el borrado explícito de intervalos durante la corrección.

## Alcance

**Incluye:**
- Un único mes y una única provincia por consulta; valores iniciales: mes corriente en `America/Argentina/Buenos_Aires` y San Juan.
- Filas empleado–lugar con actividad, columnas por cada día real del mes y total mensual oficial por fila después del último día.
- Domingos diferenciados con fondo gris claro, encabezado y columna identificatoria fijos, scroll vertical continuo y scroll horizontal dentro de la matriz.
- Filtros por cliente, lugar y empleado; filtros contractuales de completitud, revisión, origen y ausencia bajo divulgación progresiva.
- Paginación interna mediante `useInfiniteQuery`, snapshot de 15 minutos y carga al acercarse al final, sin botones de paginación.
- Servicio y mock contractuales para `GET /records/monthly` bajo la base `/api/v1` configurada por el adaptador HTTP.
- Detalle diario con intervalos y metadata de eventos cargada bajo demanda.
- Alta global y desde celdas `EMPTY` confirmadas, con identidad empleado–lugar–fecha y uno o más intervalos.
- Corrección con `expectedVersion`, identidad inmutable, operaciones ADD/UPDATE/DELETE, mínimo de un intervalo y conservación de los eventos automáticos como evidencia inmutable.
- Aprobación pura mediante `PATCH /records/{id}/review` con `{ expectedVersion, reviewStatus: "APPROVED" }`; devuelve el detalle completo y nueva versión sin alterar origen, datos ni intervalos.
- `ReviewStatus` de registro e intervalo sin `REJECTED`: `NONE`, `PENDING`, `APPROVED` y, solo donde corresponda a intervención manual, `MANUAL_LOADED`.
- Validación local y mock de WORK completo, rangos válidos, no solapamiento, duplicado y conflicto de versión.

**NO incluye:**
- Revisión individual de intervalos: no se aprobó una ruta de escritura separada y la aprobación confirmada opera sobre el registro completo.
- Cambios al contrato P-01, al contrato sincronizado o a archivos `SYNCED-FROM-TEMPLATE`.
- Búsqueda libre agregada a la matriz: el selector de empleado resuelve un UUID con el listado `/users` y envía el `employeeId` ya aprobado.
- Integración con el backend real ni evidencia de sus snapshots, concurrencia o rendimiento.

## Referencias (fuente de verdad)

- Docs: `docs/spec_definition.md` §§12–25, 59, 65, 66 y 82–84.
- Plan: `v0_plans/efficient-route.md`, F-006.
- Contratos: `docs/arquitectura/contratos-api.md`, decisiones 8 y 11; `docs/changes_proposals/20260917-p01-matriz-mensual.md`.
- Código: `src/features/records`, `src/services/records-service.ts`, `src/mocks/records-handlers.ts`, `src/types/records.ts`.

## Criterios de aceptación

- [x] La vista inicial representa el mes corriente y San Juan; cada cambio conserva como máximo un mes y una provincia.
- [x] Cada fila corresponde a un empleado–lugar y contiene exactamente 28, 29, 30 o 31 días.
- [x] Los domingos se distinguen sin perder contraste; los estados problemáticos se expresan con texto además de color.
- [x] La identidad de fila, los días y el total se mantienen legibles con scroll horizontal; el encabezado permanece visible con scroll vertical.
- [x] La siguiente página se solicita por scroll, conserva el snapshot y no presenta controles de paginación.
- [x] Los totales globales vienen de `meta.totals`; no se recalculan a partir de las páginas cargadas.
- [x] Los filtros de estados conservan días no coincidentes con `matchesFilters=false`.
- [ ] Backend materializa el DTO y aporta la evidencia pendiente indicada en la decisión 8.
- [x] Detalle, alta y corrección mock-first permiten ADD/UPDATE/DELETE, conservan al menos un intervalo y no generan eventos manuales.
- [x] Un duplicado concurrente y un conflicto de versión conservan una salida recuperable sin sobrescritura.
- [x] La aprobación pura usa una ruta separada, incrementa la versión y preserva origen, datos e intervalos.
- [x] `REJECTED` no existe en tipos, filtros, matriz, detalle ni fixtures de registros o intervalos.
- [ ] Backend materializa y propaga la enmienda contractual ratificada para aprobación y DELETE de intervalos.

## Notas de implementación

La pantalla prioriza densidad y lectura operativa: controles de 36 px, filas de 48 px, días de 56 px y una única superficie de datos. El scroll horizontal se limita a la matriz; `Mayús + rueda` desplaza los días. No se incorporó virtualización porque el plan F-006 la excluye explícitamente; la carga incremental limita el volumen inicial a 50 filas.

No se requiere cambio de backend adicional para los puntos confirmados: mes/provincia únicos, default de San Juan, domingos, densidad, sticky columns y total final son decisiones de presentación. La búsqueda de empleado reutiliza `/users` y el filtro `employeeId` del contrato vigente.

## Registro de implementación

- Tipos Zod y TypeScript de P-01 en `src/types/records.ts`.
- Servicio mensual y validación completa del envelope con `meta`.
- Fixture mock determinista con meses de 28–31 días, filtros same-day, totales globales y snapshot.
- Vista compacta con filtros URL, tabla semántica, estados textuales, scroll continuo y sticky headers/columns.
- Pruebas de filas completas, febrero, paginación snapshot y filtros.
- Formularios accesibles de alta/corrección, alertas inline, aviso de cambios sin guardar y recuperación explícita ante `RECORD_VERSION_CONFLICT`.
- Servicio `POST /records`, `PATCH /records/{id}` y `PATCH /records/{id}/review` con mocks persistentes, invalidación de matriz y pruebas de duplicado, versión, solapamientos, DELETE con mínimo de un intervalo y aprobación sin mutaciones colaterales.

## Review

### Ronda 1 — pendiente
- Veredicto: pendiente
- Ítems: revisión a cargo del rol reviewer del harness.
