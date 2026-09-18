import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Form, Link, useSearchParams } from 'react-router-dom'
import { userService } from '../../services/services'
import type { AccountStatus } from '../../types/users'
import { UsersTable } from './users-table'

const pageSize = 25

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') ?? ''
  const statusParam = searchParams.get('status')
  const accountStatus: AccountStatus | undefined = statusParam === 'ACTIVE' || statusParam === 'INACTIVE' ? statusParam : undefined
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)

  const usersQuery = useQuery({
    queryKey: ['users', { search, accountStatus, page, pageSize }],
    queryFn: ({ signal }) => userService.list({ search: search || undefined, accountStatus, page, pageSize }, signal),
    placeholderData: keepPreviousData,
  })

  const updateFilter = (name: 'status', value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const response = usersQuery.data
  const users = response?.data ?? []
  const pagination = response?.pagination

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">Empleados</h1>
          <p className="mt-2 text-pretty leading-relaxed text-foreground/65">Consultá datos laborales, administrá accesos y mantené actualizado el padrón operativo.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to="/usuarios/nuevo">Agregar empleado</Link>
      </header>

      <div className="rounded-lg border border-foreground/15 bg-background p-4 sm:p-5">
        <Form className="flex flex-col gap-4 sm:flex-row sm:items-end" method="get">
          <label className="flex min-w-0 flex-1 flex-col gap-2 font-semibold" htmlFor="employee-search">
            Buscar empleado
            <input className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal text-foreground placeholder:text-foreground/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" defaultValue={search} id="employee-search" name="search" placeholder="Nombre, email, legajo o DNI…" type="search" autoComplete="off" />
          </label>
          <label className="flex flex-col gap-2 font-semibold" htmlFor="employee-status">
            Estado
            <select className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" id="employee-status" name="status" value={accountStatus ?? ''} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option>
            </select>
          </label>
          <button className="min-h-11 rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="submit">Buscar</button>
        </Form>
      </div>

      <div aria-live="polite">
        {usersQuery.isPending ? <p className="rounded-lg border border-foreground/15 bg-background p-6 text-foreground/65">Cargando empleados…</p> : null}
        {usersQuery.isError ? <div className="rounded-lg border border-destructive/35 bg-background p-5" role="alert"><p className="font-semibold">No pudimos cargar los empleados.</p><button className="mt-3 min-h-11 rounded-md border border-destructive px-4 font-semibold text-destructive" type="button" onClick={() => void usersQuery.refetch()}>Reintentar</button></div> : null}
        {!usersQuery.isPending && !usersQuery.isError && users.length === 0 ? <div className="rounded-lg border border-foreground/15 bg-background p-8 text-center"><h2 className="text-xl font-bold">No hay resultados</h2><p className="mt-2 text-foreground/65">Probá con otro término o quitá el filtro de estado.</p></div> : null}
        {users.length > 0 ? <UsersTable users={users} /> : null}
      </div>

      {pagination && pagination.totalItems > 0 ? (
        <nav aria-label="Paginación de empleados" className="flex flex-col gap-3 border-t border-foreground/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/65"><span className="font-semibold text-foreground tabular-nums">{pagination.totalItems}</span> empleados · Página <span className="tabular-nums">{pagination.page}</span> de <span className="tabular-nums">{Math.max(1, pagination.totalPages)}</span></p>
          <div className="flex gap-2">
            <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-45" disabled={pagination.page <= 1} type="button" onClick={() => goToPage(pagination.page - 1)}>Anterior</button>
            <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary disabled:cursor-not-allowed disabled:opacity-45" disabled={pagination.page >= pagination.totalPages} type="button" onClick={() => goToPage(pagination.page + 1)}>Siguiente</button>
          </div>
        </nav>
      ) : null}
    </section>
  )
}
