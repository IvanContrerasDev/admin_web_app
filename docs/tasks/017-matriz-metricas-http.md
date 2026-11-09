# F-017 — A-04 Matriz asistencia métricas reales

**Estado:** blocked (entrega local aprobada; certificación integral pendiente)
**App(s):** admin
**Creada:** 2026-11-04

## Contexto

Paquete autorizado por inbox 20261102. El cierre integral F-010 conserva sus dependencias; esta tarea separa trabajo implementable de validación cross-app.

## Alcance

Integrar matriz/registros/eventos/métricas sin mezclar snapshot/páginas ni sobrescribir cambios concurrentes. IntervalReviewStatus excluye MANUAL_LOADED. Todos los enlaces de contadores, incluso provinciales, abren vista global y conservan mes/año; usuario filtra luego. No inventar atribución provincial para lugar null.

No incluye ratificar requisitos abiertos, producción, modificar otros repos/SYNCED ni mutaciones Git. Una dependencia de integración no bloquea correcciones independientes con contrato vigente.

## Referencias (fuente de verdad)

- docs/arquitectura/contratos-api.md; docs/spec_definition.md; docs/diseno-frontend.md; docs/integracion.md.
- Proveedor sólo lectura: ../backend_api_gdes/docs/03-contratos-api.md; código como evidencia, sin ratificar contradicciones.
- Archivos a cargo: src/features/{records,dashboard}, src/services/{records-service,dashboard-service}.ts, src/types/{records,dashboard}.ts y tests/mocks relacionados; no transporte.
- Trabajo de dominio independiente de F-014/F-015. La validación integral requiere sus entregas y backend B-01–B-03/fixture y Q-01.

## Criterios de aceptación

- [ ] Enums registro/intervalo separados; eventos/detalle consultados bajo demanda con metadata scalar y intervalId nullable según contrato.
- [ ] Snapshot, paginación/meta y errores 409/410 preservan cambios/filtrado correcto; reinicio a página 1 sin mezclar snapshots. expectedVersion en escrituras.
- [ ] Corrección/aprobación conservan eventos/origen según contrato; evento nuevo revierte aprobación a PENDING comprobado con proveedor.
- [ ] Métricas y destino usan mismo mes/año; todos los enlaces globales/provinciales van a sección global sin filtro de provincia automático. Tests de enlaces por contador/provincia.
- [ ] Navegador con API y evento Android acredita aparición/corrección/aprobación y refresh; casos bisiesto/31 días/vacío/dos páginas/concurrencia. Si falta Android/fixture, diferenciar de pruebas locales.
- [ ] npm ci, typecheck, lint, vitest run y build con evidencia fresca; navegador/API con limitaciones explícitas.

## Notas de implementación

Plan técnico en docs/tasks/017-matriz-metricas-http-plan.md. Paralelismo coordinado por archivos disjuntos con F-014; estado exclusivo progress/implementer-017/current.md. Si un DTO sigue abierto, implementar sólo la parte acordada y registrar campo/operación bloqueado sin inferir requisitos.

## Registro de implementación

Implementación local entregada; status `blocked` para cierre integral. Estado/evidencia y archivos completos en `progress/implementer-017/current.md`. Sin autoaprobación, Git ni cambios de proveedor/SYNCED.

Corrección local solicitada por reviewer: enlaces provinciales con caja inline-flex mínima 2.25rem×2.25rem (36×36px a fuente base 16), padding horizontal y foco separado. Conservan destinos globales/período, semántica y controles44px existentes. Confirmado origen en anchors inline fuera de regla desktop; no se agregan tests que sólo dupliquen clases. Verificación fresca de corrección: `npx vitest run src/features/dashboard src/app/f013.test.tsx --maxWorkers=2` exit0, 34/34 casos; typecheck/lint y diff-check del componente exit0. No se repite suite global/build por cambio de caja/foco sin modificación funcional, conforme despacho. Medición de navegador desktop no ejecutada: inventario CUA vacío y Python playwright no instalado; estructura/CSS verificados directamente con --spacing Tailwind0.25rem y sin override de tamaño raíz. No se afirma medida ejecutada ni E2E API.

Cambios: enum IntervalReviewStatus independiente y intervalId nullable; metadata escalar; matriz global sin provincia automática y selector Todas; enlaces de cada contador provincial/global conservan período/condición a destino global, con article y anchors hermanos. Alta/corrección/aprobación reinician matriz desde página 1 e invalidan dashboard. Error 410/400 no se reintenta; reinicio explícito conserva filtros y obtiene snapshot nuevo. 409 conserva borrador y expectedVersion hasta descartar/recargar expresamente. Mock conserva evidencia de eventos al corregir/desvincular intervalos y calcula métricas sobre el mismo estado runtime, sin atribuir provincia a lugar null.

Archivos producto: `src/types/records.ts`; `src/features/records/{records-page,records-filters,use-monthly-records,record-editor-form,record-detail-dialog}.tsx|ts`; `src/features/dashboard/dashboard-metric-card.tsx`; `src/mocks/{records,dashboard}-handlers.ts`. Tests nuevos en ambos features y ampliaciones en `src/services/{records,dashboard}-service.test.ts`. `src/app/f013.test.tsx` modificado únicamente en caso de tarjeta por ampliación de ownership `docs/diseno-frontend.md` (tarjetas con enlaces hermanos).

Verificación fresca 2026-11-04: 55/55 casos de dominio y 84/84 incluyendo F-013 pasan. Cubren enums, scalar/null, detalle/eventos bajo demanda, 28/29/30/31 días, vacío, dos páginas de snapshot inmutable con escritura concurrente, expiración absoluta y reinicio, filtros nuevos, 409 sin perder borrador, aprobación pura, reinicio de matriz/invalidez de métricas y destinos de cuatro contadores con dos provincias y cambio de período. Typecheck y lint exit 0; build final exit 0, warning existente chunk principal 575.88 kB reservado a F-010. `npm ci` exit 0 ejecutado por F-014 según su current; no se repitió simultáneamente.

Suite global fresca posterior de reviewer:222/222,28/28 archivos; typecheck/lint/build exit0. Los fallos transitorios de auth previos fueron corregidos por F-014 y no son bloqueos vigentes.

Bloqueos: proveedor sin endpoint/cuenta opt-in/OTP y fixture compartido B-02/B-03, B-04 lugar null/Q-01 pendientes según `progress/leader/dependencias-integracion.md`. No se ejecutó navegador/API/Android ni se certificó evento nuevo con proveedor. Lectura de `backend_api_gdes/src/modules/attendance/attendance.service.ts:198` confirma incremento de versión y APPROVED→PENDING transaccional, pero no reemplaza evidencia ejecutada. No se inventó DTO ni atribución provincial para contingencia null. Certificación API/navegador/Android y aprobación independiente siguen pendientes.

Diseño e integración consolidados por leader para matriz global, enums separados y métricas runtime.

## Review

**Veredicto: aprobado** para entrega local F-017 (2026-11-04). 0 defectos locales pendientes; cierre integral bloqueado por validación con proveedor/API/Android.

Recheck independiente: enlaces provinciales ahora son inline-flex con min-h-9/min-w-9, padding y foco visible, conservando destino global/período y anchors hermanos. Lectura de CSS compilado confirma min-height/min-width por nueve unidades de spacing (2,25 rem en escala actual); desaparece el defecto de anchor inline sólo sobre la cifra. No se ejecutó medición de navegador: no se confunde esta inspección de caja/CSS con una medición visual. `npx vitest run src/features/dashboard src/app/f013.test.tsx --maxWorkers=2 --reporter=dot` exit 0: 34/34 en 3 archivos tras corrección. Diseño/integración ya describen matriz global, enums separados, enlaces hermanos y métricas runtime; no se exige repetir esa consolidación.

Verificación propia del dominio en esta revisión: 84/84 en 11 archivos records/dashboard/servicios/F-013. Verificación global propia tras entrega F-014: 222/222 en 28 archivos, typecheck/lint/build y diff-check exit 0. Warning chunk 576,01 kB reservado a F-010. La última modificación de área de acción se revalidó con los 34 casos focalizados sin repetir suite global por una caja/foco reversible.

Criterios 1 y 2 corroborados localmente: enums registro/intervalo, scalar/nullables, detalle/eventos bajo demanda, expectedVersion, 409 con borrador conservado/recarga explícita, 410 no reintentable y reinicio de snapshots sin mezcla. Criterio 3 corroborado para corrección/aprobación mock sin alterar evidencia/origen en aprobación; evento nuevo APPROVED→PENDING sólo contrastado por lectura del proveedor. Criterio 4 corroborado localmente con enlaces de cuatro contadores/dos provincias y período. Criterio 5 NO certificado: sin API/navegador/Android ni ingesta real. Criterio 6: checks locales reales en verde; npm ci fue ejecutado por implementer, no se repitió ni se atribuye al reviewer. Tests cubren meses 28/29/30/31, vacío, dos páginas y escritura concurrente; no certifican esos escenarios contra API.

Bloqueos externos B-02 correo/OTP, B-03 cuenta/fixture, B-04 contingencia null y Q-01 según dependencias. Health API localhost:3000 devuelve conexión rechazada. No se fabricaron credenciales ni se inventó atribución provincial a lugar null. Las pruebas fetch/jsdom no acreditan proveedor ni cookies/Android. No cerrar F-010 ni todos los criterios integrales de F-017 por esta aprobación local; leader conserva ownership del estado y dependencias.
