# Plan F-018 — A-05 binarios/legajos

Implementer-admin, UNA feature. Ejecución autorizada. Tras F-014/F-015, sin commits/worktrees ni edición simultánea de transporte.

1. Leer contrato Archivos y métricas, propuesta parcial vigente y proveedor docs03. Enumerar campos que ya coinciden con acuerdo y pendientes exactos: DTOs de lectura/filtros/validaciones precisas de documentos, reintento ambiguo y representación completa de contingencia. Código proveedor es evidencia de disponibilidad; no ratifica abiertos. No detener cambios independientes por esos puntos.
2. En tipos de inputs de timesheets/documents y formularios de uploads/reemplazo conservar File/Blob desde selección hasta servicio. Construir FormData con files repetidos; replacement file único y expectedVersion. Tests con bytes no vacíos verifican cuerpo FormData, nombre/bytes y ausencia Content-Type manual. En adaptador detectar FormData sin JSON.stringify; credenciales/CSRF de F-014 se conservan.
3. Cambiar getDownload a /timesheets/:id/file y /documents/:id/file. Cubrir expiresAt, firma 15 min y reconsulta para URL vencida/error, sin persistir URL como dato estable. No reescribir hostname de firma ni usar /download.
4. Reemplazo conserva identidad/período/secuencia/uploader/fecha original, vuelve PENDING y exige expectedVersion; conflictos409 no sobrescriben ni borran archivo anterior. Agregar auditoría/version sólo según acuerdo. INTERNAL_RULES sustituye alias mock y se conserva etiqueta Normas internas. Leer uploadedBy/replacedBy/nullables únicamente según contrato ratificado; registrar campos aún abiertos.
5. Contingencia workplaceId null debe estar disponible sin lugar ficticio. No inventar site/client/provincia en lecturas ni métricas; si backend B-04 aún no entrega forma compatible, registrar operación/DTO bloqueado y mantener entrada null preparada sin fabricar objeto.
6. Validación de lote: 1–10 archivos y límite20MiB inclusivo/formatos acordados; UI preserva selección y muestra fallo sin retry automático de mutaciones. Error de red/upload incierto no dispara repetición automática; indicar resultado incierto sin introducir semántica de idempotencia no ratificada.
7. Tests focalizados de multipart/bytes/límites/conflicto/descarga/null y npm typecheck/lint/vitest/build. Atomicidad real y fallos storage sólo se certifican con proveedor/storage local y fixture; caso Android requiere archivo compartido real. Registrar evidencia o bloqueo preciso sin afirmarlo por mocks.

## Foco de revisión

Bytes perdidos por metadata; Content-Type multipart manual; repetición incierta; conflicto expectedVersion; null convertido en objeto ficticio. No ratificar límites/patch/lecturas documentales abiertos por copiar implementación backend.
