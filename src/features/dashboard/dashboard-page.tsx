import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { dashboardService } from '../../services/services'
import { useAuth } from '../auth/use-auth'

const numberFormatter = new Intl.NumberFormat('es-AR')
const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

const primaryActions = [
  { title: 'Revisar registros', description: 'Consultá la matriz mensual y atendé pendientes.', href: '/registros' },
  { title: 'Gestionar usuarios', description: 'Accedé al equipo y sus datos administrativos.', href: '/usuarios' },
  { title: 'Ver planillas', description: 'Organizá las cargas mensuales por empleado y lugar.', href: '/planillas' },
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
  const cards = metrics
    ? [
      { title: 'Planillas pendientes', value: metrics.pendingTimesheets, description: 'Planillas del mes sin procesar.', href: `/planillas?month=${monthValue}&status=PENDING` },
      { title: 'Registros incompletos', value: metrics.incompleteRecords, description: 'Registros del mes con información faltante.', href: `/registros?month=${monthValue}&status=INCOMPLETE` },
      { title: 'Pendientes de validación', value: metrics.pendingReviewRecords, description: 'Registros del mes que esperan revisión.', href: `/registros?month=${monthValue}&reviewStatus=PENDING` },
      { title: 'Registros con ausencia', value: metrics.recordsWithAbsence, description: 'Registros del mes con al menos una ausencia.', href: `/registros?month=${monthValue}&hasAbsence=true` },
    ]
    : []

  return (
    <div className="flex flex-col gap-8">
      <section className="border-b border-foreground/15 pb-8">
        <p className="font-sans text-sm font-semibold text-primary">Inicio</p>
        <h1 className="mt-2 text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Buen día, {session?.user.firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty font-sans text-base leading-relaxed text-foreground/70">
          Estado general de la operación y accesos a las tareas pendientes.
        </p>
      </section>

      <section aria-labelledby="metricas-title" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="metricas-title" className="text-balance font-sans text-xl font-semibold text-foreground">Tareas pendientes</h2>
            <p className="mt-1 text-pretty font-sans text-sm leading-relaxed text-foreground/65">Contadores del mes seleccionado. Cada tarjeta abre la vista filtrada del mismo período.</p>
          </div>
          <label className="flex flex-col gap-2 font-sans text-sm font-semibold" htmlFor="dashboard-month">
            Mes
            <input
              className="h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              id="dashboard-month"
              name="month"
              type="month"
              value={monthValue}
              onChange={(event) => updateMonth(event.target.value)}
            />
          </label>
        </div>

        <div aria-live="polite">
          {metricsQuery.isPending ? <p className="rounded-lg border border-foreground/15 bg-background p-6 text-foreground/65">Cargando métricas de <span className="capitalize">{periodLabel}</span>…</p> : null}
          {metricsQuery.isError ? (
            <div className="rounded-lg border border-destructive/35 bg-background p-5" role="alert">
              <p className="font-semibold">No pudimos cargar las métricas del mes.</p>
              <button className="mt-3 min-h-11 rounded-md border border-destructive px-4 font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive" type="button" onClick={() => void metricsQuery.refetch()}>Reintentar</button>
            </div>
          ) : null}
          {metrics ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <Link key={card.title} to={card.href} className="group flex min-h-40 flex-col justify-between gap-6 rounded-md border border-foreground/15 bg-background p-5 transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <div>
                    <h3 className="font-sans text-base font-semibold text-foreground group-hover:text-primary">{card.title}</h3>
                    <p className="mt-1 text-pretty font-sans text-sm leading-relaxed text-foreground/65">{card.description}</p>
                  </div>
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="font-sans text-4xl font-bold tabular-nums tracking-tight text-foreground">{numberFormatter.format(card.value)}</span>
                    <span className="font-sans text-sm font-semibold text-primary">Abrir vista</span>
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="acciones-title" className="flex flex-col gap-4">
        <h2 id="acciones-title" className="text-balance font-sans text-xl font-semibold text-foreground">Accesos principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {primaryActions.map((action) => (
            <Link key={action.href} to={action.href} className="group flex min-h-32 flex-col justify-between gap-6 rounded-md border border-foreground/15 bg-background p-5 transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <div>
                <h3 className="font-sans text-lg font-semibold text-foreground group-hover:text-primary">{action.title}</h3>
                <p className="mt-2 text-pretty font-sans text-sm leading-relaxed text-foreground/65">{action.description}</p>
              </div>
              <span className="font-sans text-sm font-semibold text-primary">Abrir sección</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
