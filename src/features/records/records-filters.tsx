import type { ClientListItem, SiteReference, WorkplaceListItem } from '../../types/organization'
import type { RecordOrigin, RecordStatus, ReviewStatus } from '../../types/records'
import type { UserListItem } from '../../types/users'

interface FilterValues {
  monthValue: string
  siteId: string
  clientId: string
  workplaceId: string
  employeeId: string
  status?: RecordStatus
  reviewStatus?: ReviewStatus
  origin?: RecordOrigin
  hasAbsence: boolean
}

interface RecordsFiltersProps {
  values: FilterValues
  sites: SiteReference[]
  clients: ClientListItem[]
  workplaces: WorkplaceListItem[]
  employees: UserListItem[]
  onChange: (name: keyof FilterValues, value: string | boolean) => void
  onClearSecondary: () => void
}

const controlClass = 'h-9 min-w-0 rounded-md border border-foreground/25 bg-background px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

export function RecordsFilters({ values, sites, clients, workplaces, employees, onChange, onClearSecondary }: RecordsFiltersProps) {
  const visibleWorkplaces = workplaces.filter((workplace) => (!values.siteId || workplace.site.id === values.siteId) && (!values.clientId || workplace.client.id === values.clientId))
  const hasAdvancedFilters = Boolean(values.status || values.reviewStatus || values.origin || values.hasAbsence)

  return (
    <section aria-label="Filtros de registros" className="rounded-md border border-foreground/15 bg-background px-3 py-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[9rem_10rem_minmax(9rem,1fr)_minmax(11rem,1.25fr)_minmax(11rem,1.25fr)]">
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold" htmlFor="records-month">
          Mes
          <input className={controlClass} id="records-month" name="month" type="month" value={values.monthValue} onChange={(event) => onChange('monthValue', event.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold" htmlFor="records-site">
          Provincia
          <select className={controlClass} id="records-site" name="siteId" value={values.siteId} onChange={(event) => onChange('siteId', event.target.value)}>
            {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold" htmlFor="records-client">
          Cliente
          <select className={controlClass} id="records-client" name="clientId" value={values.clientId} onChange={(event) => onChange('clientId', event.target.value)}>
            <option value="">Todos</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold" htmlFor="records-workplace">
          Lugar de trabajo
          <select className={controlClass} id="records-workplace" name="workplaceId" value={values.workplaceId} onChange={(event) => onChange('workplaceId', event.target.value)}>
            <option value="">Todos</option>
            {visibleWorkplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm font-semibold" htmlFor="records-employee">
          Buscar empleado
          <select className={controlClass} id="records-employee" name="employeeId" value={values.employeeId} onChange={(event) => onChange('employeeId', event.target.value)}>
            <option value="">Todos</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.lastName}, {employee.firstName} · {employee.employeeId}</option>)}
          </select>
        </label>
      </div>

      <details className="mt-2" open={hasAdvancedFilters || undefined}>
        <summary className="w-fit cursor-pointer text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Más filtros{hasAdvancedFilters ? ' · activos' : ''}</summary>
        <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-foreground/10 pt-2">
          <label className="flex min-w-40 flex-col gap-1 text-sm font-semibold" htmlFor="records-status">Completitud<select className={controlClass} id="records-status" value={values.status ?? ''} onChange={(event) => onChange('status', event.target.value)}><option value="">Todas</option><option value="COMPLETE">Completos</option><option value="INCOMPLETE">Incompletos</option></select></label>
          <label className="flex min-w-40 flex-col gap-1 text-sm font-semibold" htmlFor="records-review">Revisión<select className={controlClass} id="records-review" value={values.reviewStatus ?? ''} onChange={(event) => onChange('reviewStatus', event.target.value)}><option value="">Todas</option><option value="NONE">Sin revisión</option><option value="PENDING">Pendientes</option><option value="APPROVED">Aprobados</option><option value="REJECTED">Rechazados</option><option value="MANUAL_LOADED">Carga manual</option></select></label>
          <label className="flex min-w-40 flex-col gap-1 text-sm font-semibold" htmlFor="records-origin">Origen<select className={controlClass} id="records-origin" value={values.origin ?? ''} onChange={(event) => onChange('origin', event.target.value)}><option value="">Todos</option><option value="AUTOMATIC">Automático</option><option value="MANUAL">Manual</option></select></label>
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-foreground/20 px-3 text-sm font-semibold"><input checked={values.hasAbsence} name="hasAbsence" type="checkbox" onChange={(event) => onChange('hasAbsence', event.target.checked)} />Con ausencia</label>
          <button className="h-9 rounded-md border border-foreground/25 px-3 text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClearSecondary}>Limpiar filtros</button>
        </div>
      </details>
    </section>
  )
}
