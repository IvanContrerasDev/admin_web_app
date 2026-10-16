# F-012 — Cierre documental pre-integración

**Estado de entrega:** pending_review; `feature_list.json` aún figura pending y requiere procesamiento del leader.

## Alcance y criterios

- [x] DTOs candidatos de planillas/documentos/métricas elevados: expiresAt en ambas descargas, estado/metadata al reemplazar, tipos/fechas/uploadedBy, multipart/nullable/desempates y coherencia provincial.
- [x] Evidencia mock diferenciada de contrato ratificado y backend disponible.
- [x] Entrega elevada al leader/humano; [inbox activo](../../progress/leader/inbox/20261013-f012-ratificacion-planillas-documentos-metricas.md).
- [ ] Reviewer independiente y procesamiento de estado por leader. No confundir cierre documental con ratificación contractual.

## Fuentes y evidencia actual

[Propuesta pendiente](../changes_proposals/20260919-f007-f009-planillas-legajos-metricas.md) conserva diferencias sin ratificar. [Contrato común](../arquitectura/contratos-api.md) centraliza acuerdos y candidatos cross-app; [integración](../integracion.md) contiene diferencias reales y pendientes. Código contrastable en `src/types/{timesheets,documents,dashboard}.ts`, servicios y mocks homónimos. Documentos filtran por fecha civil Argentina; descargas exigen expiresAt. El código actual exige byProvince; la propuesta pendiente lo registra sin ratificación automática.

F-012 no implementa producto. La propuesta temporal se retira solo tras consolidación y sync verificado por orchestrator. No se muta backlog ni se aprueban candidatos por esta limpieza. F-010 requiere además materialización backend y cierre de sus otras dependencias.
