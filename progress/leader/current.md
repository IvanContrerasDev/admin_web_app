# Estado actual — leader admin_web_app

Fecha: 2026-09-18

## Feature activa

F-005 — Clientes, provincias y lugares de trabajo.

El humano autorizó continuar aun cuando F-003 y F-004 permanecen en `pending_review`; esto no equivale a aprobarlas.

## Estado F-005

- P-07 ratificada por el humano y materializada como contrato frontend temporal.
- Clientes, provincias y lugares implementados mock-first con servicios, React Query, validaciones y errores contractuales.
- Google Maps Platform sustituye a Leaflet/Geoapify por decisión humana del 2026-09-18: Maps JavaScript API + Places Autocomplete diferidos, sin persistir resultados del geocoder.
- El contrato backend se conserva; Autocomplete, clic, arrastre y funcionamiento general fueron validados por el humano desde un dominio autorizado el 2026-09-18.
- Estado: `pending_review`; falta únicamente revisión independiente.
- Estado: `pending_review`; falta revisión independiente.

## Cola de revisión

- F-003 — autenticación + navegación, incremento A.
- F-004 — gestión de empleados.
- F-005 — clientes, provincias y lugares de trabajo.

El reviewer independiente continúa no disponible; no se sustituye su veredicto con auto-revisión.
