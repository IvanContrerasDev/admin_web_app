# F-012 — Propuesta de contratos elevada para ratificación humana

**Fecha:** 2026-10-13
**Origen:** admin_web_app / implementer-admin
**Estado:** pendiente de procesamiento por leader y ratificación humana

## Entrega

Propuesta creada: [DTOs de planillas, documentos y métricas](../../../docs/changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md). El nombre conserva las referencias históricas de F-007/F-008/F-009; la fecha efectiva es 2026-10-13. No representa aprobación retroactiva.

Se documentaron tipos, rutas, envelopes, filtros, orden, lotes y descarga `expiresAt` de ambas entidades, distinguiendo reglas ya ratificadas (decisión 11) de candidatos del frontend mock-first. Las tres task specs enlazan al artefacto real y a sus secciones relevantes.

## Decisiones solicitadas al humano

1. DTOs completos, respuestas de lote, DELETE documental 204 y `expiresAt` obligatorio en ambas descargas (TTL 15 min).
2. Reemplazo de planilla: propuesta conservar estado y metadata original; confirmar auditoría del reemplazador y protección concurrente.
3. Tipos de documento, semántica textual de `uploadedBy`, fechas de carga inclusivas GMT-3, desempates y detalles multipart/nullable pendientes de materialización backend.
4. Coherencia provincial de métricas: global del mes vs matriz UI filtrada por provincia. Recomendada provincia compartida en Inicio/métricas/destinos; alternativas y efectos figuran en sección E. **No se agregó `siteId` ni se eligió una opción en código.**

## Acción del leader / orchestrator

- Elevar estos puntos al humano y registrar sus decisiones; no confundir aceptación de F-012 documental con ratificación de contratos.
- Leader es owner de `feature_list.json`: actualizar F-012 a `pending_review` y notas con entrega documental y ratificación pendiente tras procesar este inbox. El implementer no modifica el backlog en esta tarea.
- Solicitar al backend materialización de DTOs/transporte, permisos, catálogo de errores y evidencias enumeradas en la propuesta.
- Tras aprobación, orchestrator actualiza template y propaga archivos sincronizados. F-010 sigue bloqueada hasta ratificación, propagación y disponibilidad del backend de prueba, además de sus restantes dependencias.

## Límites y verificación

F-012 no modifica frontend, contratos TypeScript, Parte 8 ni archivos SYNCED. Estado documental: lista para revisión independiente; ratificación humana y materialización backend pendientes. Verificación local de enlaces y alcance del diff registrada en la task spec F-012; no corresponde ejecutar smoke UI para una entrega documental.
