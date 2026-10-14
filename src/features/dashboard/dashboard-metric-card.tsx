import { ArrowRight, Ban, Clipboard, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DashboardMetricKey } from '../../types/dashboard'

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
}

export function DashboardMetricCard({ title, description, value, href, metric }: DashboardMetricCardProps) {
  const { icon: Icon, border, badge } = metricStyles[metric]
  return (
    <Link to={href} className={`group flex min-w-0 flex-col gap-3 rounded-md border border-foreground/10 border-t-2 ${border} bg-surface p-4 text-foreground transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}>
      <span className={`flex size-11 items-center justify-center rounded-full ${badge}`} aria-hidden="true"><Icon size={23} strokeWidth={1.8} /></span>
      <div className="flex flex-col gap-1">
        <h3 className="text-balance font-sans text-sm font-semibold group-hover:text-primary">{title}</h3>
        <p className="text-pretty font-sans text-sm leading-relaxed text-foreground/60">{description}</p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <span aria-label={`${numberFormatter.format(value)}, total de todas las provincias`} className="font-sans text-3xl font-bold tabular-nums tracking-tight">{numberFormatter.format(value)}</span>
        <span className="inline-flex items-center gap-2 pb-1 font-sans text-sm font-medium text-primary">Abrir vista <ArrowRight size={14} aria-hidden="true" /></span>
      </div>
    </Link>
  )
}
