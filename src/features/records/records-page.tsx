import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { RecordOrigin, RecordStatus, ReviewStatus } from '../../types/records'
import { RecordsFilters } from './records-filters'
import { RecordsMatrix } from './records-matrix'
import { useMonthlyRecords, useRecordsFilterOptions } from './use-monthly-records'

const numberFormatter = new Intl.NumberFormat('es-AR')

function currentMonthValue() {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

function validMonthValue(value: string | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonthValue()
}

function monthDates(year: number, month: number) {
  const total = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: total }, (_, index) => `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`)
}

function validRecordStatus(value: string | null): RecordStatus | undefined {
  return value === 'COMPLETE' || value === 'INCOMPLETE' ? value : undefined
}

function validReviewStatus(value: string | null): ReviewStatus | undefined {
  return value === 'NONE' || value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED' || value === 'MANUAL_LOADED' ? value : undefined
}

function validOrigin(value: string | null): RecordOrigin | undefined {
  return value === 'AUTOMATIC' || value === 'MANUAL' ? value : undefined
}

function formatTotal(minutes: number) {
  return numberFormatter.format(Math.round(minutes / 60))
}

export function RecordsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const options = useRecordsFilterOptions()
  const monthValue = validMonthValue(searchParams.get('month'))
  const [year, month] = monthValue.split('-').map(Number) as [number, number]
  const defaultSiteId = options.sites.data?.find((site) => site.name === 'San Juan')?.id ?? ''
  const siteId = searchParams.get('siteId') ?? defaultSiteId
  const clientId = searchParams.get('clientId') ?? ''
  const workplaceId = searchParams.get('workplaceId') ?? ''
  const employeeId = searchParams.get('employeeId') ?? ''
  const status = validRecordStatus(searchParams.get('status'))
  const reviewStatus = validReviewStatus(searchParams.get('reviewStatus'))
  const origin = validOrigin(searchParams.get('origin'))
  const hasAbsence = searchParams.get('hasAbsence') === 'true'

  useEffect(() => {
    if (!defaultSiteId || searchParams.has('siteId')) return
    const next = new URLSearchParams(searchParams)
    next.set('siteId', defaultSiteId)
    if (!next.has('month')) next.set('month', monthValue)
    setSearchParams(next, { replace: true })
  }, [defaultSiteId, monthValue, searchParams, setSearchParams])

  const recordsQuery = useMonthlyRecords({
    month,
    year,
    siteId: siteId || undefined,
    clientId: clientId || undefined,
    workplaceId: workplaceId || undefined,
    employeeId: employeeId || undefined,
    status,
    reviewStatus,
    origin,
    hasAbsence: hasAbsence ? true : undefined,
  }, Boolean(siteId))

  const pages = recordsQuery.data?.pages ?? []
  const rows = pages.flatMap((page) => page.data)
  const firstPage = pages[0]
  const totalItems = firstPage?.pagination.totalItems ?? 0
  const totalMinutes = firstPage?.meta.totals.monthWorkMinutes ?? 0

  const updateFilter = (name: string, value: string | boolean) => {
    const next = new URLSearchParams(searchParams)
    if (name === 'monthValue') {
      next.set('month', String(value))
    } else if (value === '' || value === false) {
      next.delete(name)
    } else {
      next.set(name, String(value))
    }
    if (name === 'siteId' || name === 'clientId') next.delete('workplaceId')
    setSearchParams(next)
  }

  const clearSecondaryFilters = () => {
    const next = new URLSearchParams()
    next.set('month', monthValue)
    if (siteId) next.set('siteId', siteId)
    setSearchParams(next)
  }

  const optionError = options.sites.isError || options.clients.isError || options.workplaces.isError || options.employees.isError
  const optionPending = options.sites.isPending || options.clients.isPending || options.workplaces.isPending || options.employees.isPending

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-balance font-sans text-2xl font-bold tracking-tight">Registros mensuales</h1>
          <p className="text-pretty text-sm leading-6 text-foreground/65">Una fila por empleado y lugar. Los horarios se muestran en GMT-3.</p>
        </div>
        {firstPage ? <p className="shrink-0 text-sm text-foreground/65"><span className="font-semibold tabular-nums text-foreground">{numberFormatter.format(totalItems)}</span> filas · <span className="font-semibold tabular-nums text-foreground">{formatTotal(totalMinutes)} h</span> totales</p> : null}
      </header>

      <RecordsFilters
        values={{ monthValue, siteId, clientId, workplaceId, employeeId, status, reviewStatus, origin, hasAbsence }}
        sites={options.sites.data ?? []}
        clients={options.clients.data?.data ?? []}
        workplaces={options.workplaces.data?.data ?? []}
        employees={options.employees.data?.data ?? []}
        onChange={updateFilter}
        onClearSecondary={clearSecondaryFilters}
      />

      <div aria-live="polite" className="min-w-0">
        {optionPending || recordsQuery.isPending ? <div className="flex min-h-80 items-center justify-center rounded-md border border-foreground/15 bg-background text-sm text-foreground/65">Cargando matriz mensual…</div> : null}
        {optionError || recordsQuery.isError ? <div className="rounded-md border border-accent/35 bg-background p-4" role="alert"><p className="font-semibold">No pudimos cargar la matriz mensual.</p><p className="mt-1 text-sm text-foreground/65">Revisá tu conexión o reiniciá la consulta para obtener un snapshot nuevo.</p><button className="mt-3 h-9 rounded-md border border-accent px-3 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => void recordsQuery.refetch()}>Reintentar</button></div> : null}
        {!optionPending && !recordsQuery.isPending && !optionError && !recordsQuery.isError && rows.length === 0 ? <div className="flex min-h-80 flex-col items-center justify-center gap-2 rounded-md border border-foreground/15 bg-background p-6 text-center"><h2 className="text-lg font-bold">No hay actividad para estos filtros</h2><p className="max-w-lg text-sm leading-6 text-foreground/65">La matriz solo muestra combinaciones de empleado y lugar con actividad en el mes seleccionado.</p><button className="mt-1 h-9 rounded-md border border-foreground/25 px-3 text-sm font-semibold transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={clearSecondaryFilters}>Limpiar filtros</button></div> : null}
        {rows.length > 0 ? <RecordsMatrix rows={rows} dates={monthDates(year, month)} totalItems={totalItems} hasNextPage={recordsQuery.hasNextPage} isFetchingNextPage={recordsQuery.isFetchingNextPage} onEndReached={() => void recordsQuery.fetchNextPage()} /> : null}
      </div>
    </section>
  )
}
