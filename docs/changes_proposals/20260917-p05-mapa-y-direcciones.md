# Propuesta: P-05 — Mapa y búsqueda de direcciones

**Fecha:** 2026-09-17
**Origen:** admin_web_app / leader
**Estado:** aplicada
**Nota (2026-09-17, orchestrator, segunda ronda):** tras comparación de proveedores (MapTiler, Mapbox, Stadia, Geoapify, LocationIQ, Google, OSM público), el humano eligió **Geoapify** (tiles + geocoding) con Leaflet o MapLibre, acceso directo desde el navegador con clave restringida por dominio (sin proxy), free tier comercial con atribución, persistencia de coordenadas permitida. Contingencia si fallan housenumbers en la validación real: Mapbox o Google. Decisión 12 de `docs/arquitectura/contratos-api.md`. Resta ejecución: operaciones crea la cuenta/credencial restringida por origen y el leader admin planifica F-005 con la interfaz `GeocodingServiceCandidate`.
**Responsable propuesto:** humano/operaciones selecciona proveedor y presupuesto; leader admin implementa integración; leader backend coordina proxy si es necesario.
**Módulos afectados:** F-005 y F-010. No bloquea F-002 ni servicios de otros dominios.

## Archivo(s) común(es) afectado(s)

- `docs/arquitectura/contratos-api.md` solo si se aprueba un endpoint backend de geocodificación.
- Coordinación externa: backend `03-contratos-api.md` y `06-integraciones.md` si tiene que custodiar una credencial o hacer proxy.
- Fuente funcional: spec §§32–34; hoja de ruta aprobada P-05.

## Problema

Se requiere mapa real con búsqueda de dirección, marcador movible y círculo en metros. No hay proveedor de tiles/geocodificación confirmado, cuotas ni credenciales. Una librería de mapa no aporta automáticamente cartografía ni permiso para consultar un servicio público sin límite.

## Cambio propuesto

Separar renderizador, cartografía y búsqueda mediante servicio desacoplado. No sustituir mapa por campos lat/lon, no dibujar geografía SVG a mano y no instalar/provisionar proveedores en F-001.

| Alternativa para decisión | Qué revisar antes de elegir |
|---|---|
| MapLibre con proveedor comercial de tiles/geocodificación | Cobertura argentina, SDK/API, cuotas y costo de ambos productos, atribución, reglas de almacenamiento y credencial pública restringida |
| Leaflet con tiles raster y geocodificador contratado | Cobertura, resolución, uso permitido en producción, atribuciones separadas y accesibilidad del control |
| SDK integrado de un proveedor cartográfico | Condiciones, facturación, bloqueo por dominio, integración de búsqueda/círculo y dependencia del proveedor |

No se propone como fallback silencioso Nominatim o tiles públicos ilimitados. Las condiciones/costos actuales deben consultarse en documentación oficial al seleccionar proveedor; esta propuesta no afirma cuotas gratuitas concretas. No hay elección aprobada aún.

### Interfaz local candidata (no contrato de red)

```ts
interface GeocodingResultCandidate {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}
interface GeocodingServiceCandidate {
  searchAddress(
    query: string,
    options: { country: "AR"; signal?: AbortSignal }
  ): Promise<GeocodingResultCandidate[]>;
}
```

El id es del proveedor/adaptador, no UUID del dominio. No guardarlo en Workplace sin aprobación de un campo nuevo. Esta interfaz interna puede refinarse al elegir proveedor, y solo se convierte en DTO de API si se acuerda expresamente con backend.

Ejemplo de resultado mock explícito para pruebas de componente: `[{ "id": "mock-san-juan-1", "label": "Ubicación de prueba, San Juan", "latitude": -31.5375, "longitude": -68.5364 }]`. No representa una búsqueda realizada ni un dato de dirección verificado por proveedor.

Flujo esperado:
1. Escribir dirección, debounce/cancelación de petición previa, mostrar resultados con teclado y estados de carga/vacío/error distinguibles.
2. Elegir resultado centra mapa y mueve marcador; arrastrar marcador actualiza lat/lon sin inventar una dirección inversa. Reverse geocoding no es requisito nuevo.
3. Modificar radio actualiza círculo real en metros; validar límites ratificados de P-04, no equivalencia en píxeles. Umbral GPS opcional independiente.
4. Guardar envía campos del DTO Workplace aprobado: clientId/siteId/name/CIRCLE/latitude/longitude/radiusMeters/gpsAccuracyThreshold. No enviar objeto específico del SDK ni guardar texto de búsqueda como domicilio contractual.
5. Edición carga centro/radio existentes; fallo de tiles o geocoder no borra selección. No guardar una ubicación inicial arbitraria cuando todavía no fue confirmada por el usuario.

### Seguridad, accesibilidad y operación

- Elegir acceso directo de navegador solo si el proveedor permite clave pública restringida por origen/producto; todo `VITE_*` es público. Secretos de servidor solo en backend, nunca bundle.
- Si se necesita proxy, acordar ruta, permisos, rate limits y errores antes de implementarlo; no inventar endpoint ni conectar un nuevo backend.
- Documentar orígenes preview/producción, CORS, cuotas, atribución visible, política de cache de resultados y tratamiento de direcciones enviadas al tercero. La UI no obtiene GPS del administrador como sustituto de búsqueda.
- Mapa diferido para no cargar SDK/tiles fuera de Lugares de trabajo. Etiquetas y controles de teclado; alternativa de ajustar coordenadas y radio mediante inputs para quien no puede arrastrar, sin eliminar el mapa requerido.
- Capturar evidencia de error de red/cuota y agotamiento de resultados; no hacer retries de geocodificación ilimitados ni consultas por cada render.

## Impacto por app

- Admin incorpora renderizador/servicio y configuración pública; DTO Workplace permanece igual salvo acuerdo adicional.
- Backend solo cambia si necesita proxy/configuración privada. Mobile no cambia geofence ni fuente de asistencia.
- Operaciones administra proveedor, facturación y restricciones; ningún alta realizada por esta propuesta.

## Preguntas restantes

¿Qué proveedor y renderizador se eligen? ¿Qué cobertura/direcciones de Argentina deben verificarse? ¿Presupuesto/cuotas y atribuciones aceptados? ¿Acceso directo o proxy? ¿Cómo se restringen preview/orígenes? ¿Qué almacenamiento de resultados está permitido? ¿Qué límites numéricos define P-04 para radio/umbral?

## Criterio de desbloqueo y evidencia

Humano ratifica proveedor y modalidad; operaciones documenta acceso, cuotas y términos vigentes; leaders aprueban interfaz y cualquier contrato nuevo; orchestrator propaga solo lo común. F-005 puede construir componente con resultados mock explícitos después de aprobar interfaz/librería, pero no declarar geocodificación real hasta configuración verificada. F-010 prueba dirección argentina, selección/arrastre/círculo, persistencia por backend, fallo de cuota y atribución visible en navegador. No se solicita integración ni variable en esta etapa documental.
