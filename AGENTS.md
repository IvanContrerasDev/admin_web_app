# GdeS Admin Web App — contexto para agentes

SPA administrativa React + Vite + TypeScript, implementada con servicios mock-first. La integración real sigue pendiente; ver [integración](docs/integracion.md).

La [especificación funcional](docs/spec_definition.md) conserva los requisitos; [diseño frontend](docs/diseno-frontend.md) explica las decisiones locales actuales y su racional. Los acuerdos cross-app viven en [contratos comunes](docs/arquitectura/contratos-api.md). Código y tests son evidencia del comportamiento implementado; no equivalen a aprobación de un contrato nuevo. Cambiar DTOs requiere consulta humana específica.

Aplicar la política documental común de [flujo de trabajo](docs/convenciones/flujo-de-trabajo.md): documentación por tema, decisión vigente con racional breve, evidencia del código ante ambigüedad y requisitos pendientes explícitos. Sin historiales/changelog; consolidar antes de retirar tareas/inbox resueltos y eliminar propuestas tras incorporación y sync verificado.

Este repo tiene leader, reviewer e implementer-admin propios en `.agents/agents/`; backlog en `feature_list.json` y estado vivo en `progress/<rol>/current.md`. El leader es owner del backlog, el implementer no se autoaprueba. Leer skills del stack y [reglas de superpowers](docs/convenciones/superpowers.md) antes de implementar. Los archivos `SYNCED-FROM-TEMPLATE` son de solo lectura; cambios por propuesta al orchestrator. No mutar Git ni instalar skills sin confirmación humana.
