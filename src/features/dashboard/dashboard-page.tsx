import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, ChevronRight, ClipboardCheck, File, Link as LinkIcon, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { dashboardService } from '../../services/services'
import { LoadingSkeleton } from '../../app/loading-skeleton'
import { useAuth } from '../auth/use-auth'
import type { DashboardMetricKey } from '../../types/dashboard'
import { DashboardMetricCard } from './dashboard-metric-card'
const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const primaryActions = [
  { title: 'Revisar registros', description: 'Consultá la matriz mensual y atendé pendientes.', href: '/registros', icon: File, badge: 'bg-primary/10 text-primary' },
  { title: 'Gestionar usuarios', description: 'Accedé al equipo y sus datos administrativos.', href: '/usuarios', icon: Users, badge: 'bg-secondary/10 text-secondary' },
  { title: 'Ver planillas', description: 'Organizá las cargas mensuales por empleado y lugar.', href: '/planillas', icon: CalendarDays, badge: 'bg-accent/10 text-accent' },
]

function currentMonthValue() {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

function validMonthValue(value: string | null) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonthValue()
}

export function DashboardPage() {
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const monthValue = validMonthValue(searchParams.get('month'))
  const [year, month] = monthValue.split('-').map(Number) as [number, number]
  const periodLabel = monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))

  useEffect(() => {
    if (searchParams.get('month') === monthValue) return
    const next = new URLSearchParams(searchParams)
    next.set('month', monthValue)
    setSearchParams(next, { replace: true })
  }, [monthValue, searchParams, setSearchParams])

  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics', { month, year }],
    queryFn: ({ signal }) => dashboardService.getMetrics({ month, year }, signal),
  })

  const updateMonth = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('month', value)
    else next.delete('month')
    setSearchParams(next)
  }

  const metrics = metricsQuery.data
  const cards: { title: string; value: number; description: string; href: string; metric: DashboardMetricKey }[] = metrics
    ? [
      { metric: 'pendingTimesheets', title: 'Planillas pendientes', value: metrics.pendingTimesheets, description: 'Planillas del mes sin procesar.', href: `/planillas?month=${monthValue}&status=PENDING` },
      { metric: 'incompleteRecords', title: 'Registros incompletos', value: metrics.incompleteRecords, description: 'Registros del mes con información faltante.', href: `/registros?month=${monthValue}&status=INCOMPLETE` },
      { metric: 'pendingReviewRecords', title: 'Pendientes de validación', value: metrics.pendingReviewRecords, description: 'Registros del mes que esperan revisión.', href: `/registros?month=${monthValue}&reviewStatus=PENDING` },
      { metric: 'recordsWithAbsence', title: 'Registros con ausencia', value: metrics.recordsWithAbsence, description: 'Registros del mes con al menos una ausencia.', href: `/registros?month=${monthValue}&hasAbsence=true` },
    ]
    : []

  return (
    <div className="flex min-h-full flex-col bg-dashboard text-foreground">
      <section className="dashboard-welcome flex min-h-40 flex-col justify-center gap-2 px-5 py-8 sm:px-8">
        <h1 className="text-balance font-sans text-3xl font-bold tracking-tight sm:text-4xl">
          ¡Hola, {session?.user.firstName}!
        </h1>
      </section>

      <div className="flex flex-col gap-7 px-5 py-6 sm:px-8">
      <section aria-labelledby="metricas-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 shrink-0 text-primary" size={24} aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 id="metricas-title" className="text-balance font-sans text-xl font-semibold text-foreground">Tareas pendientes</h2>
              <p className="text-pretty font-sans text-sm leading-relaxed text-foreground/60">Contadores del mes seleccionado. Cada tarjeta abre la vista filtrada del mismo período.</p>
            </div>
          </div>
          <label className="flex flex-col gap-2 font-sans text-sm font-semibold" htmlFor="dashboard-month">
            Mes
            <input
              className="h-10 w-full rounded-md border border-foreground/15 bg-surface px-3 font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-56"
              id="dashboard-month"
              name="month"
              type="month"
              value={monthValue}
              onChange={(event) => updateMonth(event.target.value)}
            />
          </label>
        </div>

        <div aria-live="polite">
          {metricsQuery.isPending ? <LoadingSkeleton label={`Cargando métricas de ${periodLabel}…`} variant="metrics" /> : null}
          {metricsQuery.isError ? (
            <div className="rounded-lg border border-destructive/35 bg-background p-5" role="alert">
              <p className="font-semibold">No pudimos cargar las métricas del mes.</p>
              <button className="mt-3 min-h-11 rounded-md border border-destructive px-4 font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive" type="button" onClick={() => void metricsQuery.refetch()}>Reintentar</button>
            </div>
          ) : null}
          {metrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <DashboardMetricCard key={card.metric} {...card} provinces={metrics.byProvince} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="acciones-title" className="flex flex-col gap-4 border-t border-foreground/5 pt-5">
        <h2 id="acciones-title" className="flex items-center gap-3 text-balance font-sans text-xl font-semibold text-foreground"><LinkIcon size={24} className="shrink-0 text-primary" aria-hidden="true" />Accesos principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {primaryActions.map(({ icon: Icon, ...action }) => (
            <Link key={action.href} to={action.href} className="group flex min-h-32 flex-col justify-between gap-5 rounded-md border border-foreground/10 bg-surface p-4 text-foreground transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <div className="flex items-start gap-3">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${action.badge}`}><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="font-sans text-sm font-semibold group-hover:text-primary">{action.title}</h3>
                  <p className="text-pretty font-sans text-sm leading-relaxed text-foreground/60">{action.description}</p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-foreground/45" aria-hidden="true" />
              </div>
              <span className="flex items-center gap-2 font-sans text-sm font-medium text-primary">Abrir sección <ArrowRight size={14} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </section>

      </div>
    </div>
  )
}
