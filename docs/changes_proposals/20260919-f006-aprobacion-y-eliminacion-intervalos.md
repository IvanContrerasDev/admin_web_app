# F-006 — Aprobación pura y eliminación de intervalos

**Fecha:** 2026-09-19

**Estado:** ratificado por el humano; implementación mock-first aplicada; propagación por orchestrator y backend pendiente.

**Apps afectadas:** admin, backend y cualquier consumidor de estados de revisión.

## Motivo

El contrato sincronizado aún incluye `REJECTED` y limita la corrección a ADD/UPDATE. El humano decidió separar la aprobación pura de la corrección manual, eliminar el rechazo como estado y permitir eliminar intervalos durante una corrección sin borrar el registro completo.

`docs/arquitectura/contratos-api.md` está marcado `SYNCED-FROM-TEMPLATE` y no se modifica en este repositorio. Esta propuesta solicita al orchestrator propagar el cambio a la fuente común y al backend.

## Cambio ratificado

### Estados de revisión

```ts
type ReviewStatus = "NONE" | "PENDING" | "APPROVED" | "MANUAL_LOADED";
type IntervalReviewStatus = "NONE" | "PENDING" | "APPROVED";
```

`REJECTED` se elimina tanto del registro como del intervalo. Si la información es inválida, administración la corrige; la corrección queda `MANUAL_LOADED` y luego puede aprobarse.

### Aprobación pura

```http
PATCH /records/{id}/review
Content-Type: application/json
```

```ts
interface ReviewRecordRequest {
  expectedVersion: number;
  reviewStatus: "APPROVED";
}
```

La respuesta es `{ data: RecordDetail }` con `reviewStatus: "APPROVED"`, `version` incrementada y `updatedAt` actualizado. La operación no altera origen, observaciones, horarios, datos derivados ni la colección o contenido de intervalos. Un `expectedVersion` obsoleto devuelve `409 RECORD_VERSION_CONFLICT` con `retryable=false`.

### Eliminación durante la corrección

```ts
type RecordIntervalChange =
  | { operation: "ADD"; interval: RecordIntervalInput }
  | { operation: "UPDATE"; id: string; interval: RecordIntervalInput }
  | { operation: "DELETE"; id: string };
```

`DELETE` forma parte de `PATCH /records/{id}` y usa el mismo `expectedVersion`. Solo puede identificar un intervalo perteneciente al registro. La corrección debe conservar al menos un intervalo; intentar eliminar el último devuelve `422 RECORD_INTERVALS_REQUIRED`. El backend recalcula totales, completitud, ausencia, origen y revisión de la proyección, incrementa la versión y devuelve el detalle completo.

Los `AttendanceEvent` originales son evidencia inmutable: eliminar un intervalo de la proyección administrativa no habilita a borrar eventos de marcación.

## UI y pruebas requeridas

- El filtro, la matriz y el detalle no ofrecen ni renderizan `REJECTED`.
- El detalle ofrece “Aprobar registro” mientras no esté aprobado y usa la ruta separada.
- El editor permite eliminar cualquier intervalo salvo el último.
- Pruebas de aprobación verifican preservación exacta de origen, datos e intervalos y conflicto de versión.
- Pruebas de corrección verifican DELETE, recálculo, pertenencia del ID y protección del último intervalo.

## Criterio de propagación

Backend publica DTOs, ejemplos y catálogo de errores; el orchestrator actualiza el contrato sincronizado y coordina la eliminación de `REJECTED` en los demás repositorios antes de considerar completada la integración real F-010.
