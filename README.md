# GdeS Admin Web App

Frontend administrativo React + Vite + TypeScript para empleados, organización, registros, planillas y documentos. Funciona con mocks; el backend de negocio y la integración HTTP todavía están pendientes.

Requiere Node >=22 y npm según `package.json`. Instalar con `npm ci`, copiar `.env.example` a `.env.local` y ejecutar `npm run dev`. Comprobaciones: `npm run typecheck`, `npm run lint`, `npm test -- --run` y `npm run build`.

`VITE_SERVICE_MODE=mock` activa fixtures. `http` exige `VITE_API_BASE_URL`, pero no habilita por sí solo una integración completa: ver [limitaciones HTTP](docs/integracion.md). Google Maps requiere clave pública `VITE_GOOGLE_MAPS_API_KEY` restringida por origen/API; no poner secretos en variables VITE.

- [Requisitos funcionales](docs/spec_definition.md) y [cobertura por sección](docs/cobertura-requisitos.md).
- [Diseño y decisiones vigentes](docs/diseno-frontend.md).
- [Integración y pendientes](docs/integracion.md), [contrato común](docs/arquitectura/contratos-api.md).
- [Estado actual del leader](progress/leader/current.md), backlog en `feature_list.json`.

La política documental está en [flujo de trabajo](docs/convenciones/flujo-de-trabajo.md): documentación por tema, decisión actual y racional breve, código como evidencia de funcionamiento y pendientes explícitos. Sin historiales/changelog; tareas e inbox solo activos, propuestas temporales hasta consolidación y sync verificado.
