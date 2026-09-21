import { use } from 'react'
import { ToastContext } from './toast-context'

export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider.')
  return context
}
