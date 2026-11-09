# Archivos y métricas de Admin — puntos aún abiertos

**Estado:** parcial; decisiones aprobadas y contrato común vigente en [Archivos y métricas](../arquitectura/contratos-api.md#archivos-y-métricas). Los mocks Admin siguen siendo evidencia de UI, no autoridad para ampliar el contrato.

## Pendientes de ratificación

- **Consultas y DTOs de lectura:** ratificar los campos finales de listas/detalles y referencias a empleado, lugar, cliente, provincia y uploader; envelopes y comportamiento de paginación/filtros de planillas y documentos.
- **Normalización de filtros:** definir búsqueda sin acentos/case, allowlists, tratamiento de rangos de fecha invertidos, años permitidos y página fuera de rango. Los filtros `uploadedFrom`/`uploadedTo` deben conservar la fecha civil GMT-3 si se ratifica el esquema del mock.
- **Edición y validación de documentos:** concretar validaciones del catálogo/tipo y del nombre visible ya editables por spec, límite del nombre, comportamiento de PATCH vacío y reglas para tamaño cero. La capacidad de cambiar tipo/nombre no sigue abierta.
- **Reintentos de carga:** definir semántica de idempotencia del cliente ante pérdida de respuesta y carga repetida; no deducirla de los mocks.

Los contratos HTTP publicados por backend y sus límites vigentes están documentados en `backend_api_gdes/docs/03-contratos-api.md`; las pruebas E2E y los mocks no resuelven por sí solos estas decisiones de interacción Admin. Al ratificar los puntos abiertos, actualizar esta propuesta y retirar el archivo cuando no queden preguntas.
