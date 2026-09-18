# F-005 — Clientes, provincias y lugares de trabajo

**Estado:** pending_review  
**App(s):** admin  
**Creada:** 2026-09-17  
**Proveedor de mapas actualizado:** 2026-09-18

## Contexto

Construir la gestión de la estructura organizacional y la configuración geográfica circular de cada lugar de trabajo. F-003 y F-004 siguen pendientes de revisión independiente; el humano autorizó continuar sin considerarlas aprobadas.

## Alcance

**Incluye:**
- Clientes: listado paginado, búsqueda parcial, filtro de estado, alta, edición y activación/desactivación.
- Provincias: catálogo consultable de las seis provincias habilitadas, sin CRUD.
- Lugares de trabajo: listado paginado, búsqueda y filtros; alta, edición, detalle y activación/desactivación.
- Configuración `CIRCLE` con centro, radio en metros y umbral GPS opcional.
- Google Maps Platform mediante Maps JavaScript API y Places Autocomplete, cargados de forma diferida.
- Autocomplete argentino que solo centra el mapa; clic o arrastre para confirmar el centro; marcador, círculo real y slider de radio.
- Ubicación predeterminada y acción explícita para centrar con geolocalización del navegador.

**NO incluye:**
- CRUD de provincias, eliminación, polígonos, zonas múltiples o geocodificación inversa.
- Desactivación en cascada ni alteración de registros/planillas históricos.
- Cálculo frontend de validez GPS o reescritura de revisiones históricas.
- Persistir texto de dirección, Place ID, predicciones, viewport ni resultados de geocodificación de Google.
- Proxy backend para Google Maps ni cambios al DTO Workplace ratificado.

## Referencias

- `docs/spec_definition.md` §§28–37, 49–55, 58 y Parte 8.
- `docs/changes_proposals/20260917-p05-mapa-y-direcciones.md`.
- `docs/changes_proposals/20260917-p07-contrato-clientes-lugares.md`.
- `docs/changes_proposals/20260918-google-maps-synced-contract.md`.
- `docs/arquitectura/contratos-api.md` Decisión 12, pendiente de propagación desde template.

## Criterios de aceptación

- [ ] Clientes y lugares consultan mediante servicios + React Query con paginación y filtros server-side reproducidos por mocks.
- [ ] Alta/edición/estado respetan P-07 y no ofrecen borrado.
- [ ] La configuración geográfica conserva centro, radio, umbral GPS opcional y `shapeType=CIRCLE`.
- [ ] Maps JavaScript API y Places API (New) se cargan solo en el flujo geográfico.
- [ ] Autocomplete admite teclado, restringe a Argentina y seleccionar una sugerencia solo centra/encuadra el mapa.
- [ ] El payload no cambia hasta que la persona hace clic, arrastra el marcador o edita coordenadas.
- [ ] Clic en mapa dibuja/sincroniza Marker + Circle; slider e input actualizan el radio en metros.
- [ ] La geolocalización requiere una acción explícita y solo centra la cámara.
- [ ] No se persiste ni envía texto de dirección, Place ID ni ningún resultado del geocoder.
- [ ] Clave ausente y errores de carga no borran una selección existente; los inputs siguen disponibles.
- [ ] Atribución nativa de Google permanece visible.
- [ ] lint, typecheck, tests, build y validación en navegador desktop/mobile pasan.

## Notas de implementación

Se usa `@googlemaps/js-api-loader` con importación dinámica de las librerías `maps` y `places`. La variable pública es `VITE_GOOGLE_MAPS_API_KEY`, restringida por HTTP referrer y por API a Maps JavaScript API + Places API (New). El loader usa español, región Argentina y `authReferrerPolicy: "origin"`.

El contrato del backend sigue enviando `latitude`, `longitude`, `radiusMeters` y `gpsAccuracyThreshold`; no se agrega dirección. El volumen estimado de 100–200 configuraciones totales se considera compatible con el free tier indicado al tomar la decisión, pero operaciones debe conservar billing, alertas y revisión de precios.

## Registro de implementación

- F-005 activada y P-07 ratificada por decisión humana el 2026-09-17.
- Gestión de clientes, provincias y lugares implementada mock-first.
- El 2026-09-18 se sustituyeron Leaflet/Geoapify por Google Maps Platform por decisión humana.
- Se eliminaron el adaptador Geoapify, la búsqueda propia y las dependencias Leaflet.
- Autocomplete nativo de Google centra el mapa sin persistir el resultado.
- Clic/arrastre confirman centro; Marker, Circle, slider e inputs permanecen sincronizados.
- El contrato HTTP de Workplace y sus validaciones no cambiaron.
- Validación automática posterior: lint, typecheck, 7 archivos/31 tests y build exitosos.
- Navegador real 1072 × 800: formulario y `PlaceAutocompleteElement` verificados con la clave configurada. La prueba local detectó correctamente `RefererNotAllowedMapError` porque `http://localhost:5174` no pertenece a sus referrers autorizados; queda pendiente probar clic/arrastre contra un origen autorizado de preview o producción.

## Review

Pendiente de revisión independiente y de validación final en un origen autorizado de preview o producción. Los errores de ausencia, carga o referrer muestran recuperación explícita y no utilizan proveedores públicos alternativos.
