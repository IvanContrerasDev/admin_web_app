# P-05 — Google Maps para lugares de trabajo

**Fecha original:** 2026-09-17  
**Actualización:** 2026-09-18  
**Origen:** admin_web_app / decisión humana  
**Estado:** aplicada; reemplaza la elección anterior de Geoapify + Leaflet  
**Módulos afectados:** F-005 y F-010

## Decisión

Se adopta **Google Maps Platform** mediante **Maps JavaScript API** y **Places API (New) / Place Autocomplete Widget**. El acceso es directo desde el navegador y no requiere proxy del backend.

La estimación operativa informada es de 100–200 configuraciones totales. Con ese tráfico, se espera permanecer dentro del free tier indicado al decidir el cambio (10.000 cargas de mapa por mes, costo estimado de USD 0). Operaciones debe mantener billing habilitado, alertas de presupuesto y revisar las cuotas y precios vigentes de Google; el valor no se trata como garantía contractual permanente.

## Flujo autorizado

1. El formulario carga el SDK de forma diferida solo en las vistas geográficas.
2. El mapa inicia centrado en una ubicación predeterminada o en la ubicación del navegador cuando la persona concede permiso mediante una acción explícita.
3. Places Autocomplete restringe sugerencias a Argentina. Seleccionar una sugerencia **solo centra/encuadra el mapa**.
4. La selección persistible ocurre al hacer clic en el mapa mediante `map.addListener("click")` o al mover el marcador. Esa acción actualiza el centro del círculo.
5. Un slider y un input numérico editan el radio en metros. Los inputs de latitud/longitud conservan una alternativa operable por teclado.
6. Guardar envía únicamente el DTO de Workplace ya ratificado: `clientId`, `siteId`, `name`, `latitude`, `longitude`, `radiusMeters` y `gpsAccuracyThreshold`.

## Restricción de persistencia

No se persisten, envían al backend ni incorporan al dominio:

- texto de búsqueda o dirección formateada;
- `placePrediction`, Place ID, viewport u otros datos devueltos por Places;
- resultados del geocoder o cachés permanentes de sugerencias.

La UI solicita a Google solo `location` y `viewport` para mover la cámara. Las coordenadas guardadas son las que la persona confirma después mediante clic, arrastre o inputs numéricos; elegir una sugerencia no modifica por sí mismo el payload.

## Seguridad y configuración

- Variable pública: `VITE_GOOGLE_MAPS_API_KEY`.
- La clave debe restringirse por **HTTP referrers** a los orígenes de preview/producción y por API a **Maps JavaScript API** y **Places API (New)**.
- `authReferrerPolicy: "origin"`, idioma español y región Argentina se configuran en el loader.
- La clave es identificador público de cliente, no secreto de servidor; aun así no se codifica en el repositorio.
- No hay fallback silencioso a tiles OSM, Nominatim ni otro proveedor.
- La atribución y los controles legales nativos de Google deben permanecer visibles.
- Un error de carga o configuración no borra coordenadas/radio existentes y mantiene disponibles los inputs equivalentes.

## Accesibilidad y rendimiento

- El SDK se importa dinámicamente junto con el componente lazy del mapa.
- Autocomplete utiliza el widget accesible mantenido por Google; el mapa conserva instrucciones y estado anunciados.
- Buscar, geolocalizar y mover el mapa no guardan automáticamente una ubicación.
- Radio y coordenadas tienen controles de formulario operables por teclado.
- La geolocalización se solicita desde “Usar Mi Ubicación”, no al cargar la página.

## Impacto contractual

El contrato HTTP del backend no cambia. La Decisión 12 de `docs/arquitectura/contratos-api.md` es `SYNCED-FROM-TEMPLATE` y no se edita en este repositorio; debe ser propagada por el orchestrator con esta decisión como fuente. La propuesta de sincronización específica está en `docs/changes_proposals/20260918-google-maps-synced-contract.md`.

## Evidencia requerida para F-010

- Carga real con clave restringida en un origen permitido.
- Autocomplete argentino centra el mapa sin alterar latitud/longitud del formulario.
- Clic y arrastre actualizan marcador, círculo y payload.
- Slider modifica el círculo en metros.
- Payload no contiene dirección, Place ID ni datos del geocoder.
- Estados de permiso de geolocalización, error de carga/cuota y clave ausente.
- Atribución de Google visible y presupuesto/cuota monitoreados.
