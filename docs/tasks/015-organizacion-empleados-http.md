# F-015 — A-02 Organización y empleados reales

**Estado:** blocked (entrega local aprobada; certificación integral pendiente)
**App(s):** admin
**Creada:** 2026-11-04

## Contexto

Paquete autorizado por inbox 20261102. El cierre integral F-010 conserva sus dependencias; esta tarea separa trabajo implementable de validación cross-app.

## Alcance

Integrar organización/empleados con DTOs reales del contrato vigente: UUID, filtros, nullables, errores e invalidaciones. Formularios públicos consumen GET /catalogs y convierten sites value/label sin acceder a /sites protegido. Alta/edición manual de coordenadas no necesita clave Maps; fallo de mapa no borra valores ni bloquea ingreso manual. Conservar históricos/inactivos y no generar UUID ficticios para simular persistencia.

No incluye ratificar requisitos abiertos, producción, modificar otros repos/SYNCED ni mutaciones Git. Una dependencia de integración no bloquea correcciones independientes con contrato vigente.

## Referencias (fuente de verdad)

- docs/arquitectura/contratos-api.md; docs/spec_definition.md; docs/diseno-frontend.md; docs/integracion.md.
- Proveedor sólo lectura: ../backend_api_gdes/docs/03-contratos-api.md; código como evidencia, sin ratificar contradicciones.
- Archivos a cargo: src/features/{users,organization,auth/registration-form.tsx}, src/services/{user-service,organization-service}.ts y tipos/mocks/tests propios; no transporte/auth lifecycle.
- Correcciones de dominio independientes con archivos disjuntos de F-014/F-017; integración final espera F-014, backend B-01–B-03/fixture y Q-01.

## Criterios de aceptación

- [x] Contrastar src/types/{users,organization}.ts y servicios con contrato local y proveedor; registrar contradicciones sin inventar mapping.
- [x] GET /catalogs público usa sites value/label y /sites sólo bajo sesión Admin; tests de errores/recuperación y catálogos vacíos.
- [x] Alta/edición/filtros/estados de empleados, clientes y lugares usan API HTTP con UUID reales, errores por campo y cache invalidada.
- [x] Coordenadas manuales persisten sin Maps; fallo de mapa preserva datos. Tests UI relevantes.
- [ ] Navegador contra API local demuestra crear lugar/empleado y recuperar mismo UUID; interoperabilidad Android se registra separada si mobile no disponible.
- [x] npm ci, typecheck, lint, vitest run y build con evidencia fresca; navegador/API con limitaciones explícitas.

## Notas de implementación

Plan técnico en docs/tasks/015-organizacion-empleados-http-plan.md. Estado exclusivo progress/implementer-015/current.md por paralelismo coordinado. Si un DTO sigue abierto, implementar sólo la parte acordada y registrar campo/operación bloqueado sin inferir requisitos.

## Registro de implementación

Entrega local 2026-11-05 lista para revisión independiente; cierre integral bloqueado por API/fixture real. Sin autoaprobación, cambios Git, SYNCED ni otros repos.

- Contraste proveedor: DTOs de usuarios/clientes/lugares, UUID, relaciones embebidas, nullables laborales/umbral GPS y métodos PATCH/PUT/status coinciden con el contrato común. El filtro provincial/default San Juan del listado de empleados era un extra del código: spec §11.2 exige columna Provincia y búsqueda de identidad; filtros según contrato (§90). Se retiraron selector y query `siteId` de ese listado porque el proveedor lo rechaza. Se mantienen columna y provincia en formularios; no hay filtrado local sobre páginas ni DTO nuevo. Corrección de interoperabilidad documentada por leader tras contraste en `docs/diseno-frontend.md` (listado global según contrato).
- `UserService.listRegistrationSites` consume GET `/catalogs`, valida `sites:{value,label}[]` y convierte explícitamente a `{id,name}`. Registro maneja vacío/error/reintento sin tocar envío/OTP. AuthService permite únicamente GET `/catalogs` público, dejando `/sites` protegido; pruebas con adaptador compartido verifican anonimato y Bearer tras verificación. Con la corrección local aprobada independientemente, el catálogo usa `send(request, false)`: conserva cancelación por su AbortSignal propio sin ligarse al controller/generación ni headers de sesión. Auth y recursos privados conservan `sessionBound=true` por defecto, cancelación por logout y rechazo de respuestas tardías. No se modificaron coordinación, cookies, CSRF ni DTOs.
- Al guardar nombre/estado de cliente se invalidan listas y detalles de lugares con cliente embebido. Errores identificables se asocian a campo mediante aria-invalid/describedby, conservando errores genéricos cuando el contrato no identifica un campo.
- Alta manual sin Maps y edición tras rechazo del loader conservan latitud/longitud/radio y permiten guardar. Se corrigió `step=10` del slider a `step=1`: bloqueaba envío nativo de radios enteros válidos como 175 m. Google/Places no se certifican con credencial real.
- Tests HTTP usan fetch controlado, sin fallback mock, para verificar UUID recibido, GET posterior del mismo ID, PATCH omitido/null, PUT completo, filtros y errores/estados. Esa evidencia no demuestra persistencia de backend. Los tests UI usan mocks explícitos; no se generan UUID en la UI para simular persistencia HTTP.

Archivos: `src/types/users.ts`, `src/services/{user-service.ts,user-service.test.ts,organization-service.test.ts,public-catalog-session.test.ts}`, ampliación acotada send/requestProtected `src/services/auth-service.ts`, `src/mocks/user-handlers.ts`, `src/features/auth/{registration-form.tsx,registration.test.tsx}`, `src/features/users/{users-page.tsx,users.test.tsx}`, `src/features/organization/{client-form-page.tsx,client-detail-page.tsx,workplace-form-page.tsx,organization.test.tsx,workplace-map-failure.test.tsx}`.

Verificación fresca: typecheck y lint completos exit0; `npx vitest run --maxWorkers=2` 31 archivos/241 tests passed (30.41 s); `npm run build` exit0 (warning preexistente chunk principal 576.29 kB >500 kB); diff whitespace check exit0. npm ci reutilizado del F-014 por instrucción de despacho, sin repetir instalación concurrente. TDD rojo/verde verificado para catálogo/sesión pública, invalidación de detalles, filtros globales, errores asociados y radio175. La regresión de Review reprodujo AbortError con bootstrap401 y catálogo ambos diferidos antes del fix y ahora obtiene provincias sin refresh/autenticación. También pasan señal propia del catálogo y recurso privado cancelado por logout aunque fetch entregue éxito tardío. Focalizados auth/catalog/registro: 4 archivos/31 tests; full/typecheck/lint/build posteriores a la corrección exit0. Revisión React aplicada a hooks, query/cancelación, estados vacíos y ARIA.

Limitación vigente: el 2026-11-05 `curl --max-time 3 -sS -i http://localhost:3000/health` devuelve exit7/conexión rechazada. Backend/correo/cuenta opt-in/fixture compartido continúan pendientes según `progress/leader/dependencias-integracion.md`; no se arrancó, sembró o migró backend. Falta navegador contra API real creando empleado/lugar y recuperando el mismo UUID persistido. Android físico/interoperabilidad permanece separado y sin certificar. Este bloqueo no invalida la entrega local ni autoriza marcar el criterio integral como cumplido.

## Review

**Veredicto: aprobado** para entrega local F-015 (2026-11-05). 0 defectos locales pendientes; certificación integral bloqueada por API/cuenta/OTP/fixture y navegador.

Recheck independiente de la carrera: GET `/catalogs` usa `send(request,false)` y ya no depende de generación/controller/headers de sesión. Conserva AbortSignal del caller, rechazo de la carrera de abort y limpieza de listeners. Auth y privados mantienen sessionBound=true por defecto, generación/cancelación/logout y protección frente a respuestas tardías. `/sites` permanece protegido con Bearer; no cambian coordinación, CSRF, cookies o política offline. Regresiones nuevas ejecutadas: bootstrap401 concurrente con catálogo diferido obtiene provincias sin refresh/autenticación; cancelación propia del catálogo rechaza aun si fetch responde tarde; request privado de sites se cancela al cerrar sesión y no acepta éxito tardío. El pendiente local queda resuelto dentro de la ampliación autorizada por leader.

Evidencia fresca propia: `npx vitest run --maxWorkers=2 --reporter=dot` exit0, **241/241 tests en 31 archivos**; `npm run typecheck && npm run lint && npm run build` exit0; `git diff --check` exit0. Chunk576,29 kB >500 kB sigue en F-010; aviso HydrateFallback no falla tests. npm ci reutilizado del entorno verificado por instrucción, sin atribuir ejecución al reviewer.

Criterios 1–4 corroborados localmente: contrato directo de UUID/métodos/DTOs/null/omitido/filtros/status, catálogo value/label y estados error/vacío/reintento, sesión protegida para sites, errores identificables por campo, invalidaciones de listas/detalles workplace al editar cliente, coordenadas manuales preservadas sin Maps o tras fallo de loader y radio175 válido. El listado empleados envía sólo filtros acordados, conserva Provincia visible y su selección en alta/edición; no filtra páginas localmente ni inventa mapping/UUID. Criterio6 con checks locales en verde y límites explícitos. Criterio5 NO certificado: fetch controlado/UI mocks no acreditan crear lugar/empleado y recuperar UUID persistido por API ni interoperabilidad Android.

Dependencias de API/cuenta opt-in/correo/fixture siguen en `progress/leader/dependencias-integracion.md`, con health local conexión rechazada. No se ejecutó navegador/API/Android ni se fabricaron credenciales, migraciones o datos. No se editó producto/backlog/SYNCED/Git/proveedor. Esta aprobación local no cierra F-010 ni el criterio integral; leader conserva ownership de estado/dependencias. Slot de verificación liberado para reviewer mobile.
