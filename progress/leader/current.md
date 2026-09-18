# Estado actual — leader admin_web_app

Fecha: 2026-09-17

## Feature activa

F-005 — Clientes, provincias y lugares de trabajo.

El humano autorizó continuar aun cuando F-003 y F-004 permanecen en `pending_review`; esto no equivale a aprobarlas.

## Estado F-005

- P-07 ratificada por el humano y materializada como contrato frontend temporal.
- Clientes, provincias y lugares implementados mock-first con servicios, React Query, validaciones y errores contractuales.
- Leaflet y geocodificación mock cargados bajo demanda; adaptador Geoapify preparado para la integración HTTP real.
- lint, typecheck, 33 pruebas, build y smoke desktop/mobile exitosos.
- Estado: `pending_review`; falta revisión independiente.

## Cola de revisión

- F-003 — autenticación + navegación, incremento A.
- F-004 — gestión de empleados.
- F-005 — clientes, provincias y lugares de trabajo.

El reviewer independiente continúa no disponible; no se sustituye su veredicto con auto-revisión.
