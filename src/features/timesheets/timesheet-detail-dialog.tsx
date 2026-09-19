import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { validateAttachmentBatch } from '../../lib/attachments'
import { formatArgentinaDateTime } from '../../lib/dates'
import { timesheetsService } from '../../services/services'
import { ServiceError } from '../../services/service-error'
import type { TimesheetListItem, TimesheetStatus } from '../../types/timesheets'
import { fieldClass, labelClass } from '../organization/organization-ui'
import { TimesheetStatusBadge } from './timesheet-status-badge'
import { formatFileSize, formatPeriod } from './use-timesheets'

interface TimesheetDetailDialogProps {
  timesheet: TimesheetListItem
  onClose: () => void
}

function errorText(error: unknown, fallback: string) {
  return error instanceof ServiceError ? error.message : fallback
}

export function TimesheetDetailDialog({ timesheet, onClose }: TimesheetDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(timesheet)
  const [selectedStatus, setSelectedStatus] = useState<TimesheetStatus>(timesheet.status)
  const [replacement, setReplacement] = useState<File | null>(null)
  const [confirmingReplacement, setConfirmingReplacement] = useState(false)
  const [replacementIssue, setReplacementIssue] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['timesheets'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: TimesheetStatus) => timesheetsService.setStatus(current.id, status),
    onSuccess: (updated) => {
      setCurrent(updated)
      setSelectedStatus(updated.status)
      refresh()
    },
  })

  const downloadMutation = useMutation({
    mutationFn: () => timesheetsService.getDownload(current.id),
    onSuccess: (result) => {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
    },
  })

  const replaceMutation = useMutation({
    mutationFn: (file: File) => timesheetsService.replaceFile(current.id, { file: { fileName: file.name, fileSizeBytes: file.size } }),
    onSuccess: (updated) => {
      setCurrent(updated)
      setReplacement(null)
      setConfirmingReplacement(false)
      setReplacementIssue('')
      refresh()
    },
  })

  const requestReplacement = () => {
    if (!replacement) return
    const validation = validateAttachmentBatch([replacement])
    if (!validation.valid) {
      setReplacementIssue(validation.issues.map((issue) => issue.message).join(' '))
      return
    }
    setReplacementIssue('')
    setConfirmingReplacement(true)
  }

  const actionError = statusMutation.error ?? downloadMutation.error ?? replaceMutation.error

  return (
    <dialog
      aria-labelledby="timesheet-detail-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border border-foreground/20 bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55"
      ref={dialogRef}
      onClose={onClose}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-foreground/15 bg-background p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-bold" id="timesheet-detail-title">Planilla de {current.employee.lastName}, {current.employee.firstName}</h2>
          <p className="text-pretty text-sm leading-6 capitalize text-foreground/65">{formatPeriod(current.month, current.year)} · Planilla {current.sequence}</p>
        </div>
        <button aria-label="Cerrar detalle de planilla" className="min-h-11 shrink-0 rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClose}>Cerrar</button>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-foreground/60">Empleado</dt><dd className="font-semibold">{current.employee.lastName}, {current.employee.firstName} · {current.employee.employeeId}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Lugar de trabajo</dt><dd className="font-semibold">{current.workplace.name}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Cliente</dt><dd className="font-semibold">{current.client.name}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Provincia</dt><dd className="font-semibold">{current.site.name}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Estado</dt><dd><TimesheetStatusBadge status={current.status} /></dd></div>
          <div><dt className="font-semibold text-foreground/60">Archivo vigente</dt><dd className="font-semibold"><span className="break-all">{current.fileName}</span> <span className="font-normal uppercase text-foreground/60">({current.fileExtension} · {formatFileSize(current.fileSizeBytes)})</span></dd></div>
          <div><dt className="font-semibold text-foreground/60">Cargada</dt><dd className="tabular-nums">{formatArgentinaDateTime(current.createdAt)} por {current.uploadedBy.firstName} {current.uploadedBy.lastName}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Última actualización</dt><dd className="tabular-nums">{formatArgentinaDateTime(current.updatedAt)}</dd></div>
        </dl>

        {actionError ? <p className="rounded-md border border-accent/35 bg-background p-4 text-sm font-semibold" role="alert">{errorText(actionError, 'La operación no se completó. Reintentá.')}</p> : null}

        <section aria-labelledby="timesheet-view-title" className="flex flex-col gap-2 rounded-md border border-foreground/15 p-4">
          <h3 className="font-semibold" id="timesheet-view-title">Archivo</h3>
          <p className="text-sm leading-6 text-foreground/65">La descarga genera un enlace firmado que vence a los 15 minutos.</p>
          <div>
            <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60" type="button" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
              {downloadMutation.isPending ? 'Generando enlace…' : 'Ver archivo'}
            </button>
          </div>
        </section>

        <section aria-labelledby="timesheet-status-title" className="flex flex-col gap-2 rounded-md border border-foreground/15 p-4">
          <h3 className="font-semibold" id="timesheet-status-title">Estado de procesamiento</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className={`${labelClass} min-w-0 flex-1`} htmlFor="timesheet-status-select">
              Estado
              <select className={`${fieldClass} font-normal`} id="timesheet-status-select" value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as TimesheetStatus)}>
                <option value="PENDING">Pendiente</option>
                <option value="LOADED">Cargada</option>
                <option value="ERROR">Error</option>
              </select>
            </label>
            <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={selectedStatus === current.status || statusMutation.isPending} onClick={() => statusMutation.mutate(selectedStatus)}>
              {statusMutation.isPending ? 'Guardando…' : 'Guardar estado'}
            </button>
          </div>
        </section>

        <section aria-labelledby="timesheet-replace-title" className="flex flex-col gap-2 rounded-md border border-foreground/15 p-4">
          <h3 className="font-semibold" id="timesheet-replace-title">Reemplazar archivo</h3>
          <p className="text-sm leading-6 text-foreground/65">El archivo actual se eliminará permanentemente y el nuevo pasará a ser la versión vigente.</p>
          <input
            aria-label="Archivo de reemplazo"
            className={`${fieldClass} font-normal file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-semibold file:text-background`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            onChange={(event) => {
              setReplacement(event.target.files?.[0] ?? null)
              setConfirmingReplacement(false)
              setReplacementIssue('')
            }}
          />
          {replacementIssue ? <p className="text-sm font-semibold text-accent" role="alert">{replacementIssue}</p> : null}
          {replacement && !confirmingReplacement ? (
            <div>
              <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={requestReplacement}>Revisar reemplazo</button>
            </div>
          ) : null}
          {replacement && confirmingReplacement ? (
            <div className="rounded-md border border-accent/35 bg-accent/5 p-4" role="alert">
              <p className="text-sm font-semibold">Confirmás el reemplazo de <span className="break-all">{current.fileName}</span> por <span className="break-all">{replacement.name}</span>. El archivo actual se eliminará permanentemente.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => setConfirmingReplacement(false)}>Cancelar</button>
                <button className="min-h-11 rounded-md bg-accent px-4 font-semibold text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60" type="button" disabled={replaceMutation.isPending} onClick={() => replaceMutation.mutate(replacement)}>
                  {replaceMutation.isPending ? 'Reemplazando…' : 'Confirmar reemplazo'}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </dialog>
  )
}
