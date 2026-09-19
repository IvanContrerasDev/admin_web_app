import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { ALLOWED_ATTACHMENT_EXTENSIONS, MAX_ATTACHMENT_FILES, validateAttachmentBatch } from '../../lib/attachments'
import { timesheetsService } from '../../services/services'
import { ServiceError } from '../../services/service-error'
import type { WorkplaceListItem } from '../../types/organization'
import type { UserListItem } from '../../types/users'
import { fieldClass, labelClass } from '../organization/organization-ui'

interface TimesheetUploadDialogProps {
  employees: UserListItem[]
  workplaces: WorkplaceListItem[]
  onClose: () => void
  onSaved: (createdCount: number) => void
}

function currentMonthValue() {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date())
  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  return `${year}-${month}`
}

const acceptAttribute = ALLOWED_ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(',')

export function TimesheetUploadDialog({ employees, workplaces, onClose, onSaved }: TimesheetUploadDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const [employeeId, setEmployeeId] = useState('')
  const [workplaceId, setWorkplaceId] = useState('')
  const [periodValue, setPeriodValue] = useState(currentMonthValue)
  const [files, setFiles] = useState<File[]>([])
  const [issues, setIssues] = useState<string[]>([])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const uploadMutation = useMutation({
    mutationFn: () => {
      const [year, month] = periodValue.split('-').map(Number) as [number, number]
      return timesheetsService.create({
        employeeId,
        workplaceId,
        month,
        year,
        files: files.map((file) => ({ fileName: file.name, fileSizeBytes: file.size })),
      })
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onSaved(result.created.length)
    },
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const nextIssues: string[] = []
    if (!employeeId) nextIssues.push('Seleccioná el empleado asociado.')
    if (!workplaceId) nextIssues.push('Seleccioná el lugar de trabajo asociado.')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodValue)) nextIssues.push('Seleccioná el mes y el año de la planilla.')
    if (files.length === 0) nextIssues.push('Adjuntá al menos un archivo.')
    const validation = validateAttachmentBatch(files)
    if (!validation.valid) nextIssues.push(...validation.issues.map((issue) => issue.message))
    setIssues(nextIssues)
    if (nextIssues.length > 0) return
    uploadMutation.mutate()
  }

  const mutationError = uploadMutation.error
  const errorMessage = mutationError instanceof ServiceError ? mutationError.message : mutationError ? 'No pudimos cargar la planilla. Reintentá.' : null

  return (
    <dialog
      aria-describedby="timesheet-upload-description"
      aria-labelledby="timesheet-upload-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border border-foreground/20 bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55"
      ref={dialogRef}
      onClose={onClose}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-foreground/15 bg-background p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-bold" id="timesheet-upload-title">Cargar planilla</h2>
          <p className="text-pretty text-sm leading-6 text-foreground/65" id="timesheet-upload-description">La planilla queda pendiente y no genera registros automáticamente.</p>
        </div>
        <button aria-label="Cerrar carga de planilla" className="min-h-11 shrink-0 rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClose}>Cerrar</button>
      </header>

      <form className="flex flex-col gap-4 p-4 sm:p-5" onSubmit={submit}>
        <label className={labelClass} htmlFor="upload-employee">
          Empleado
          <select className={`${fieldClass} font-normal`} id="upload-employee" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
            <option value="">Seleccionar…</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.lastName}, {employee.firstName} · {employee.employeeId}</option>)}
          </select>
        </label>
        <label className={labelClass} htmlFor="upload-workplace">
          Lugar de trabajo
          <select className={`${fieldClass} font-normal`} id="upload-workplace" value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)} required>
            <option value="">Seleccionar…</option>
            {workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name} · {workplace.client.name} ({workplace.site.name})</option>)}
          </select>
        </label>
        <label className={labelClass} htmlFor="upload-period">
          Período
          <input className={`${fieldClass} font-normal`} id="upload-period" type="month" value={periodValue} onChange={(event) => setPeriodValue(event.target.value)} required />
        </label>
        <label className={labelClass} htmlFor="upload-files">
          Archivos
          <input
            className={`${fieldClass} font-normal file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:font-semibold file:text-background`}
            id="upload-files"
            type="file"
            accept={acceptAttribute}
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          <span className="text-sm font-normal text-foreground/60">Hasta {MAX_ATTACHMENT_FILES} archivos de 20 MiB cada uno. Formatos: PDF, JPG, JPEG, PNG, DOC, DOCX y TXT. Cada archivo crea una planilla del mismo período.</span>
        </label>
        {files.length > 0 ? (
          <ul className="rounded-md border border-foreground/15 px-4 py-3 text-sm">
            {files.map((file) => <li key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 py-0.5"><span className="min-w-0 truncate">{file.name}</span><span className="shrink-0 tabular-nums text-foreground/60">{(file.size / (1024 * 1024)).toLocaleString('es-AR', { maximumFractionDigits: 2 })} MiB</span></li>)}
          </ul>
        ) : null}

        {issues.length > 0 ? (
          <div className="rounded-md border border-accent/35 bg-background p-4" role="alert">
            <p className="font-semibold">Revisá los siguientes puntos:</p>
            <ul className="mt-2 list-disc pl-5 text-sm leading-6">
              {issues.map((issue) => <li key={issue}>{issue}</li>)}
            </ul>
          </div>
        ) : null}
        {errorMessage ? <p className="rounded-md border border-accent/35 bg-background p-4 text-sm font-semibold" role="alert">{errorMessage}</p> : null}

        <div className="flex flex-col gap-2 border-t border-foreground/10 pt-4 sm:flex-row sm:justify-end">
          <button className="min-h-11 rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClose}>Cancelar</button>
          <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60" type="submit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? 'Cargando…' : 'Confirmar carga'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
