# F-015 — resultado final

Estado: blocked exclusivamente para certificación navegador/API real. Corrección local del ítem de Review implementada y verificada; pendiente re-review independiente, sin autoaprobación.

Entrega: docs/tasks/015-organizacion-empleados-http.md (Registro y criterios actualizados). No se tocó Git/SYNCED/backlog/otros repos ni se alteró auth lifecycle.

Archivos tocados: src/types/users.ts; src/services/user-service.ts y user-service.test.ts; src/services/organization-service.test.ts; src/services/public-catalog-session.test.ts (nuevo); src/services/auth-service.ts send/requestProtected dentro de ampliación acotada autorizada; src/mocks/user-handlers.ts; src/features/auth/registration-form.tsx y registration.test.tsx; src/features/users/users-page.tsx y users.test.tsx; src/features/organization/client-form-page.tsx, client-detail-page.tsx, workplace-form-page.tsx; nuevos organization.test.tsx y workplace-map-failure.test.tsx.

Decisiones/evidencia: DTOs métodos UUID/nullables coinciden con proveedor. Catalog GET público value/label mapeado explícitamente; vacío/error/reintento controlados. /sites protegido y Bearer verificado mediante adapter compartido. Filtro/default siteId del listado eliminado por contraste spec11.2/90+contrato+allowlist backend y feedback leader; columna y alta/edición provincia conservadas. Sin filtros locales sobre páginas. Se invalidan detalles de lugares al editar nombre/estado de cliente. Errores identificables asociados a campos; genéricos conservados. Mapas siguen lazy y no bloquean coordenadas manuales; radio175 ya no falla por step10 del slider. Sin fallback HTTP ni UUID inventado en UI.

Verificación 2026-11-05:
- npm run typecheck exit0.
- npm run lint exit0.
- npx vitest run --maxWorkers=2 exit0: 31 archivos, 241 tests, 30.41s. Sin fallos propios/ajenos observados.
- npm run build exit0; warning chunk principal 576.29 kB (>500 kB), pendiente global F-010 preexistente.
- git diff --check exit0, lectura/verificación sin mutación Git.
- npm ci reutilizado de F-014 por instrucción expresa, sin nueva instalación.
- Rojo/verde observado catálogo/sesión, caché detalle, listado global, asociación de error y slider175. Tests HTTP usan fetch controlado y UI mocks explícitos; no acreditan persistencia backend ni navegador/cookies reales.

Bloqueo real: curl --max-time 3 -sS -i http://localhost:3000/health exit7 conexión rechazada 2026-11-05. Dependencias actualizadas en progress/leader/dependencias-integracion.md: API/cuenta opt-in/correo/fixture compartido no disponibles. No se levantó/migró/sembró backend. Para cerrar criterio integral falta navegador creando empleado/lugar y recuperando sus UUID reales persistidos. Interoperabilidad Android física separada pendiente. No quedan decisiones de DTO pendientes.


Corrección vigente de Review: send sólo enlaza controller/generación/headers de sesión si sessionBound=true (default privado/auth); GET /catalogs usa false y conserva AbortSignal propio, carrera de rechazo por abort y limpieza de listeners. /sites y otros privados mantienen protección, refresh y rechazo de respuestas tardías. Sin cambio de coordinación/CSRF/DTO/política offline.

TDD: antes del fix la regresión concurrente bootstrap401 diferido + catálogo diferido devuelve DOMException en vez de provincias; después pasa. Regresiones propias de señal del catálogo y recurso privado cancelado por logout también pasan (adapter HTTP con fetch diferido que ignora abort, para verificar el rechazo de la capa real). Focalizados auth/catalog/registro: 4 archivos31 tests verdes. Typecheck y lint completos exit0 tras cambio. Suite global241/241 en31 archivos y build final exit0, ejecutados serializados. `git diff --check` exit0. Registro reemplazado con evidencia vigente; Review del reviewer preservado para recheck. No quedan cambios locales independientes pendientes.
