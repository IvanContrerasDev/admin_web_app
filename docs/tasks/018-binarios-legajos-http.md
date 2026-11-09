# F-018 — A-05 Binarios y legajos reales

**Estado:** pending
**App(s):** admin
**Creada:** 2026-11-04

## Contexto

Paquete autorizado por inbox 20261102. El cierre integral F-010 conserva sus dependencias; esta tarea separa trabajo implementable de validación cross-app.

## Alcance

Conservar File/Blob hasta FormData y enviar multipart sin Content-Type manual. Aplicar únicamente campos/roles/nullables ratificados; INTERNAL_RULES; descargas /file con renovación de URL vencida. Contingencia workplaceId null sin lugar ficticio. Reemplazo con expectedVersion conserva identidad/secuencia y vuelve a PENDING. Nunca repetir upload de resultado incierto automáticamente mientras semántica siga abierta.

No incluye ratificar requisitos abiertos, producción, modificar otros repos/SYNCED ni mutaciones Git. Una dependencia de integración no bloquea correcciones independientes con contrato vigente.

## Referencias (fuente de verdad)

- docs/arquitectura/contratos-api.md; docs/spec_definition.md; docs/diseno-frontend.md; docs/integracion.md.
- Proveedor sólo lectura: ../backend_api_gdes/docs/03-contratos-api.md; código como evidencia, sin ratificar contradicciones.
- Archivos a cargo: src/features/{timesheets,documents}, src/services/{timesheets-service,documents-service}.ts, tipos y mocks/tests propios; FormData en adaptador únicamente tras cierre de modificaciones F-014, nunca simultáneo.
- Dependencias locales F-014/F-015 entregadas y aprobadas independientemente; sus criterios integrales siguen bloqueados. No esperar su certificación API para implementar este dominio. Backend B-01–B-03/fixture y Q-01 requeridos para validación integral.

## Criterios de aceptación

- [ ] Uploads contienen bytes File/Blob reales hasta FormData; no JSON de filename/size ni Content-Type multipart manual. Admin usa created completos, sin envelope mobile.
- [ ] Descarga GET /timesheets/:id/file y /documents/:id/file, expiresAt; renovación explícita si expira URL, pruebas de bytes.
- [ ] Reemplazo conserva identidad/secuencia/metadata original y PENDING con expectedVersion; 409 preserva original, auditoría uploadedBy/replacedBy y nullables acordados.
- [ ] INTERNAL_RULES y workplaceId null soportados por tipos/UI/lecturas sin inventar sitio/provincia; documentos permiten cambiar tipo/nombre conforme spec.
- [ ] Pruebas 1–10 archivos, 20 MiB inclusivo, atomicidad y fallo storage. Validaciones documentales precisas/reintento ambiguo no ratificados quedan bloqueados por archivo.
- [ ] Navegador/API/storage local verifica bytes y archivo Android; no afirmar atomicidad por test mock ni repetir upload incierto.
- [ ] npm ci, typecheck, lint, vitest run y build con evidencia fresca; navegador/API con limitaciones explícitas.

## Notas de implementación

Plan técnico en docs/tasks/018-binarios-legajos-http-plan.md. No tocar transporte antes de terminar F-014. Si un DTO sigue abierto, implementar sólo la parte acordada y registrar campo/operación bloqueado sin inferir requisitos.

## Registro de implementación

Pendiente del implementer.

## Review

Pendiente de reviewer independiente.
