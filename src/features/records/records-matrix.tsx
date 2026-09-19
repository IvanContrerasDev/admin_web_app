import type { UIEvent, WheelEvent } from 'react'
import type { MonthlyDay, MonthlyRow } from '../../types/records'

interface RecordsMatrixProps {
  rows: MonthlyRow[]
  dates: string[]
  totalItems: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onEndReached: () => void
  onRecordOpen: (recordId: string) => void
  onEmptyCreate: (employeeId: string, workplaceId: string, date: string) => void
}

const shortWeekdayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'UTC' })

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder === 0 ? `${hours} h` : `${hours}:${String(remainder).padStart(2, '0')}`
}

function isSunday(date: string) {
  return new Date(`${date}T12:00:00.000Z`).getUTCDay() === 0
}

function dayNumber(date: string) {
  return Number(date.slice(-2))
}

function weekday(date: string) {
  return shortWeekdayFormatter.format(new Date(`${date}T12:00:00.000Z`)).replace('.', '')
}

function cellState(day: MonthlyDay) {
  if (day.state === 'EMPTY') return { value: '—', note: '', label: 'Sin registro' }
  const record = day.record
  if (record.hasAbsence) return { value: 'Aus.', note: record.reviewStatus === 'PENDING' ? 'Pend.' : '', label: 'Ausencia' }
  if (record.recordStatus === 'INCOMPLETE') return { value: 'Inc.', note: record.reviewStatus === 'REJECTED' ? 'Rech.' : '', label: 'Registro incompleto' }
  if (record.reviewStatus === 'REJECTED') return { value: formatMinutes(record.totalWorkMinutes), note: 'Rech.', label: 'Registro rechazado' }
  if (record.reviewStatus === 'PENDING') return { value: formatMinutes(record.totalWorkMinutes), note: 'Pend.', label: 'Revisión pendiente' }
  if (record.reviewStatus === 'MANUAL_LOADED') return { value: formatMinutes(record.totalWorkMinutes), note: 'Manual', label: 'Carga manual' }
  return { value: formatMinutes(record.totalWorkMinutes), note: '', label: 'Registro completo' }
}

function cellClass(day: MonthlyDay) {
  const sunday = isSunday(day.date)
  if (day.state === 'PRESENT' && (day.record.reviewStatus === 'REJECTED' || day.record.recordStatus === 'INCOMPLETE')) return 'bg-accent/10 text-accent'
  if (day.state === 'PRESENT' && day.record.hasAbsence) return 'bg-secondary/10 text-secondary'
  if (sunday) return 'bg-foreground/[0.06] text-foreground/70'
  return 'bg-background text-foreground'
}

export function RecordsMatrix({ rows, dates, totalItems, hasNextPage, isFetchingNextPage, onEndReached, onRecordOpen, onEmptyCreate }: RecordsMatrixProps) {
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 160 && hasNextPage && !isFetchingNextPage) onEndReached()
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.shiftKey || event.deltaY === 0) return
    event.currentTarget.scrollLeft += event.deltaY
    event.preventDefault()
  }

  return (
    <div
      aria-label="Matriz mensual de registros. Usá Mayús y la rueda del mouse para desplazarte por los días."
      className="records-matrix-viewport overflow-auto rounded-md border border-foreground/20 bg-background"
      onScroll={handleScroll}
      onWheel={handleWheel}
      tabIndex={0}
    >
      <table className="w-max border-separate border-spacing-0 text-sm" aria-rowcount={totalItems + 1}>
        <caption className="sr-only">Registros por empleado, lugar de trabajo y día del mes</caption>
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 h-11 w-64 min-w-64 border-b border-r border-foreground/20 bg-foreground px-3 text-left font-semibold text-background" scope="col">Empleado y lugar</th>
            {dates.map((date) => (
              <th className={`sticky top-0 z-20 h-11 w-14 min-w-14 border-b border-r border-foreground/20 px-1 text-center font-semibold ${isSunday(date) ? 'bg-foreground/15 text-foreground' : 'bg-background text-foreground'}`} key={date} scope="col">
                <span className="block capitalize text-foreground/60">{weekday(date)}</span>
                <span className="block tabular-nums">{dayNumber(date)}</span>
              </th>
            ))}
            <th className="sticky right-0 top-0 z-30 h-11 w-20 min-w-20 border-b border-l border-foreground/20 bg-foreground px-2 text-right font-semibold text-background" scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.employee.id}-${row.workplace.id}`}>
              <th className="sticky left-0 z-10 h-12 w-64 min-w-64 border-b border-r border-foreground/15 bg-background px-3 text-left font-normal" scope="row">
                <span className="block truncate font-semibold" title={`${row.employee.lastName}, ${row.employee.firstName}`}>{row.employee.lastName}, {row.employee.firstName}</span>
                <span className="block truncate text-foreground/60" title={`${row.workplace.name} · ${row.client.name}`}>{row.workplace.name} · {row.client.name}</span>
              </th>
              {row.days.map((day) => {
                const state = cellState(day)
                const detail = day.state === 'PRESENT' && !day.matchesFilters ? ' No coincide con los filtros de estado, pero se conserva para evitar duplicados.' : ''
                return (
                  <td className={`h-12 w-14 min-w-14 border-b border-r border-foreground/15 p-0 text-center tabular-nums ${cellClass(day)} ${day.state === 'PRESENT' && !day.matchesFilters ? 'opacity-45' : ''}`} key={day.date}>
                    {day.state === 'PRESENT' ? (
                      <button
                        aria-label={`${day.date}: ${state.label}. Abrir detalle del registro`}
                        className="size-full min-h-12 cursor-pointer px-1 transition-colors duration-150 hover:bg-primary/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                        title={`${state.label}${detail}. Doble clic o Enter para abrir el detalle.`}
                        type="button"
                        onDoubleClick={() => onRecordOpen(day.record.id)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          onRecordOpen(day.record.id)
                        }}
                      >
                        <span className="block font-semibold">{state.value}</span>
                        {state.note ? <span className="block leading-4">{state.note}</span> : null}
                      </button>
                    ) : (
                      <button
                        aria-label={`${day.date}: sin registro confirmado. Crear registro manual`}
                        className="size-full min-h-12 px-1 font-semibold text-foreground/45 transition-colors duration-150 hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                        title="Sin registro confirmado. Crear registro manual."
                        type="button"
                        onClick={() => onEmptyCreate(row.employee.id, row.workplace.id, day.date)}
                      >{state.value}</button>
                    )}
                  </td>
                )
              })}
              <td className="sticky right-0 z-10 h-12 w-20 min-w-20 border-b border-l border-foreground/20 bg-background px-2 text-right font-semibold tabular-nums">{formatMinutes(row.totals.monthWorkMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-live="polite" className="sticky bottom-0 left-0 flex min-h-8 w-full items-center justify-center border-t border-foreground/10 bg-background px-3 text-sm text-foreground/65">
        {isFetchingNextPage ? 'Cargando más filas…' : hasNextPage ? 'Desplazate hacia abajo para cargar más filas' : `${rows.length} de ${totalItems} filas`}
      </div>
    </div>
  )
}
