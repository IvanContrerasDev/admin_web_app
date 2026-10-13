# Estado de Admin y propuestas ya sincronizadas (2026-10-12)

**Origen:** orchestrator de GdesProject  
**Estado:** pendiente de procesamiento por leader admin

## Hallazgos

- El contrato común fue sincronizado con Google Maps, las decisiones F-006 de aprobación/eliminación de intervalos y la referencia a los DTOs ratificados P-06/P-07.
- Las propuestas `20260918-google-maps-synced-contract.md` y `20260919-f006-aprobacion-y-eliminacion-intervalos.md` ya reflejan propagación al template. F-006 detalle/eventos permanece aprobado para mocks con materialización backend pendiente.
- El backlog actual ya representa F-011, F-012, F-013 y F-010 como `pending`; `progress/leader/current.md` propone F-011 → F-013 → F-012 → F-010. No hace falta volver a representar estas tareas como propuestas de cambio al conocimiento común.

## Trabajo solicitado

1. Procesar este inbox y confirmar que las features operativas pendientes sigan en `feature_list.json` como `pending`/próximos pasos. El leader local es el único owner de ese archivo y del orden de cola.
2. Mantener F-011/F-013 como trabajo de corrección y F-010 como integración; mantener F-012 como feature documental pre-integración. No convertir implementación funcional pendiente en `changes_proposals`; reservar esas propuestas para cambios a conocimiento común/contratos.
3. Antes de F-010, coordinar con backend la materialización de P-01..P-07 y F-006. El humano quiere mantener web/backend como proyectos Vercel separados, pero decidirá los dominios finales más adelante; considera `admin.prolimpservicios.com`. Con API en `backend-gdes.vercel.app` sería cross-site; con `api.prolimpservicios.com`, same-site pero cross-origin. Mantener P-02 abierto hasta tener URLs reales/CSRF/generación y exigir matriz de navegador para restauración/refresh. CORS no es fallback para cookies bloqueadas; acordar alternativa same-site o proxy/BFF si la prueba falla.
4. Revisar si `F-010.contract_dependencies` debe enumerar explícitamente P-06/P-07 y F-006 detalle además de P-01..P-05; ajustar el backlog solo si el leader confirma que la estructura actual no expresa ya esas dependencias indirectas.
5. Incorporar este estado en `progress/leader/current.md` al procesar el inbox, preservando cambios locales que estén en curso. No es necesario duplicar decisiones comunes dentro de archivos `SYNCED-FROM-TEMPLATE`.

## Referencias

- `docs/arquitectura/contratos-api.md` (sincronizado desde el template).
- `docs/changes_proposals/20260917-p02-sesion-web.md`.
- `docs/changes_proposals/20260919-f006-detalle-registro-eventos.md`.
- `feature_list.json` y tareas 011–013 (propiedad del leader local).
