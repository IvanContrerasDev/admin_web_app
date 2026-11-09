import { useEffect, useRef, useState } from 'react'
import { ServiceError } from '../../services/service-error'

export const accessInputClass = 'min-h-11 rounded-md border border-foreground/25 bg-background px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
export const accessButtonClass = 'min-h-11 rounded-md bg-primary px-4 py-3 font-semibold text-background hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60'
export function accessError(error: unknown) {
  if (error instanceof ServiceError) {
    if (error.code === 'INVALID_TOKEN') return 'El enlace no es válido. Solicitá uno nuevo.'
    if (error.code === 'TOKEN_EXPIRED') return 'El enlace venció. Solicitá uno nuevo.'
    if (error.code === 'REQUEST_ALREADY_DECIDED') return 'Esta solicitud ya fue decidida o cancelada.'
    return error.message
  }
  return 'No se pudo completar la operación. Intentá nuevamente.'
}
export function useAccessOperation() {
  const controller = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => () => controller.current?.abort(), [])
  async function run(operation: (signal: AbortSignal) => Promise<void>) {
    if (controller.current && !controller.current.signal.aborted) return
    const active = new AbortController()
    controller.current = active
    setBusy(true)
    setError('')
    try { await operation(active.signal) } catch (cause) {
      if (!active.signal.aborted) setError(accessError(cause))
    } finally {
      if (!active.signal.aborted) setBusy(false)
      if (controller.current === active) controller.current = null
    }
  }
  return { busy, error, run }
}
