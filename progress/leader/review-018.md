# Despacho reviewer — F-018

Rol reviewer local, repo exclusivo admin_web_app. Revisar docs/tasks/018-binarios-legajos-http.md y plan, Registro/progress/implementer-018/current.md, contrato Archivos y métricas y propuesta parcial; docs locales vigentes. No escribir código/backlog/SYNCED/otros repos/Git/subagentes.

Criterios: File/Blob real hasta FormData, bytes intactos, campos por rol, no Content-Type multipart manual; GET /file y URL expirada reconsultada; no /download ni persistencia de URL firmada; INTERNAL_RULES; expectedVersion/reemplazo PENDING preserva identidad/secuencia/uploader/fecha,409 no sobrescribe. Lugar null sin objeto ficticio ni provincia inferida. UploadedBy/replacedBy/nullables sólo acordados, candidato no se ratifica por proveedor. Tamaños20MiB inclusivo y1–10archivos; atomicidad/fallo storage requiere proveedor real. Mutaciones inciertas sin retry automático ni falsa semántica idempotente. Tipo/nombre de documento siguen editables sin ratificar límites pendientes.

Correr verificaciones frescas serializadas maxWorkers2 y diff-check. Declarar criterios demostrados/localmente bloqueados frente a integración de proveedor/Android, sin aprobar atomicidad por mocks. Registrar Review spec y progress/reviewer/current.md, devolver sólo task_spec, veredicto, n_items, progress_file.
