# Propuesta de sincronización — Decisión 12: Google Maps Platform

**Fecha:** 2026-09-18  
**Origen:** admin_web_app / decisión humana  
**Estado:** pendiente de propagación por orchestrator  
**Archivo común afectado:** `docs/arquitectura/contratos-api.md` (`SYNCED-FROM-TEMPLATE`)

## Reemplazo solicitado

Reemplazar en la Decisión 12 la elección de Geoapify + Leaflet/MapLibre por:

- Proveedor/renderizador: Google Maps Platform, Maps JavaScript API.
- Búsqueda: Places API (New), `PlaceAutocompleteElement`.
- Acceso directo desde navegador con `VITE_GOOGLE_MAPS_API_KEY` pública, restringida por HTTP referrer y por API.
- Autocomplete restringido a Argentina; seleccionar un resultado solo centra/encuadra el mapa.
- Selección persistible exclusivamente por clic en mapa, arrastre de marcador o inputs numéricos.
- Marker + Circle sincronizados; radio editable por slider/input.
- No persistir texto de dirección, Place ID, predicciones, viewport ni resultados del geocoder.
- Backend sin cambios: recibe únicamente los campos ratificados de Workplace (`latitude`, `longitude`, `radiusMeters`, `gpsAccuracyThreshold`, además de identidad/asignación).
- Sin proxy y sin fallback a proveedores OSM públicos.
- Atribución nativa de Google visible.
- Estimación operativa informada: 100–200 configuraciones totales, dentro del free tier indicado al decidir (10.000 cargas/mes, costo estimado USD 0), sujeto a monitoreo y precios vigentes.

## Apps afectadas

- Admin web: cambia SDK, búsqueda y configuración pública.
- Backend: contrato y almacenamiento sin cambios.
- Mobile: geofence y marcaciones sin cambios.

## Criterio de propagación

El orchestrator debe actualizar el template común y propagarlo a cada repo sin modificar los DTOs. La evidencia de UI/configuración permanece en F-005/F-010 de admin web.
