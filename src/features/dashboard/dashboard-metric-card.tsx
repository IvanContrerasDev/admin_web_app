import { Link } from 'react-router-dom'
import type { DashboardMetricKey, ProvinceMetrics } from '../../types/dashboard'

const numberFormatter = new Intl.NumberFormat('es-AR')

interface DashboardMetricCardProps {
  title: string
  description: string
  value: number
  href: string
  metric: DashboardMetricKey
  provinces: ProvinceMetrics[]
}

export function DashboardMetricCard({ title, description, value, href, metric, provinces }: DashboardMetricCardProps) {
  return (
    <Link to={href} className="group flex min-w-0 flex-col gap-5 rounded-md border border-foreground/15 bg-background p-5 transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <div>
        <h3 className="text-balance font-sans text-base font-semibold text-foreground group-hover:text-primary">{title}</h3>
        <p className="mt-1 text-pretty font-sans text-sm leading-relaxed text-foreground/65">{description}</p>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-sans text-4xl font-bold tabular-nums tracking-tight text-foreground">{numberFormatter.format(value)}</span>
        <span className="font-sans text-sm text-foreground/65">Total de todas las provincias</span>
      </div>
      <div className="flex flex-col gap-3 border-t border-foreground/15 pt-4">
        <p className="font-sans text-sm font-semibold text-foreground">Desglose por provincia</p>
        {provinces.length > 0 ? (
          <dl aria-label={`${title} por provincia`} className="flex flex-col gap-2 font-sans text-sm leading-relaxed">
            {provinces.map((province) => (
              <div key={province.id} className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 break-words text-foreground/70">{province.name}</dt>
                <dd className="shrink-0 font-semibold tabular-nums text-foreground">{numberFormatter.format(province[metric])}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="font-sans text-sm leading-relaxed text-foreground/65">Sin provincias para este período.</p>
        )}
      </div>
      <span className="mt-auto font-sans text-sm font-semibold text-primary">Abrir vista</span>
    </Link>
  )
}
