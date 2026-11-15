# Diseño frontend vigente

## Fuentes y alcance

La [spec](spec_definition.md) conserva las 95 secciones de requisitos, incluidos los todavía no implementados; [cobertura](cobertura-requisitos.md) los vincula a módulos y verificaciones previstas. La implementación real se comprueba en `src/`. Los acuerdos cross-app pertenecen al [contrato común](arquitectura/contratos-api.md); sus DTOs no se redefinen en este documento. Las capacidades HTTP pendientes se detallan en [integración](integracion.md).

## Arquitectura y racional

React + Vite + TypeScript estricto, React Router, TanStack Query, RHF + Zod y Tailwind; se conserva la elección aprobada para una SPA administrativa desacoplada del backend. `src/app/` contiene router/providers, `features/` pantallas, `services/` límites de dominio/transporte, `types/` esquemas y `mocks/` fixtures.

UI → Query → servicios → adaptador. `create-service-adapter.ts` selecciona mock (default incluso si falta la variable) o HTTP; modo desconocido y HTTP sin URL fallan explícitamente. El mock reproduce filtros/orden/paginación del servicio; no acredita disponibilidad ni controles reales de backend. Los comandos locales `npm run dev` (HTTP, localhost:5173) y `npm run demo` (mock, localhost:5174) fijan el transporte por configuración Vite, independientemente de modos heredados en env. Ambos fallan si su puerto está ocupado. La URL HTTP sigue siendo configurable; login y persistencia exactos de DEMO en [integración](integracion.md#arranques-locales-dev-y-demo). Los builds conservan la selección genérica por env. Completar F-010 sigue siendo necesario para certificar la integración real.

`ServiceClient` valida con Zod `{data}`, páginas `{data,pagination}` y la matriz con `meta`; 204 es vacío. `ServiceError` centraliza fallos de red/HTTP/contrato. Query tiene `staleTime=30000`, hasta dos reintentos si `retryable`, `refetchOnWindowFocus=false`, sin retry de mutaciones (`src/app/query-client.ts`). La renovación auth local de F-014 y sus límites de navegador se describen en integración; Backoff/Retry-After y certificación integral siguen pendientes en F-010.

UTC en transporte; fecha civil y visualización en `America/Argentina/Buenos_Aires`. No decidir día por timezone del navegador: evita errores cerca de medianoche. Adjuntos centralizados en `src/lib/attachments.ts`: pdf/jpg/jpeg/png/doc/docx/txt, 20 MiB (20971520 bytes), máximo diez, lote inválido rechazado completo.

## Navegación, UI y decisiones aprobadas

Interfaz en español, desktop-first, tema claro. Sidebar con Inicio, Registros, Usuarios, Clientes, Lugares de trabajo, Planillas y Documentos. Se conservan Clientes/Documentos por decisión humana explícita, consolidada en este diseño; el legajo por empleado usa `/usuarios/:userId/legajo`.

Skeletons por estructura para carga inicial de métricas/tablas/matriz/forms/detalles/mapas/sesión/metadata y paginación; respetan reduced-motion y lectura accesible. Errores con reintento, vacíos y feedback de mutación siguen diferenciados. Se aprobó implementarlos ahora para cumplir la spec y evitar falsas tablas vacías. Controles compactos desktop: mínimo 36 px desde 1024 px, sin reducir controles existentes de 44 px (`src/styles.css`, capa base); decisión humana expresa de densidad operativa.

Work Sans y paleta base `#0D80AE`, `#62882B`, `#ED701E`, `#0F172A`, `#EDF2F5`; estados con texto/iconos además de color, foco visible y diálogos confirmables. Tema oscuro y adaptación mobile completa quedan fuera del MVP.

## Módulos implementados con mocks

| Tema | Comportamiento actual y racional | Evidencia |
|---|---|---|
| Sesión | Login/challenge mínimo 2FA, bootstrap anónimo normal, solo ADMIN/SUPER_ADMIN; access/CSRF en memoria. Renovación HTTP single-flight y coordinación Web Locks/BroadcastChannel; logout cancela y limpia Query antes de la revocación. Cookies reales, fallback y logout offline/recarga siguen pendientes en integración. Registro público usa catálogo anónimo /catalogs; sólo valida, no envía hasta A-03. /sites es protegido y usa Bearer. | `src/features/auth/`, `src/services/auth-service.ts` |
| Empleados | Tabla global con DNI/teléfono y Provincia visible, RHF/Zod, fechas Argentina dinámicas, feedback, búsqueda/estado URL y paginación normalizada según contrato. El filtro provincial extra del mock se retiró en A-02 para no enviar siteId rechazado por el proveedor. Enlaces a planillas con UUID employeeId y legajo por ruta. | `src/features/users/`, `src/types/users.ts` |
| Organización | Clientes y lugares ACTIVE/INACTIVE, sin eliminación/cascada; provincias como Site. Mapa Google Maps + Places (New), lazy; coordenadas/radio manuales siguen disponibles sin key y ante fallo Maps. Búsqueda sólo centra, centro persistible por selección manual. No guardar geocoder ni dirección como dato de dominio. | `src/features/organization/`, `src/services/organization-service.ts` |
| Matriz | Un mes, vista global inicial con provincia opcional elegida por el usuario; filas empleado–lugar con actividad y 28–31 días completos; sticky headers, scroll acotado y carga automática de 50 filas, sin virtualización. Totales oficiales conservan minutos. | `src/features/records/`, `src/types/records.ts` |
| Snapshot | Filas/totales congelados, TTL fijo 15 min, error 410 al expirar; reinicio desde primera página, sin paginar automáticamente tras error. Evita mezclar páginas de distintas lecturas. | `src/mocks/records-handlers.ts` |
| Corrección | Detalle/eventos bajo demanda; alta/corrección/versionado y aprobación pura separados. ADD/UPDATE/DELETE conservan al menos un intervalo; históricos abiertos y solapamientos intactos se preservan, nuevos/modificados se validan. No borrar registros ni modificar eventos originales. | `src/lib/record-interval-validation.ts`, `src/services/records-service.ts` |
| Planillas | Filtros URL, detalle por ID, lote metadata atómico, estado, reemplazo confirmado y descarga mock 15 min; sin borrar ni OCR/generación de registros. Preservar estado al reemplazar es brecha mock: el contrato vigente exige PENDING, expectedVersion y auditoría conservando identidad; se corrige en A-05. | `src/features/timesheets/`, `src/types/timesheets.ts` |
| Documentos | Global y por empleado, detalle por ID estable al cambiar filtros, nueve tipos, fechas de carga inclusivas Argentina; renombrar/tipo y DELETE confirmado 204 mock. Sin vínculo técnico a ausencias. | `src/features/documents/`, `src/types/documents.ts` |
| Inicio | Cuatro contadores mensuales globales más desglose `byProvince`. Tarjetas con contenedor article y enlaces hermanos globales/provinciales abren destino global conservando mes/año/filtro, sin provincia automática; desglose conserva alcance provincial mostrado. A-04 entregada para revisión independiente. | `src/features/dashboard/`, `src/types/dashboard.ts` |

El mock de métricas de registros ahora lee el mismo estado runtime de registros de su adaptador; planillas comparten store. Invalidaciones de alta/corrección/aprobación reinician matriz desde primera página. Esta evidencia mock no certifica ingesta Android ni agregación de la API real; A-04 conserva ese pendiente de integración.

## Requisitos aún pendientes

F-010 debe verificar auth completa, solicitud administrativa/email/confirmación/recuperación de contraseña, transporte multipart, DTOs/errores/permisos reales, orígenes/cookies/CSRF, acceso público a catálogos, mapas con credencial, hosting de deep links, concurrencia, volumen (<600 empleados, miles de registros) y accesibilidad. F-011 y F-013 aprobadas por reviewer independiente; F-012 entrega documental aprobada independientemente, sin ratificar candidatos. Los acuerdos de archivos/métricas ya vigentes se enlazan sin reabrirlos: expiresAt/15 min, INTERNAL_RULES, byProvince, navegación global, reemplazo PENDING con expectedVersion y auditoría. Los puntos realmente abiertos de lecturas/filtros/validaciones documentales y reintento ambiguo siguen en la propuesta parcial. Warning de chunk principal >500 kB reservado a F-010. No declarar estas dependencias resueltas por el cierre de features mock.

Fuera de MVP: CRUD de provincias/administradores, asignación fija empleado–lugar, borrado de registros/planillas, edición masiva, OCR, vínculos documento–ausencia, turnos unificados entre días, duración de ausencias, analítica avanzada, polígonos, realtime/offline/virtualización, vencimientos/versionado/alertas documentales y personalización UI.
