import type { GeocodingResult } from '../types/organization'
import { ServiceError } from './service-error'

export interface GeocodingService {
  searchAddress(query: string, options: { country: 'AR'; signal?: AbortSignal }): Promise<GeocodingResult[]>
}

const MOCK_LOCATIONS: GeocodingResult[] = [
  { id: 'san-juan-centro', label: 'Plaza 25 de Mayo, San Juan, Argentina', latitude: -31.5375, longitude: -68.5364 },
  { id: 'mendoza-centro', label: 'Plaza Independencia, Mendoza, Argentina', latitude: -32.8895, longitude: -68.8458 },
  { id: 'salta-centro', label: 'Plaza 9 de Julio, Salta, Argentina', latitude: -24.7892, longitude: -65.4108 },
  { id: 'san-luis-centro', label: 'Plaza Pringles, San Luis, Argentina', latitude: -33.3017, longitude: -66.3378 },
  { id: 'catamarca-centro', label: 'Plaza 25 de Mayo, Catamarca, Argentina', latitude: -28.4696, longitude: -65.7852 },
]

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-AR').trim()
}

export class MockGeocodingService implements GeocodingService {
  async searchAddress(query: string, options: { country: 'AR'; signal?: AbortSignal }): Promise<GeocodingResult[]> {
    if (options.signal?.aborted) throw options.signal.reason
    const search = normalize(query)
    if (search.length < 3) return []
    const matching = MOCK_LOCATIONS.filter((result) => normalize(result.label).includes(search))
    return (matching.length > 0 ? matching : MOCK_LOCATIONS).slice(0, 5)
  }
}

interface GeoapifyFeature {
  properties?: { place_id?: string; formatted?: string; lat?: number; lon?: number }
}

export class GeoapifyGeocodingService implements GeocodingService {
  constructor(private readonly apiKey: string) {}

  async searchAddress(query: string, options: { country: 'AR'; signal?: AbortSignal }): Promise<GeocodingResult[]> {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete')
    url.search = new URLSearchParams({ text: query, filter: 'countrycode:ar', limit: '5', format: 'geojson', apiKey: this.apiKey }).toString()
    let response: Response
    try {
      response = await fetch(url, { signal: options.signal })
    } catch (error) {
      if (options.signal?.aborted) throw error
      throw new ServiceError({ code: 'GEOCODING_UNAVAILABLE', message: 'No pudimos buscar direcciones. Conservamos la ubicación actual.', retryable: true, kind: 'network' })
    }
    if (response.status === 429) throw new ServiceError({ code: 'GEOCODING_RATE_LIMITED', message: 'La búsqueda de direcciones alcanzó su límite. Intentá más tarde.', retryable: true, kind: 'api', status: 429 })
    if (!response.ok) throw new ServiceError({ code: 'GEOCODING_UNAVAILABLE', message: 'No pudimos buscar direcciones. Conservamos la ubicación actual.', retryable: true, kind: 'api', status: response.status })
    const payload = await response.json() as { features?: GeoapifyFeature[] }
    if (!Array.isArray(payload.features)) throw new ServiceError({ code: 'GEOCODING_INVALID_RESPONSE', message: 'El proveedor devolvió una respuesta inválida.', retryable: false, kind: 'contract' })
    return payload.features.flatMap((feature) => {
      const { place_id: id, formatted: label, lat: latitude, lon: longitude } = feature.properties ?? {}
      return id && label && Number.isFinite(latitude) && Number.isFinite(longitude) ? [{ id, label, latitude: latitude!, longitude: longitude! }] : []
    }).slice(0, 5)
  }
}

export function createGeocodingService(environment: ImportMetaEnv): GeocodingService {
  if ((environment.VITE_SERVICE_MODE ?? 'mock') === 'mock') return new MockGeocodingService()
  if (environment.VITE_GEOAPIFY_API_KEY) return new GeoapifyGeocodingService(environment.VITE_GEOAPIFY_API_KEY)
  return {
    async searchAddress() {
      throw new ServiceError({ code: 'GEOCODING_UNAVAILABLE', message: 'Configurá Geoapify para buscar direcciones.', retryable: false, kind: 'configuration' })
    },
  }
}
