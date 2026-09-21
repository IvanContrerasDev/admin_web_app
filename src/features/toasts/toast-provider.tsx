import { useCallback, useRef, useState, type PropsWithChildren } from 'react'
import { ToastContext, type ToastItem, type ToastVariant } from './toast-context'

const TOAST_DURATION_MS = 4200

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current + 1
    nextId.current = id
    setToasts((current) => [...current, { id, message, variant }])
    window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
  }, [dismiss])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])

  return (
    <ToastContext value={{ showToast, success, error }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-5 sm:items-end sm:pr-6">
        {toasts.map((toast) => (
          <div
            className={`toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              toast.variant === 'success'
                ? 'border-secondary/40 bg-secondary text-background'
                : 'border-accent/40 bg-accent text-background'
            }`}
            key={toast.id}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-background/25 text-xs font-bold">
              {toast.variant === 'success' ? '✓' : '!'}
            </span>
            <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{toast.message}</p>
            <button
              aria-label="Cerrar notificación"
              className="shrink-0 rounded px-1 text-background/85 hover:text-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-background"
              type="button"
              onClick={() => dismiss(toast.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
