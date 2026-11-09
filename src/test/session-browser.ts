import { vi } from 'vitest'

// Deterministic same-origin browser primitives; HTTP and AuthService remain real.
export function installSessionBrowser() {
  const held = new Set<string>()
  const tails = new Map<string, Promise<unknown>>()
  const locks = {
    request: vi.fn((name: string, operation: () => Promise<unknown>) => {
      const promise = (tails.get(name) ?? Promise.resolve()).then(async () => {
        held.add(name)
        try { return await operation() } finally { held.delete(name) }
      })
      tails.set(name, promise.catch(() => undefined))
      return promise
    }),
    query: async () => ({ held: [...held].map((name) => ({ name })), pending: [] }),
  }
  vi.stubGlobal('navigator', { locks })
  const channels = new Set<Channel>()
  class Channel {
    onmessage: ((event: MessageEvent) => void) | null = null
    constructor(readonly name: string) { channels.add(this) }
    postMessage(data: unknown) {
      for (const channel of channels) if (channel !== this && channel.name === this.name) {
        queueMicrotask(() => channel.onmessage?.({ data } as MessageEvent))
      }
    }
    close() { channels.delete(this) }
  }
  vi.stubGlobal('BroadcastChannel', Channel)
  return { locks }
}
