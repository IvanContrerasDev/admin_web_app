import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { formatArgentinaDateTime } from '../../lib/dates'
import { documentsService } from '../../services/services'
import { ServiceError } from '../../services/service-error'
import { DOCUMENT_TYPE_LABELS, documentTypeSchema, type DocumentListItem, type DocumentType } from '../../types/documents'
import { fieldClass, labelClass } from '../organization/organization-ui'
import { formatFileSize } from '../timesheets/use-timesheets'

interface DocumentDetailDialogProps {
  document: DocumentListItem
  onClose: () => void
  onDeleted: () => void
}

function errorText(error: unknown, fallback: string) {
  return error instanceof ServiceError ? error.message : fallback
}

export function DocumentDetailDialog({ document, onClose, onDeleted }: DocumentDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(document)
  const [fileName, setFileName] = useState(document.fileName)
  const [type, setType] = useState<DocumentType>(document.type)
  const [confirmingDeletion, setConfirmingDeletion] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['documents'] })
  }

  const updateMutation = useMutation({
    mutationFn: () => documentsService.update(current.id, { fileName: fileName.trim(), type }),
    onSuccess: (updated) => {
      setCurrent(updated)
      setFileName(updated.fileName)
      setType(updated.type)
      refresh()
    },
  })

  const downloadMutation = useMutation({
    mutationFn: () => documentsService.getDownload(current.id),
    onSuccess: (result) => {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => documentsService.remove(current.id),
    onSuccess: () => {
      refresh()
      onDeleted()
    },
  })

  const dirty = fileName.trim() !== current.fileName || type !== current.type
  const actionError = updateMutation.error ?? downloadMutation.error ?? deleteMutation.error

  return (
    <dialog
      aria-labelledby="document-detail-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border border-foreground/20 bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55"
      ref={dialogRef}
      onClose={onClose}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-foreground/15 bg-background p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-balance text-xl font-bold" id="document-detail-title">Documento de {current.employee.lastName}, {current.employee.firstName}</h2>
          <p className="text-pretty text-sm leading-6 text-foreground/65">{DOCUMENT_TYPE_LABELS[current.type]} · {current.employee.employeeId}</p>
        </div>
        <button aria-label="Cerrar detalle de documento" className="min-h-11 shrink-0 rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={onClose}>Cerrar</button>
      </header>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="font-semibold text-foreground/60">Empleado</dt><dd className="font-semibold">{current.employee.lastName}, {current.employee.firstName} · {current.employee.employeeId}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Lugar de trabajo</dt><dd className="font-semibold">{current.workplace?.name ?? 'Sin lugar asociado'}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Formato y tamaño</dt><dd className="font-semibold uppercase">{current.fileExtension} <span className="normal-case text-foreground/60">({formatFileSize(current.fileSizeBytes)})</span></dd></div>
          <div><dt className="font-semibold text-foreground/60">Cargado</dt><dd className="tabular-nums">{formatArgentinaDateTime(current.createdAt)} por {current.uploadedBy.firstName} {current.uploadedBy.lastName}</dd></div>
          <div><dt className="font-semibold text-foreground/60">Última actualización</dt><dd className="tabular-nums">{formatArgentinaDateTime(current.updatedAt)}</dd></div>
        </dl>

        {actionError ? <p className="rounded-md border border-accent/35 bg-background p-4 text-sm font-semibold" role="alert">{errorText(actionError, 'La operación no se completó. Reintentá.')}</p> : null}

        <section aria-labelledby="document-edit-title" className="flex flex-col gap-3 rounded-md border border-foreground/15 p-4">
          <h3 className="font-semibold" id="document-edit-title">Clasificación</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass} htmlFor="document-edit-name">
              Nombre visible
              <input className={`${fieldClass} font-normal`} id="document-edit-name" type="text" value={fileName} maxLength={120} onChange={(event) => setFileName(event.target.value)} />
            </label>
            <label className={labelClass} htmlFor="document-edit-type">
              Tipo de documento
              <select className={`${fieldClass} font-normal`} id="document-edit-type" value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
                {documentTypeSchema.options.map((option) => <option key={option} value={option}>{DOCUMENT_TYPE_LABELS[option]}</option>)}
              </select>
            </label>
          </div>
          <div>
            <button className="min-h-11 rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={!dirty || fileName.trim().length === 0 || updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </section>

        <section aria-labelledby="document-view-title" className="flex flex-col gap-2 rounded-md border border-foreground/15 p-4">
          <h3 className="font-semibold" id="document-view-title">Archivo</h3>
          <p className="text-sm leading-6 text-foreground/65">La descarga genera un enlace firmado que vence a los 15 minutos.</p>
          <div>
            <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60" type="button" disabled={downloadMutation.isPending} onClick={() => downloadMutation.mutate()}>
              {downloadMutation.isPending ? 'Generando enlace…' : 'Ver archivo'}
            </button>
          </div>
        </section>

        <section aria-labelledby="document-delete-title" className="flex flex-col gap-2 rounded-md border border-accent/30 p-4">
          <h3 className="font-semibold" id="document-delete-title">Eliminar documento</h3>
          {!confirmingDeletion ? (
            <div>
              <p className="mb-3 text-sm leading-6 text-foreground/65">La eliminación quita el documento del legajo y no se puede deshacer.</p>
              <button className="min-h-11 rounded-md border border-accent px-4 font-semibold text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" type="button" onClick={() => setConfirmingDeletion(true)}>Eliminar documento</button>
            </div>
          ) : (
            <div className="rounded-md border border-accent/35 bg-accent/5 p-4" role="alert">
              <p className="text-sm font-semibold">Confirmás la eliminación permanente de <span className="break-all">{current.fileName}</span> del legajo de {current.employee.firstName} {current.employee.lastName}.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => setConfirmingDeletion(false)}>Cancelar</button>
                <button className="min-h-11 rounded-md bg-accent px-4 font-semibold text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60" type="button" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                  {deleteMutation.isPending ? 'Eliminando…' : 'Confirmar eliminación'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </dialog>
  )
}
