import { z } from 'zod'
import type { AuthenticatedSession } from '../types/auth'
import { ServiceError } from './service-error'

export interface SessionSnapshot { session: AuthenticatedSession; csrfToken: string; accessExpiresAt: number }
export interface SessionCoordination {
  exclusive<T>(operation: () => Promise<T>): Promise<T>
  publish(snapshot: SessionSnapshot | null): void
  subscribe(listener: (snapshot: SessionSnapshot | null) => void, snapshot: () => SessionSnapshot | null): void
  close(): void
}

const snapshotSchema = z.object({
  session: z.object({
    user: z.object({ id: z.string(), firstName: z.string(), lastName: z.string(), email: z.string().email(), employeeId: z.string(), role: z.enum(['ADMIN', 'SUPER_ADMIN']) }),
    sessionExpiresAt: z.string().datetime(), rememberSession: z.boolean(), accessToken: z.string().min(1), accessExpiresIn: z.number().positive(),
  }),
  csrfToken: z.string().min(1), accessExpiresAt: z.number().finite(),
})
const messageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('state'), snapshot: snapshotSchema }),
  z.object({ kind: z.literal('logout') }),
  z.object({ kind: z.literal('pull'), sender: z.string(), requestId: z.string() }),
  z.object({ kind: z.literal('reply'), sender: z.string(), target: z.string(), requestId: z.string(), snapshot: snapshotSchema.nullable() }),
])
const unavailable = () => new ServiceError({ code: 'SESSION_COORDINATION_UNAVAILABLE', message: 'No se pudo coordinar la sesión con las otras pestañas. Volvé a ingresar.', retryable: false, kind: 'configuration' })

export function createBrowserSessionCoordination(key: string): SessionCoordination {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  const supported = !!locks && typeof locks.query === 'function' && typeof BroadcastChannel !== 'undefined'
  const channel = supported ? new BroadcastChannel(`gdes-session:${key}`) : null
  const id = crypto.randomUUID()
  const presencePrefix = `gdes-session-presence:${key}:`
  let releasePresence: (() => void) | undefined
  let readyResolve!: () => void
  const ready = new Promise<void>((resolve) => { readyResolve = resolve })
  const presence = new Promise<void>((resolve) => { releasePresence = resolve })
  if (supported) void locks.request(`${presencePrefix}${id}`, async () => {
    readyResolve()
    await presence
  }).catch(() => readyResolve())
  else readyResolve()
  let listener: ((snapshot: SessionSnapshot | null) => void) | undefined
  let snapshot: (() => SessionSnapshot | null) | undefined
  const pending = new Map<string, { expected: Set<string>; resolve: () => void }>()
  if (channel) channel.onmessage = (event: MessageEvent<unknown>) => {
    const parsed = messageSchema.safeParse(event.data)
    if (!parsed.success) return
    const message = parsed.data
    if (message.kind === 'pull') {
      channel.postMessage({ kind: 'reply', sender: id, target: message.sender, requestId: message.requestId, snapshot: snapshot?.() ?? null })
    } else if (message.kind === 'reply') {
      const waiting = pending.get(message.requestId)
      if (message.target !== id || !waiting?.expected.delete(message.sender)) return
      if (message.snapshot) listener?.(message.snapshot)
      if (!waiting.expected.size) waiting.resolve()
    } else listener?.(message.kind === 'logout' ? null : message.snapshot)
  }
  return {
    async exclusive(operation) {
      if (!channel || !locks || !supported) throw unavailable()
      await ready
      return locks.request(`gdes-session:${key}`, async () => {
        // Presence locks enumerate live participants, including suspended tabs.
        // Every participant must acknowledge its state before shared-cookie rotation.
        const inventory = await locks.query()
        const expected = new Set((inventory.held ?? []).flatMap((lock) =>
          lock.name?.startsWith(presencePrefix) && lock.name !== `${presencePrefix}${id}`
            ? [lock.name.slice(presencePrefix.length)] : []))
        if (expected.size) {
          const requestId = crypto.randomUUID()
          let timer: ReturnType<typeof setTimeout> | undefined
          try {
            await new Promise<void>((resolve, reject) => {
              pending.set(requestId, { expected, resolve })
              timer = setTimeout(() => reject(unavailable()), 2000)
              channel.postMessage({ kind: 'pull', sender: id, requestId })
            })
          } finally { clearTimeout(timer); pending.delete(requestId) }
        }
        return operation()
      })
    },
    publish(value) { channel?.postMessage(value ? { kind: 'state', snapshot: value } : { kind: 'logout' }) },
    subscribe(receive, current) { listener = receive; snapshot = current },
    close() { releasePresence?.(); channel?.close() },
  }
}
