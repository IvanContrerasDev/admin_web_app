import { useState } from 'react'
import { Form, useSearchParams } from 'react-router-dom'
import { formatArgentinaDateTime } from '../../lib/dates'
import type { TimesheetStatus } from '../../types/timesheets'
import { PaginationNav, QueryState, fieldClass, labelClass } from '../organization/organization-ui'
import { TimesheetDetailDialog } from './timesheet-detail-dialog'
import { TimesheetStatusBadge } from './timesheet-status-badge'
import { TimesheetUploadDialog } from './timesheet-upload-dialog'
import { formatFileSize, formatPeriod, useTimesheetList, useTimesheetOptions } from './use-timesheets'

const pageSize = 25

function validStatus(value: string | null): TimesheetStatus | undefined {
  return value === 'PENDING' || value === 'LOADED' || value === 'ERROR' ? value : undefined
}

function validMonthValue(value: string | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : ''
}

export function TimesheetsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const options = useTimesheetOptions()
  const [notice, setNotice] = useState('')

  const search = searchParams.get('search') ?? ''
  const status = validStatus(searchParams.get('status'))
  const employeeId = searchParams.get('employeeId') ?? ''
  const clientId = searchParams.get('clientId') ?? ''
  const workplaceId = searchParams.get('workplaceId') ?? ''
  const siteId = searchParams.get('siteId') ?? ''
  const monthValue = validMonthValue(searchParams.get('month'))
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1)
  const [year, month] = monthValue ? (monthValue.split('-').map(Number) as [number, number]) : [undefined, undefined]

  const timesheetsQuery = useTimesheetList({
    search: search || undefined,
    status,
    employeeId: employeeId || undefined,
    clientId: clientId || undefined,
    workplaceId: workplaceId || undefined,
    siteId: siteId || undefined,
    month,
    year,
    page,
    pageSize,
  })

  const updateFilter = (name: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name === 'siteId' || name === 'clientId') next.delete('workplaceId')
    next.delete('page')
    setSearchParams(next)
  }

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const openDetail = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('timesheetId', id)
    setSearchParams(next)
  }

  const closeDetail = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('timesheetId')
    setSearchParams(next, { replace: true })
  }

  const openUpload = () => {
    const next = new URLSearchParams(searchParams)
    next.set('upload', 'true')
    setSearchParams(next)
  }

  const closeUpload = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('upload')
    setSearchParams(next, { replace: true })
  }

  const timesheets = timesheetsQuery.data?.data ?? []
  const pagination = timesheetsQuery.data?.pagination
  const selectedTimesheet = timesheets.find((item) => item.id === searchParams.get('timesheetId'))
  const visibleWorkplaces = (options.workplaces.data?.data ?? []).filter((workplace) => (!siteId || workplace.site.id === siteId) && (!clientId || workplace.client.id === clientId))

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">Planillas</h1>
          <p className="mt-2 text-pretty leading-relaxed text-foreground/65">Consultá las planillas de horas, cargá nuevas y marcá su procesamiento.</p>
        </div>
        <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={openUpload}>Cargar planilla</button>
      </header>

      <div className="rounded-lg border border-foreground/15 bg-background p-4 sm:p-5">
        <Form className="flex flex-col gap-4 lg:flex-row lg:items-end" method="get">
          <label className={`${labelClass} min-w-0 flex-1`} htmlFor="timesheet-search">
            Buscar
            <input className={`${fieldClass} font-normal placeholder:text-foreground/45`} defaultValue={search} id="timesheet-search" name="search" placeholder="Archivo, empleado o legajo…" type="search" autoComplete="off" />
          </label>
          <label className={labelClass} htmlFor="timesheet-month">
            Período
            <input className={`${fieldClass} font-normal`} id="timesheet-month" name="month" type="month" value={monthValue} onChange={(event) => updateFilter('month', event.target.value)} />
          </label>
          <label className={labelClass} htmlFor="timesheet-status">
            Estado
            <select className={`${fieldClass} font-normal`} id="timesheet-status" name="status" value={status ?? ''} onChange={(event) => updateFilter('status', event.target.value)}>
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="LOADED">Cargadas</option>
              <option value="ERROR">Con error</option>
            </select>
          </label>
          <button className="min-h-11 rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="submit">Buscar</button>
        </Form>
        <div className="mt-4 grid gap-4 border-t border-foreground/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={labelClass} htmlFor="timesheet-site">
            Provincia
            <select className={`${fieldClass} font-normal`} id="timesheet-site" name="siteId" value={siteId} onChange={(event) => updateFilter('siteId', event.target.value)}>
              <option value="">Todas</option>
              {(options.sites.data ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </label>
          <label className={labelClass} htmlFor="timesheet-client">
            Cliente
            <select className={`${fieldClass} font-normal`} id="timesheet-client" name="clientId" value={clientId} onChange={(event) => updateFilter('clientId', event.target.value)}>
              <option value="">Todos</option>
              {(options.clients.data?.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
          </label>
          <label className={labelClass} htmlFor="timesheet-workplace">
            Lugar de trabajo
            <select className={`${fieldClass} font-normal`} id="timesheet-workplace" name="workplaceId" value={workplaceId} onChange={(event) => updateFilter('workplaceId', event.target.value)}>
              <option value="">Todos</option>
              {visibleWorkplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}
            </select>
          </label>
          <label className={labelClass} htmlFor="timesheet-employee">
            Empleado
            <select className={`${fieldClass} font-normal`} id="timesheet-employee" name="employeeId" value={employeeId} onChange={(event) => updateFilter('employeeId', event.target.value)}>
              <option value="">Todos</option>
              {(options.employees.data?.data ?? []).map((employee) => <option key={employee.id} value={employee.id}>{employee.lastName}, {employee.firstName} · {employee.employeeId}</option>)}
            </select>
          </label>
        </div>
      </div>

      {notice ? <p className="rounded-lg border border-secondary/40 bg-secondary/10 px-5 py-4 text-sm font-semibold text-secondary" role="status">{notice}</p> : null}

      <QueryState pending={timesheetsQuery.isPending} error={timesheetsQuery.isError} empty={!timesheetsQuery.isPending && !timesheetsQuery.isError && timesheets.length === 0} subject="las planillas" onRetry={() => void timesheetsQuery.refetch()}>
        <div className="overflow-x-auto rounded-lg border border-foreground/15 bg-background">
          <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
            <caption className="sr-only">Planillas de horas ordenadas de la más reciente a la más antigua</caption>
            <thead>
              <tr className="border-b border-foreground/15 text-sm">
                <th className="px-4 py-3 font-semibold" scope="col">Empleado</th>
                <th className="px-4 py-3 font-semibold" scope="col">Período</th>
                <th className="px-4 py-3 font-semibold" scope="col">Lugar · Cliente</th>
                <th className="px-4 py-3 font-semibold" scope="col">Provincia</th>
                <th className="px-4 py-3 font-semibold" scope="col">Estado</th>
                <th className="px-4 py-3 font-semibold" scope="col">Archivo</th>
                <th className="px-4 py-3 font-semibold" scope="col">Cargada</th>
                <th className="px-4 py-3 font-semibold" scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map((timesheet) => (
                <tr className="border-b border-foreground/10 last:border-b-0" key={timesheet.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{timesheet.employee.lastName}, {timesheet.employee.firstName}</p>
                    <p className="text-foreground/60">{timesheet.employee.employeeId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold capitalize">{formatPeriod(timesheet.month, timesheet.year)}</p>
                    <p className="text-foreground/60">Planilla {timesheet.sequence}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{timesheet.workplace.name}</p>
                    <p className="text-foreground/60">{timesheet.client.name}</p>
                  </td>
                  <td className="px-4 py-3">{timesheet.site.name}</td>
                  <td className="px-4 py-3"><TimesheetStatusBadge status={timesheet.status} /></td>
                  <td className="max-w-56 px-4 py-3">
                    <p className="truncate font-semibold" title={timesheet.fileName}>{timesheet.fileName}</p>
                    <p className="uppercase text-foreground/60">{timesheet.fileExtension} · {formatFileSize(timesheet.fileSizeBytes)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="tabular-nums">{formatArgentinaDateTime(timesheet.createdAt, { dateStyle: 'short' })}</p>
                    <p className="text-foreground/60">por {timesheet.uploadedBy.firstName} {timesheet.uploadedBy.lastName}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => openDetail(timesheet.id)}>Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </QueryState>

      <PaginationNav pagination={pagination} label="planillas" onPage={goToPage} />

      {searchParams.get('upload') === 'true' ? (
        <TimesheetUploadDialog
          employees={options.employees.data?.data ?? []}
          workplaces={options.workplaces.data?.data ?? []}
          onClose={closeUpload}
          onSaved={(createdCount) => {
            closeUpload()
            setNotice(createdCount === 1 ? 'Se cargó 1 planilla y quedó pendiente de procesamiento.' : `Se cargaron ${createdCount} planillas y quedaron pendientes de procesamiento.`)
          }}
        />
      ) : null}
      {selectedTimesheet ? <TimesheetDetailDialog key={selectedTimesheet.id} timesheet={selectedTimesheet} onClose={closeDetail} /> : null}
    </section>
  )
}
