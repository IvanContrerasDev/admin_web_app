import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBrowserSessionCoordination } from './session-coordination'
import { installSessionBrowser } from '../test/session-browser'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
describe('browser session coordination', () => {
  it('fails closed when Web Locks or BroadcastChannel are unavailable', async () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const coordinator = createBrowserSessionCoordination('https://localhost/api/v1')
    await expect(coordinator.exclusive(async () => 'unsafe')).rejects.toMatchObject({ code: 'SESSION_COORDINATION_UNAVAILABLE', retryable: false })
  })
  it('serializes refresh operations under the same API lock', async () => {
    const queue: Array<() => void> = []
    const { locks } = installSessionBrowser()
    const a = createBrowserSessionCoordination('https://localhost/api/v1')
    const b = createBrowserSessionCoordination('https://localhost/api/v1')
    await Promise.all([a.exclusive(async () => { queue.push(() => undefined); return 1 }), b.exclusive(async () => { expect(queue).toHaveLength(1); return 2 })])
    expect(locks.request.mock.calls.filter(([name]) => name === 'gdes-session:https://localhost/api/v1')).toHaveLength(2)
    a.close()
    b.close()
  })
})

it('refuses rotation when a present tab does not acknowledge its state', async () => {
  const { locks } = installSessionBrowser()
  const coordinator = createBrowserSessionCoordination('api')
  let release!: () => void
  const sleeping = locks.request('gdes-session-presence:api:suspended-tab', () => new Promise<void>((resolve) => { release = resolve }))
  await vi.waitFor(() => expect(release).toBeTypeOf('function'))
  vi.useFakeTimers()
  const operation = vi.fn(async () => 'unsafe')
  const work = coordinator.exclusive(operation)
  const rejected = expect(work).rejects.toMatchObject({ code: 'SESSION_COORDINATION_UNAVAILABLE', retryable: false })
  await vi.advanceTimersByTimeAsync(2001)
  await rejected
  expect(operation).not.toHaveBeenCalled()
  coordinator.close()
  release()
  await sleeping
  vi.useRealTimers()
})
