import 'leaflet/dist/leaflet.css'
import { divIcon, type LatLngExpression } from 'leaflet'
import { useEffect } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

interface Location { latitude: number; longitude: number }
interface WorkplaceMapProps { location: Location; radiusMeters: number; readOnly?: boolean; onLocationChange?: (location: Location) => void }

const markerIcon = divIcon({ className: 'workplace-marker', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] })

function MapSynchronizer({ location }: { location: Location }) {
  const map = useMap()
  useEffect(() => { map.setView([location.latitude, location.longitude], map.getZoom(), { animate: false }) }, [location.latitude, location.longitude, map])
  return null
}

function MapInteraction({ enabled, onChange }: { enabled: boolean; onChange?: (location: Location) => void }) {
  useMapEvents({ click(event) { if (enabled) onChange?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }) } })
  return null
}

export function WorkplaceMap({ location, radiusMeters, readOnly = false, onLocationChange }: WorkplaceMapProps) {
  const center: LatLngExpression = [location.latitude, location.longitude]
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY
  return <div className="flex flex-col gap-3"><div className="h-80 overflow-hidden rounded-lg border border-foreground/20 bg-muted" aria-label="Mapa de la zona permitida"><MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full" attributionControl={Boolean(apiKey)}>{apiKey ? <TileLayer attribution='&copy; OpenStreetMap contributors &copy; Geoapify' url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`} /> : null}<Circle center={center} radius={radiusMeters} pathOptions={{ color: '#0d80ae', fillColor: '#0d80ae', fillOpacity: 0.18, weight: 3 }} /><Marker draggable={!readOnly} icon={markerIcon} position={center} eventHandlers={{ dragend(event) { const point = event.target.getLatLng(); onLocationChange?.({ latitude: point.lat, longitude: point.lng }) } }} /><MapSynchronizer location={location} /><MapInteraction enabled={!readOnly} onChange={onLocationChange} /></MapContainer></div>{!apiKey ? <p className="rounded-md border border-foreground/20 bg-background p-3 text-sm text-foreground/65" role="status">La base cartográfica de Geoapify no está configurada. Podés seguir ajustando el centro con el marcador, el mapa o los campos numéricos.</p> : null}<p className="text-sm text-foreground/60">{readOnly ? 'El círculo representa el área admitida en metros.' : 'Hacé clic en el mapa o arrastrá el marcador. Los campos numéricos ofrecen la misma operación por teclado.'}</p></div>
}
