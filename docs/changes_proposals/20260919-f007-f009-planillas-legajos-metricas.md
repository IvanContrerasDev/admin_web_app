# Pendiente: contratos de archivos y métricas

**Estado:** pendiente de ratificación y materialización backend. **Origen:** Admin / F-012. El código mock documenta el comportamiento actual, sin aprobar el contrato de red. Esta propuesta se elimina una vez consolidados los acuerdos y verificado el sync.

## Destino canónico y evidencia

Acuerdos ya vigentes: [contrato común — archivos y métricas](../arquitectura/contratos-api.md#archivos-y-métricas). No se reabren límites 20 MiB/10 archivos, atomicidad, extensiones, workplaceId, firma 15 minutos, prohibición de borrar planillas ni los cuatro nombres de contadores por mes seleccionado.

DTOs implementados: `src/types/timesheets.ts`, `documents.ts`, `dashboard.ts`; llamadas actuales: `src/services/timesheets-service.ts`, `documents-service.ts`, `dashboard-service.ts`; comportamiento simulado: `src/mocks/*-handlers.ts`. Sus tipos son evidencia de mocks, no contratos públicos aprobados. Estado y brechas locales: [integración](../integracion.md).

## Puntos por resolver

| Tema | Candidato actual / decisión necesaria |
|---|---|
| DTOs y envelopes completos | Ratificar listas/detalles, referencias empleado/lugar/cliente/provincia/uploader, batches `{ data: { created: [...] } }`, edición y DELETE documento 204. No sustituir sin acuerdo respuestas diseñadas para mobile (`timesheetIds/documentIds`) por las formas mock Admin. |
| Descarga | Ambos esquemas mock requieren `{ downloadUrl, expiresAt }`; el acuerdo vigente solo exige downloadUrl y firma de 15 min. Ratificar expiresAt UTC calculado por servidor, permisos por recurso y errores. |
| Reemplazo planilla | Mock conserva estado, ID, secuencia, empleado/lugar/período, createdAt y uploader original; actualiza archivo/updatedAt. Elegir conservación de estado o vuelta a PENDING; definir auditoría del reemplazador y concurrencia sin version/ETag actual. Un fallo debe preservar el original. |
| Secuencias y referencias | Secuencia por empleado UUID/lugar/mes/año, asignación transaccional; acordar referencias actuales o históricas ante cambios organizativos y desempates estables (mock UUID ASC). |
| Documentos | Ratificar catálogo de nueve tipos del código, renombre/tipo sin reemplazo, límites de nombre (mock trim 1–120), PATCH vacío, fileSizeBytes positivo y archivos vacíos. |
| Filtros | Mock busca sin acentos/case, combina AND y filtra uploadedBy por texto del cargador, no UUID. uploadedFrom/To son fechas civiles inclusivas GMT-3. Acordar normalización, allowlists, rangos invertidos, años permitidos y página fuera de rango. |
| Subida real | Metadata mock no son bytes. Propuesta multipart: timesheets employeeId UUID/workplaceId/month/year/files repetidas; documents employeeId/type/workplaceId opcional/files; PUT reemplazo parte file. Acordar null de workplace, permisos por rol (mobile deriva empleado de sesión), reintentos/idempotencia y transporte viable para hasta 200 MiB más overhead. |
| Errores | No ratificar automáticamente códigos mock. Backend publica validación, permisos, firma/almacenamiento, duplicación/reintento y concurrencia con status/retryable. |
| Métricas | Query actual solo month/year; el código además exige `byProvince: { id, name, pendingTimesheets, incompleteRecords, pendingReviewRecords, recordsWithAbsence }[]`. Ni ese desglose ni su semántica son contrato ratificado. Los enlaces globales sin siteId van a matriz con provincia predeterminada: elegir un alcance consistente. |

## Alcance provincial por decidir

1. Scope provincial: selector en Inicio, siteId de provincia del lugar en métricas y destinos.
2. Scope global: habilitar destino mensual global real, sin imponer provincia.
3. Contador global con elección/aviso de provincia al navegar, sin prometer que el destino representa todo el contador.

Confirmar además si byProvince se conserva y con qué reglas. Los contadores se calculan sobre todo el conjunto del mes, no páginas; ausencias cuenta registros una sola vez. Mock de registros determinista puede no incorporar correcciones runtime: es limitación de implementación, no semántica del servidor.

## Cierre

Humano resuelve puntos abiertos; backend publica DTOs, transporte, permisos y errores; orchestrator incorpora decisión vigente y racional breve al contrato y propaga. Evidencia real: límites de tamaño/cantidad, lote inválido sin persistencia, secuencias concurrentes, fallo de reemplazo, firmas/permisos, fecha cerca de medianoche GMT-3 y contador/destino coherentes. Mocks y esta propuesta no desbloquean F-010.
