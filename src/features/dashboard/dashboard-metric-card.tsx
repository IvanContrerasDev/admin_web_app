import { ArrowRight, Ban, Clipboard, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardMetricKey, ProvinceMetrics } from '../../types/dashboard'

const numberFormatter = new Intl.NumberFormat('es-AR')
const metricStyles = {
  pendingTimesheets: { icon: FileText, border: 'border-t-primary', badge: 'bg-primary/10 text-primary' },
  incompleteRecords: { icon: Clipboard, border: 'border-t-secondary', badge: 'bg-secondary/10 text-secondary' },
  pendingReviewRecords: { icon: ShieldCheck, border: 'border-t-accent', badge: 'bg-accent/10 text-accent' },
  recordsWithAbsence: { icon: Ban, border: 'border-t-primary', badge: 'bg-primary/10 text-primary' },
}

interface DashboardMetricCardProps {
  title: string
  description: string
  value: number
  href: string
  metric: DashboardMetricKey
  provinces: ProvinceMetrics[]
}

export function DashboardMetricCard({ title, description, value, href, metric, provinces }: DashboardMetricCardProps) {
  const { icon: Icon, border, badge } = metricStyles[metric]
  return (
    <Link to={href} className={`group flex min-w-0 flex-col gap-3 rounded-md border border-foreground/10 border-t-2 ${border} bg-surface p-4 text-foreground transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}>
      <span className={`flex size-11 items-center justify-center rounded-full ${badge}`} aria-hidden="true"><Icon size={23} strokeWidth={1.8} /></span>
      <div className="flex flex-col gap-1">
        <h3 className="text-balance font-sans text-sm font-semibold group-hover:text-primary">{title}</h3>
        <p className="text-pretty font-sans text-sm leading-relaxed text-foreground/60">{description}</p>
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <span className="font-sans text-3xl font-bold tabular-nums tracking-tight">{numberFormatter.format(value)}</span>
        <span className="font-sans text-sm leading-relaxed text-foreground/65">Total de todas las provincias</span>
      </div>
      <div className="flex flex-col gap-3 border-t border-foreground/10 pt-3">
        <p className="font-sans text-sm font-semibold">Desglose por provincia</p>
        {provinces.length ? (
          <dl aria-label={`${title} por provincia`} className="flex flex-col gap-2 font-sans text-sm leading-relaxed">
            {provinces.map((province) => (
              <div key={province.id} className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 break-words text-foreground/70">{province.name}</dt>
                <dd className="shrink-0 font-semibold tabular-nums">{numberFormatter.format(province[metric])}</dd>
              </div>
            ))}
          </dl>
        ) : <p className="font-sans text-sm leading-relaxed text-foreground/65">Sin provincias para este período.</p>}
      </div>
      <span className="mt-auto inline-flex items-center gap-2 pt-2 font-sans text-sm font-medium text-primary">Abrir vista <ArrowRight size={14} aria-hidden="true" /></span>
    </Link>
  )
}
