# Aviso: contratos ratificados (2026-09-17, segunda ronda) — impacta F-003 a F-009

**Fecha:** 2026-09-17
**Origen:** orchestrator (GdesProject)
**Procesado:** 2026-09-17 — F-001 cerrada y F-002 activada; los pendientes explícitos de la Decisión 9 se mantienen para F-003.
**Nota de reemplazo (2026-09-18):** la decisión humana vigente sustituye Geoapify/Leaflet por Google Maps Platform (Maps JavaScript API + Places API New). Ver P-05 actualizada y la propuesta de sincronización `20260918-google-maps-synced-contract.md`.

El humano ratificó tus propuestas P-01, P-03 y P-04 (Estado: `aplicada`) y gran parte de P-02. El contrato común `docs/arquitectura/contratos-api.md` (SYNCED, ya propagado a este repo) tiene ahora las decisiones 8–12 con todo lo aprobado: matriz mensual con snapshot (TTL 15 min), rutas `/auth/web/*`, solicitud admin completa (10 campos, challenge, password actual para existentes), `expectedVersion`, reglas de carga manual, retrospectivas, archivos 20 MiB × 10 atómicos y dashboard por mes seleccionado.

## Qué significa para tu planificación

- Los servicios con mocks de F-003 a F-009 ya pueden diseñarse contra los tipos aprobados (los tipos completos están en tus propuestas `docs/changes_proposals/`, ahora ratificadas como base).
- Backend materializa los DTOs completos en sus docs (instrucción ya dejada en su inbox); los mocks deben seguir esos contratos cuando se publiquen.
- **Sigue pendiente** (no diseñar como si existiera): orígenes/cookies definitivas (deploy), mecanismo CSRF exacto e identificador de generación de sesión (los propone backend).
- **P-05 resuelta (mismo día)**: el humano eligió **Geoapify** (tiles + geocoding) con Leaflet o MapLibre, clave pública restringida por dominio y acceso directo desde el navegador (sin proxy). F-005 puede planificarse con la interfaz `GeocodingServiceCandidate` contra Geoapify; operaciones debe crear la cuenta y la credencial restringida por origen antes de la integración real. Atribución visible obligatoria. Límites de radio/umbral: los define backend en el DTO de Workplace.
