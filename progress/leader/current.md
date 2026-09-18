# Estado actual — leader admin_web_app

Fecha: 2026-09-18

## Feature activa

F-005 — Clientes, provincias y lugares de trabajo.

El humano autorizó continuar aun cuando F-003 y F-004 permanecen en `pending_review`; esto no equivale a aprobarlas.

## Estado F-005

- P-07 ratificada por el humano y materializada como contrato frontend temporal.
- Clientes, provincias y lugares implementados mock-first con servicios, React Query, validaciones y errores contractuales.
- Google Maps Platform sustituye a Leaflet/Geoapify por decisión humana del 2026-09-18: Maps JavaScript API + Places Autocomplete diferidos, sin persistir resultados del geocoder.
- El contrato backend se conserva; Autocomplete carga con la clave configurada y el manejo de referrer no autorizado fue verificado en localhost. Falta validar clic/arrastre en un origen permitido y completar la revisión independiente.
- Estado: `pending_review`; falta revisión independiente.

## Cola de revisión

- F-003 — autenticación + navegación, incremento A.
- F-004 — gestión de empleados.
- F-005 — clientes, provincias y lugares de trabajo.

El reviewer independiente continúa no disponible; no se sustituye su veredicto con auto-revisión.
