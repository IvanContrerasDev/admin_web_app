import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

export interface MapLocation {
  latitude: number
  longitude: number
}

interface WorkplaceMapProps {
  location: MapLocation | null
  radiusMeters: number
  readOnly?: boolean
  onLocationChange?: (location: MapLocation) => void
}

const DEFAULT_CENTER = { lat: -31.5375, lng: -68.5364 }
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

if (apiKey) {
  setOptions({
    key: apiKey,
    v: 'weekly',
    language: 'es',
    region: 'AR',
    authReferrerPolicy: 'origin',
  })
}

function toLatLng(location: MapLocation) {
  return { lat: location.latitude, lng: location.longitude }
}

export function WorkplaceMap({
  location,
  radiusMeters,
  readOnly = false,
  onLocationChange,
}: WorkplaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const autocompleteContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const circleRef = useRef<google.maps.Circle | null>(null)
  const onLocationChangeRef = useRef(onLocationChange)
  const initialLocationRef = useRef(location)
  const initialRadiusMetersRef = useRef(radiusMeters)
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState(
    location
      ? 'La ubicación guardada está marcada en el mapa.'
      : 'El mapa está centrado en San Juan. Buscá una dirección o usá tu ubicación para acercarte.',
  )

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return

    let disposed = false
    const listeners: google.maps.MapsEventListener[] = []
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null
    const previousAuthFailure = window.gm_authFailure

    window.gm_authFailure = () => {
      if (!disposed) setLoadError('Google Maps rechazó la clave para este origen. Revisá las restricciones HTTP y las APIs habilitadas.')
    }

    async function initializeMap() {
      try {
        const [{ Map, Circle }, { PlaceAutocompleteElement }] = await Promise.all([
          importLibrary('maps'),
          importLibrary('places'),
        ])
        if (disposed || !mapContainerRef.current) return

        const initialPosition = initialLocationRef.current ? toLatLng(initialLocationRef.current) : null
        const map = new Map(mapContainerRef.current, {
          center: initialPosition ?? DEFAULT_CENTER,
          zoom: initialPosition ? 16 : 13,
          clickableIcons: false,
          fullscreenControl: true,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          scrollwheel: true,
        })
        const marker = new google.maps.Marker({
          draggable: !readOnly,
          map: initialPosition ? map : null,
          position: initialPosition,
          title: 'Centro de la zona permitida',
        })
        const circle = new Circle({
          center: initialPosition ?? DEFAULT_CENTER,
          clickable: false,
          fillColor: '#0d80ae',
          fillOpacity: 0.18,
          map: initialPosition ? map : null,
          radius: initialRadiusMetersRef.current,
          strokeColor: '#0d80ae',
          strokeOpacity: 1,
          strokeWeight: 3,
        })

        mapRef.current = map
        markerRef.current = marker
        circleRef.current = circle

        if (!readOnly) {
          listeners.push(
            map.addListener('click', (event: google.maps.MapMouseEvent) => {
              if (!event.latLng) return
              const next = event.latLng.toJSON()
              onLocationChangeRef.current?.({ latitude: next.lat, longitude: next.lng })
              setStatus('Centro seleccionado. Podés ajustar el radio o mover el marcador.')
            }),
            marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
              if (!event.latLng) return
              const next = event.latLng.toJSON()
              onLocationChangeRef.current?.({ latitude: next.lat, longitude: next.lng })
              setStatus('Centro actualizado desde el marcador.')
            }),
          )

          autocomplete = new PlaceAutocompleteElement({
            includedRegionCodes: ['ar'],
          })
          autocomplete.placeholder = 'Ej.: Plaza 25 de Mayo, San Juan…'
          autocomplete.setAttribute('aria-label', 'Buscar dirección en Google Maps')
          autocomplete.style.width = '100%'
          autocomplete.addEventListener('gmp-select', async (event) => {
            const place = event.placePrediction.toPlace()
            await place.fetchFields({ fields: ['location', 'viewport'] })
            if (disposed || !place.location) return
            if (place.viewport) map.fitBounds(place.viewport)
            else {
              map.setCenter(place.location)
              map.setZoom(17)
            }
            setStatus('Mapa centrado en la dirección. Hacé clic para fijar el centro de la zona.')
          })
          autocompleteContainerRef.current?.append(autocomplete)
        }
      } catch {
        if (!disposed) setLoadError('No pudimos cargar Google Maps. Revisá la conexión o la configuración de la clave y volvé a intentar.')
      }
    }

    void initializeMap()

    return () => {
      disposed = true
      listeners.forEach((listener) => listener.remove())
      autocomplete?.remove()
      window.gm_authFailure = previousAuthFailure
      markerRef.current?.setMap(null)
      circleRef.current?.setMap(null)
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [readOnly])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    const circle = circleRef.current
    if (!map || !marker || !circle) return

    if (!location) {
      marker.setMap(null)
      circle.setMap(null)
      return
    }

    const position = toLatLng(location)
    marker.setPosition(position)
    marker.setMap(map)
    circle.setCenter(position)
    circle.setRadius(radiusMeters)
    circle.setMap(map)
    map.panTo(position)
  }, [location, radiusMeters])

  const useBrowserLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Este navegador no ofrece geolocalización. Podés buscar una dirección o mover el mapa manualmente.')
      return
    }

    setStatus('Obteniendo tu ubicación…')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.setCenter({ lat: coords.latitude, lng: coords.longitude })
        mapRef.current?.setZoom(17)
        setStatus('Mapa centrado en tu ubicación. Hacé clic para fijar el centro de la zona.')
      },
      () => setStatus('No pudimos acceder a tu ubicación. Revisá el permiso del navegador o buscá una dirección.'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    )
  }

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-destructive/35 bg-background p-5" role="alert">
        <p className="font-semibold">Google Maps no está configurado.</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          Agregá <code translate="no">VITE_GOOGLE_MAPS_API_KEY</code> para habilitar el mapa y Places Autocomplete. Mientras tanto, podés completar latitud, longitud y radio con los controles accesibles.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {!readOnly ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <p className="mb-2 font-semibold" id="google-address-search-label">Buscar dirección</p>
              <div aria-labelledby="google-address-search-label" ref={autocompleteContainerRef} />
            </div>
            <button className="min-h-11 shrink-0 rounded-md border border-foreground/25 bg-background px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={useBrowserLocation}>
              Usar Mi Ubicación
            </button>
          </div>
          <p className="text-sm leading-relaxed text-foreground/60">La búsqueda solo centra el mapa. La dirección y los datos de Google no se guardan.</p>
        </div>
      ) : null}
      {loadError ? <p className="rounded-md border border-destructive/35 bg-background p-3 text-sm font-semibold text-destructive" role="alert">{loadError}</p> : null}
      <div className="h-80 overflow-hidden rounded-lg border border-foreground/20 bg-muted" aria-label="Mapa de Google de la zona permitida" ref={mapContainerRef} />
      <p className="text-sm leading-relaxed text-foreground/60" aria-live="polite">
        {readOnly ? 'El círculo representa el área admitida en metros.' : status}
      </p>
    </div>
  )
}
