import type { TimesheetStatus } from '../../types/timesheets'

const TIMESHEET_STATUS_LABELS: Record<TimesheetStatus, string> = {
  PENDING: 'Pendiente',
  LOADED: 'Cargada',
  ERROR: 'Error',
}

export function TimesheetStatusBadge({ status }: { status: TimesheetStatus }) {
  const styles = status === 'LOADED'
    ? 'bg-secondary/15 text-secondary'
    : status === 'PENDING'
      ? 'bg-accent/15 text-accent'
      : 'bg-accent text-background'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${styles}`}><span className="sr-only">Estado: </span>{TIMESHEET_STATUS_LABELS[status]}</span>
}
