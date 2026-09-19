import { useEffect, useRef, useState } from 'react'
import type { WorkplaceListItem } from '../../types/organization'
import type { RecordDetail } from '../../types/records'
import type { UserListItem } from '../../types/users'
import { RecordEditorForm } from './record-editor-form'

interface RecordCreateDialogProps {
  initialEmployeeId?: string
  initialWorkplaceId?: string
  initialDate: string
  employees: UserListItem[]
  workplaces: WorkplaceListItem[]
  onClose: () => void
  onSaved: (record: RecordDetail) => void
}

export function RecordCreateDialog({ initialEmployeeId, initialWorkplaceId, initialDate, employees, workplaces, onClose, onSaved }: RecordCreateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [dirty, setDirty] = useState(false)
  const attemptClose = () => {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Querés descartarlos?')) return
    onClose()
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      aria-describedby="record-create-description"
      aria-labelledby="record-create-title"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-lg border border-foreground/20 bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        attemptClose()
      }}
      onClose={onClose}
    >
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-foreground/15 bg-background p-4 sm:p-5">
        <div className="min-w-0"><h2 className="text-balance text-xl font-bold" id="record-create-title">Crear registro manual</h2><p className="text-pretty text-sm leading-6 text-foreground/65" id="record-create-description">Cargá una corrección histórica sin generar eventos de marcación.</p></div>
        <button aria-label="Cerrar alta de registro" className="min-h-11 shrink-0 rounded-md border border-foreground/25 px-3 text-sm font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={attemptClose}>Cerrar</button>
      </header>
      <div className="p-4 sm:p-5"><RecordEditorForm employees={employees} initialDate={initialDate} initialEmployeeId={initialEmployeeId} initialWorkplaceId={initialWorkplaceId} workplaces={workplaces} onCancel={attemptClose} onDirtyChange={setDirty} onSaved={onSaved} /></div>
    </dialog>
  )
}
