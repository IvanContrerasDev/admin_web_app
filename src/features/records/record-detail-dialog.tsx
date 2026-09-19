import { useEffect, useMemo, useRef, useState } from 'react'
import type { AttendanceEventDetail, RecordInterval, ReviewStatus } from '../../types/records'
import { useAttendanceEventDetails, useRecordDetail } from './use-monthly-records'

interface RecordDetailDialogProps {
  recordId: string
  onClose: () => void
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'long',
  timeZone: 'America/Argentina/Buenos_Aires',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
})

const numberFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

const reviewLabels: Record<ReviewStatus, string> = {
  NONE: 'Sin revisión',
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  MANUAL_LOADED: 'Carga manual',
}

const absenceLabels = {
  ILLNESS: 'Enfermedad',
  VACATION: 'Vacaciones',
  LEAVE: 'Licencia',
  ART: 'ART',
  OTHER: 'Otro',
} as const

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00.000Z`))
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : 'Sin registrar'
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours} h ${String(remainder).padStart(2, '0')} min`
}

function intervalStatusLabel(interval: RecordInterval) {
  if (interval.status === 'OPEN') return 'Abierto'
  if (interval.status === 'SEMI_CLOSED') return 'Sin entrada'
  return 'Cerrado'
}

function eventTypeLabel(type: AttendanceEventDetail['type']) {
  if (type === 'CHECK_IN') return 'Entrada'
  if (type === 'CHECK_OUT') return 'Salida'
  return 'Ausencia'
}

const metadataLabels: Record<string, string> = {
  devicePlatform: 'Plataforma del dispositivo',
  appVersion: 'Versión de la aplicación',
  offline: 'Registrado sin conexión',
  geofenceDistanceMeters: 'Distancia al perímetro (m)',
}

function MetadataValue({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <>Sin dato</>
  if (typeof value === 'boolean') return <>{value ? 'Sí' : 'No'}</>
  if (typeof value === 'number') return <>{numberFormatter.format(value)}</>
  return <>{value}</>
}

function EventMetadata({ event }: { event: AttendanceEventDetail }) {
  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{eventTypeLabel(event.type)} · {formatDateTime(event.occurredAt)}</p>
        <span className="rounded-full border border-foreground/20 px-2 py-0.5 text-sm">{event.origin === 'MOBILE' ? 'Aplicación móvil' : 'Administración'}</span>
      </div>
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div><dt className="text-foreground/60">Recibido por el servidor</dt><dd>{formatDateTime(event.receivedAt)}</dd></div>
        <div><dt className="text-foreground/60">Observación</dt><dd className="break-words">{event.observation || 'Sin observación'}</dd></div>
        {event.location ? (
          <>
            <div><dt className="text-foreground/60">Coordenadas</dt><dd className="tabular-nums">{numberFormatter.format(event.location.latitude)}, {numberFormatter.format(event.location.longitude)}</dd></div>
            <div><dt className="text-foreground/60">Precisión</dt><dd className="tabular-nums">{numberFormatter.format(event.location.accuracyMeters)} m</dd></div>
            <div><dt className="text-foreground/60">Ubicación capturada</dt><dd>{formatDateTime(event.location.capturedAt)}</dd></div>
          </>
        ) : <div><dt className="text-foreground/60">Ubicación</dt><dd>Sin ubicación informada</dd></div>}
        {Object.entries(event.metadata).map(([key, value]) => (
          <div key={key}><dt className="break-words text-foreground/60">{metadataLabels[key] ?? key}</dt><dd className="break-words"><MetadataValue value={value} /></dd></div>
        ))}
      </dl>
    </div>
  )
}

export function RecordDetailDialog({ recordId, onClose }: RecordDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const detailQuery = useRecordDetail(recordId)
  const eventIds = useMemo(() => detailQuery.data?.intervals.flatMap((interval) => interval.attendanceEvents.map((event) => event.id)) ?? [], [detailQuery.data])
  const eventQueries = useAttendanceEventDetails(eventIds, showEventDetails)
  const eventQueryById = new Map(eventIds.map((eventId, index) => [eventId, eventQueries[index]]))
  const loadingEvents = showEventDetails && eventQueries.some((query) => query.isPending)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      aria-describedby="record-detail-description"
      aria-labelledby="record-detail-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-lg border border-foreground/20 bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
    >
      <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-foreground/15 bg-background p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-bold" id="record-detail-title">Detalle del registro</h2>
          <p className="text-pretty text-sm leading-6 text-foreground/65" id="record-detail-description">Información diaria, intervalos y evidencia de marcación asociada.</p>
        </div>
        <button aria-label="Cerrar detalle" className="shrink-0 rounded-md border border-foreground/25 px-3 py-1.5 text-sm font-semibold transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClose}>Cerrar</button>
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        {detailQuery.isPending ? <div aria-live="polite" className="flex min-h-64 items-center justify-center text-sm text-foreground/65">Cargando detalle del registro…</div> : null}
        {detailQuery.isError ? (
          <div className="rounded-md border border-accent/40 p-4" role="alert">
            <p className="font-semibold">No pudimos cargar el detalle.</p>
            <p className="mt-1 text-sm text-foreground/65">Revisá la conexión e intentá nuevamente.</p>
            <button className="mt-3 rounded-md border border-accent px-3 py-2 text-sm font-semibold text-accent transition-colors duration-150 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => void detailQuery.refetch()}>Reintentar</button>
          </div>
        ) : null}

        {detailQuery.data ? (
          <>
            <section aria-labelledby="record-summary-title" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold" id="record-summary-title">{detailQuery.data.employee.lastName}, {detailQuery.data.employee.firstName}</h3>
                  <p className="text-sm text-foreground/65">{detailQuery.data.employee.employeeId} · {formatDate(detailQuery.data.date)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-foreground/20 px-2.5 py-1">{detailQuery.data.recordStatus === 'COMPLETE' ? 'Completo' : 'Incompleto'}</span>
                  <span className="rounded-full border border-foreground/20 px-2.5 py-1">{reviewLabels[detailQuery.data.reviewStatus]}</span>
                  <span className="rounded-full border border-foreground/20 px-2.5 py-1">{detailQuery.data.origin === 'AUTOMATIC' ? 'Automático' : 'Manual'}</span>
                </div>
              </div>
              <dl className="grid gap-x-6 gap-y-3 rounded-md border border-foreground/15 bg-muted p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-foreground/60">Lugar de trabajo</dt><dd className="font-semibold">{detailQuery.data.workplace.name}</dd></div>
                <div><dt className="text-foreground/60">Cliente</dt><dd>{detailQuery.data.client.name}</dd></div>
                <div><dt className="text-foreground/60">Provincia</dt><dd>{detailQuery.data.site.name}</dd></div>
                <div><dt className="text-foreground/60">Total trabajado</dt><dd className="font-semibold tabular-nums">{formatMinutes(detailQuery.data.totalWorkMinutes)}</dd></div>
                <div className="sm:col-span-2 lg:col-span-4"><dt className="text-foreground/60">Observaciones</dt><dd className="break-words">{detailQuery.data.observations || 'Sin observaciones'}</dd></div>
              </dl>
            </section>

            <section aria-labelledby="intervals-title" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold" id="intervals-title">Intervalos</h3>
                  <p className="text-sm text-foreground/65">{detailQuery.data.intervals.length} {detailQuery.data.intervals.length === 1 ? 'intervalo' : 'intervalos'} en este registro.</p>
                </div>
                {eventIds.length > 0 && !showEventDetails ? <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-background transition-opacity duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => setShowEventDetails(true)}>Más detalles</button> : null}
              </div>

              <div className="flex flex-col gap-3">
                {detailQuery.data.intervals.map((interval, index) => (
                  <article className="flex flex-col gap-3 rounded-md border border-foreground/15 bg-background p-4" key={interval.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-bold">Intervalo {index + 1} · {interval.type === 'WORK' ? 'Trabajo' : 'Ausencia'}</h4>
                      <span className="text-sm font-semibold">{intervalStatusLabel(interval)}</span>
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div><dt className="text-foreground/60">Entrada</dt><dd>{formatDateTime(interval.startTime)}</dd></div>
                      <div><dt className="text-foreground/60">Salida</dt><dd>{formatDateTime(interval.endTime)}</dd></div>
                      <div><dt className="text-foreground/60">Origen</dt><dd>{interval.origin === 'AUTOMATIC' ? 'Automático' : 'Manual'}</dd></div>
                      <div><dt className="text-foreground/60">Revisión</dt><dd>{reviewLabels[interval.reviewStatus]}</dd></div>
                      {interval.type === 'ABSENCE' ? <div><dt className="text-foreground/60">Motivo</dt><dd>{interval.absenceReason ? absenceLabels[interval.absenceReason] : 'Sin motivo'}</dd></div> : null}
                      <div className="sm:col-span-2"><dt className="text-foreground/60">Observaciones</dt><dd className="break-words">{interval.observations || 'Sin observaciones'}</dd></div>
                    </dl>

                    {showEventDetails ? (
                      <div className="flex flex-col gap-2 border-t border-foreground/15 pt-3">
                        <h5 className="font-semibold">Eventos de marcación</h5>
                        {interval.attendanceEvents.length === 0 ? <p className="text-sm text-foreground/65">Este intervalo no tiene eventos automáticos asociados.</p> : null}
                        {interval.attendanceEvents.map((event) => {
                          const eventQuery = eventQueryById.get(event.id)
                          if (eventQuery?.isPending) return <p aria-live="polite" className="text-sm text-foreground/65" key={event.id}>Cargando metadata de {eventTypeLabel(event.type).toLowerCase()}…</p>
                          if (eventQuery?.isError) return <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/35 p-3 text-sm" key={event.id}><p>No pudimos cargar la metadata de {eventTypeLabel(event.type).toLowerCase()}.</p><button className="font-semibold text-accent underline underline-offset-4" type="button" onClick={() => void eventQuery.refetch()}>Reintentar</button></div>
                          return eventQuery?.data ? <EventMetadata event={eventQuery.data} key={event.id} /> : null
                        })}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              {loadingEvents ? <p aria-live="polite" className="text-sm text-foreground/65">Consultando la metadata de los eventos…</p> : null}
            </section>
          </>
        ) : null}
      </div>
    </dialog>
  )
}
