import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Form, Link, useSearchParams } from 'react-router-dom'
import { organizationService } from '../../services/services'
import type { EntityStatus } from '../../types/organization'
import { PaginationNav, QueryState, StatusBadge } from './organization-ui'

const pageSize = 25

export function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const statusValue = searchParams.get('status')
  const status: EntityStatus | undefined = statusValue === 'ACTIVE' || statusValue === 'INACTIVE' ? statusValue : undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const query = useQuery({ queryKey: ['clients', { search, status, page, pageSize }], queryFn: ({ signal }) => organizationService.listClients({ search: search || undefined, status, page, pageSize }, signal), placeholderData: keepPreviousData })
  const clients = query.data?.data ?? []

  const setParam = (name: string, value: string) => { const next = new URLSearchParams(searchParams); if (value) next.set(name, value); else next.delete(name); next.delete('page'); setSearchParams(next) }
  const goToPage = (nextPage: number) => { const next = new URLSearchParams(searchParams); next.set('page', String(nextPage)); setSearchParams(next) }

  return <section className="flex flex-col gap-6">
    <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Clientes</h1><p className="mt-2 text-pretty leading-relaxed text-foreground/65">Administrá las organizaciones que agrupan los lugares de trabajo y su disponibilidad operativa.</p></div><Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to="/clientes/nuevo">Agregar cliente</Link></header>
    <div className="rounded-lg border border-foreground/15 bg-background p-4 sm:p-5"><Form className="flex flex-col gap-4 sm:flex-row sm:items-end" method="get"><label className="flex min-w-0 flex-1 flex-col gap-2 font-semibold" htmlFor="client-search">Buscar cliente<input className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal placeholder:text-foreground/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" defaultValue={search} id="client-search" name="search" placeholder="Nombre del cliente…" type="search" autoComplete="off" /></label><label className="flex flex-col gap-2 font-semibold" htmlFor="client-status">Estado<select className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" id="client-status" name="status" value={status ?? ''} onChange={(event) => setParam('status', event.target.value)}><option value="">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option></select></label><button className="min-h-11 rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary" type="submit">Buscar</button></Form></div>
    <QueryState pending={query.isPending} error={query.isError} empty={clients.length === 0} subject="los clientes" onRetry={() => void query.refetch()}>
      <div className="hidden overflow-x-auto rounded-lg border border-foreground/15 bg-background md:block"><table className="w-full border-collapse text-left text-sm"><caption className="sr-only">Clientes encontrados</caption><thead className="bg-muted text-xs text-foreground/65"><tr><th className="px-4 py-2 font-semibold">Cliente</th><th className="px-4 py-2 font-semibold">Estado</th><th className="px-4 py-2 text-right font-semibold">Acción</th></tr></thead><tbody>{clients.map((client) => <tr className="border-t border-foreground/10" key={client.id}><td className="px-4 py-2 font-semibold">{client.name}</td><td className="px-4 py-2"><StatusBadge status={client.status} /></td><td className="px-4 py-2 text-right"><Link className="inline-flex min-h-9 items-center rounded-md px-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/clientes/${client.id}`}>Ver detalle</Link></td></tr>)}</tbody></table></div>
      <ul className="flex flex-col gap-2 md:hidden" aria-label="Clientes encontrados">{clients.map((client) => <li className="rounded-lg border border-foreground/15 bg-background p-3" key={client.id}><div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words font-semibold">{client.name}</p><StatusBadge status={client.status} /></div><Link className="mt-3 flex min-h-10 items-center justify-center rounded-md border border-primary px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/clientes/${client.id}`}>Ver detalle</Link></li>)}</ul>
    </QueryState>
    <PaginationNav pagination={query.data?.pagination} label="clientes" onPage={goToPage} />
  </section>
}
