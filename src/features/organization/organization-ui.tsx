import type { ReactNode } from 'react'
import type { Pagination } from '../../types/api'
import type { EntityStatus } from '../../types/organization'

export const fieldClass = 'min-h-11 rounded-md border border-foreground/25 bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
export const labelClass = 'flex flex-col gap-2 font-semibold'

export function StatusBadge({ status }: { status: EntityStatus }) {
  const active = status === 'ACTIVE'
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-secondary/15 text-secondary' : 'bg-foreground/10 text-foreground/65'}`}><span className="sr-only">Estado: </span>{active ? 'Activo' : 'Inactivo'}</span>
}

interface QueryStateProps {
  pending: boolean
  error: boolean
  empty: boolean
  subject: string
  onRetry: () => void
  children: ReactNode
}

export function QueryState({ pending, error, empty, subject, onRetry, children }: QueryStateProps) {
  return (
    <div aria-live="polite">
      {pending ? <p className="rounded-lg border border-foreground/15 bg-background p-6 text-foreground/65">Cargando {subject}…</p> : null}
      {error ? <div className="rounded-lg border border-destructive/35 bg-background p-5" role="alert"><p className="font-semibold">No pudimos cargar {subject}.</p><button className="mt-3 min-h-11 rounded-md border border-destructive px-4 font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive" type="button" onClick={onRetry}>Reintentar</button></div> : null}
      {!pending && !error && empty ? <div className="rounded-lg border border-foreground/15 bg-background p-8 text-center"><h2 className="text-xl font-bold">No hay resultados</h2><p className="mt-2 text-foreground/65">Probá con otros filtros o una búsqueda diferente.</p></div> : null}
      {!empty ? children : null}
    </div>
  )
}

export function PaginationNav({ pagination, label, onPage }: { pagination?: Pagination; label: string; onPage: (page: number) => void }) {
  if (!pagination || pagination.totalItems === 0) return null
  return <nav aria-label={`Paginación de ${label}`} className="flex flex-col gap-3 border-t border-foreground/15 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-foreground/65"><span className="font-semibold text-foreground tabular-nums">{pagination.totalItems}</span> resultados · Página <span className="tabular-nums">{pagination.page}</span> de <span className="tabular-nums">{Math.max(1, pagination.totalPages)}</span></p><div className="flex gap-2"><button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-45" disabled={pagination.page <= 1} type="button" onClick={() => onPage(pagination.page - 1)}>Anterior</button><button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-45" disabled={pagination.page >= pagination.totalPages} type="button" onClick={() => onPage(pagination.page + 1)}>Siguiente</button></div></nav>
}
