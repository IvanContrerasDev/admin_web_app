import { describe, expect, it } from 'vitest'
import { MockGeocodingService } from './geocoding-service'

describe('MockGeocodingService', () => {
  it('returns at most five deterministic Argentine results', async () => {
    const results = await new MockGeocodingService().searchAddress('San Juan', { country: 'AR' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(5)
    expect(results[0]).toMatchObject({ id: 'san-juan-centro', latitude: -31.5375 })
  })

  it('does not search short queries', async () => {
    await expect(new MockGeocodingService().searchAddress('Sa', { country: 'AR' })).resolves.toEqual([])
  })
})
