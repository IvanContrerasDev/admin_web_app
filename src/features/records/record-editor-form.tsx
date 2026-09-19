import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ServiceError } from '../../services/service-error'
import { recordsService } from '../../services/services'
import type { WorkplaceListItem } from '../../types/organization'
import type { AbsenceReason, CreateRecordInput, RecordDetail, RecordInterval, RecordIntervalChange, RecordIntervalInput, UpdateRecordInput } from '../../types/records'
import type { UserListItem } from '../../types/users'

interface RecordEditorFormProps {
  record?: RecordDetail
  initialEmployeeId?: string
  initialWorkplaceId?: string
  initialDate: string
  employees: UserListItem[]
  workplaces: WorkplaceListItem[]
  onCancel: () => void
  onSaved: (record: RecordDetail) => void
  onDirtyChange?: (dirty: boolean) => void
}

interface EditableInterval {
  key: string
  id?: string
  type: 'WORK' | 'ABSENCE'
  startTime: string
  endTime: string
  absenceReason: AbsenceReason | ''
  observations: string
  original?: string
}

const fieldClass = 'min-h-11 rounded-md border border-foreground/25 bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const absenceOptions: Array<{ value: AbsenceReason; label: string }> = [
  { value: 'ILLNESS', label: 'Enfermedad' },
  { value: 'VACATION', label: 'Vacaciones' },
  { value: 'LEAVE', label: 'Licencia' },
  { value: 'ART', label: 'ART' },
  { value: 'OTHER', label: 'Otro' },
]

function toLocalInput(value: string | null) {
  if (!value) return ''
  const shifted = new Date(new Date(value).getTime() - 3 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}

function toUtcIso(value: string) {
  return value ? new Date(`${value}:00-03:00`).toISOString() : null
}

function intervalSignature(interval: Pick<EditableInterval, 'type' | 'startTime' | 'endTime' | 'absenceReason' | 'observations'>) {
  return JSON.stringify({ type: interval.type, startTime: interval.startTime, endTime: interval.endTime, absenceReason: interval.absenceReason, observations: interval.observations })
}

function fromRecordInterval(interval: RecordInterval): EditableInterval {
  const editable = {
    key: interval.id,
    id: interval.id,
    type: interval.type,
    startTime: toLocalInput(interval.startTime),
    endTime: toLocalInput(interval.endTime),
    absenceReason: (interval.absenceReason ?? '') as EditableInterval['absenceReason'],
    observations: interval.observations ?? '',
  }
  return { ...editable, original: intervalSignature(editable) }
}

function emptyInterval(index: number): EditableInterval {
  return { key: `new-${index}`, type: 'WORK', startTime: '', endTime: '', absenceReason: '', observations: '' }
}

function toInput(interval: EditableInterval): RecordIntervalInput {
  return {
    type: interval.type,
    startTime: toUtcIso(interval.startTime),
    endTime: toUtcIso(interval.endTime),
    absenceReason: interval.type === 'ABSENCE' && interval.absenceReason ? interval.absenceReason : null,
    observations: interval.observations.trim() || null,
  }
}

function editorSignature(employeeId: string, workplaceId: string, date: string, observations: string, intervals: EditableInterval[]) {
  return JSON.stringify({ employeeId, workplaceId, date, observations, intervals: intervals.map(intervalSignature) })
}

function validateIntervals(intervals: EditableInterval[]) {
  const errors: string[] = []
  intervals.forEach((interval, index) => {
    if (interval.type === 'WORK' && (!interval.startTime || !interval.endTime)) errors.push(`Intervalo ${index + 1}: completá entrada y salida.`)
    if (interval.startTime && interval.endTime && new Date(`${interval.endTime}:00-03:00`) <= new Date(`${interval.startTime}:00-03:00`)) errors.push(`Intervalo ${index + 1}: la salida debe ser posterior a la entrada.`)
  })
  const bounded = intervals.filter((interval) => interval.startTime && interval.endTime).map((interval) => ({ start: new Date(`${interval.startTime}:00-03:00`).getTime(), end: new Date(`${interval.endTime}:00-03:00`).getTime() })).sort((left, right) => left.start - right.start)
  if (bounded.some((interval, index) => index > 0 && interval.start < bounded[index - 1]!.end)) errors.push('Los intervalos manuales no pueden superponerse.')
  return errors
}

export function RecordEditorForm({ record, initialEmployeeId = '', initialWorkplaceId = '', initialDate, employees, workplaces, onCancel, onSaved, onDirtyChange }: RecordEditorFormProps) {
  const queryClient = useQueryClient()
  const errorRef = useRef<HTMLDivElement>(null)
  const [baseRecord, setBaseRecord] = useState(record)
  const [employeeId, setEmployeeId] = useState(record?.employee.id ?? initialEmployeeId)
  const [workplaceId, setWorkplaceId] = useState(record?.workplace.id ?? initialWorkplaceId)
  const [date, setDate] = useState(record?.date ?? initialDate)
  const [observations, setObservations] = useState(record?.observations ?? '')
  const [intervals, setIntervals] = useState<EditableInterval[]>(() => record ? record.intervals.map(fromRecordInterval) : [emptyInterval(1)])
  const [errors, setErrors] = useState<string[]>([])
  const [versionConflict, setVersionConflict] = useState(false)
  const [initialSignature, setInitialSignature] = useState(() => editorSignature(employeeId, workplaceId, date, observations, intervals))
  const dirty = editorSignature(employeeId, workplaceId, date, observations, intervals) !== initialSignature
  const editing = Boolean(baseRecord)
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.accountStatus === 'ACTIVE'), [employees])
  const activeWorkplaces = useMemo(() => workplaces.filter((workplace) => workplace.status === 'ACTIVE'), [workplaces])
  const conflictQuery = useQuery({
    queryKey: ['records', 'conflict', baseRecord?.id],
    queryFn: ({ signal }) => recordsService.getDetail(baseRecord!.id, signal),
    enabled: versionConflict && Boolean(baseRecord),
  })

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const mutation = useMutation({
    mutationFn: () => {
      const normalizedObservations = observations.trim() || null
      if (!baseRecord) {
        const input: CreateRecordInput = { userId: employeeId, workplaceId, date, observations: normalizedObservations, intervals: intervals.map(toInput) }
        return recordsService.create(input)
      }
      const intervalChanges = intervals.reduce<RecordIntervalChange[]>((changes, interval) => {
        const input = toInput(interval)
        if (!interval.id) changes.push({ operation: 'ADD', interval: input })
        else if (interval.original !== intervalSignature(interval)) changes.push({ operation: 'UPDATE', id: interval.id, interval: input })
        return changes
      }, [])
      const input: UpdateRecordInput = { expectedVersion: baseRecord.version }
      if (normalizedObservations !== baseRecord.observations) input.observations = normalizedObservations
      if (intervalChanges.length) input.intervalChanges = intervalChanges
      return recordsService.update(baseRecord.id, input)
    },
    onSuccess: async (saved) => {
      queryClient.setQueryData(['records', 'detail', saved.id], saved)
      await queryClient.invalidateQueries({ queryKey: ['records', 'monthly'] })
      onSaved(saved)
    },
    onError: (caught) => {
      if (caught instanceof ServiceError && caught.code === 'RECORD_VERSION_CONFLICT') {
        setVersionConflict(true)
        setErrors(['El registro cambió desde que lo abriste. Compará la versión actual antes de continuar.'])
      } else if (caught instanceof ServiceError && caught.code === 'RECORD_ALREADY_EXISTS') {
        setErrors(['Ya existe un registro para ese empleado, lugar y fecha. Cerrá este formulario y abrí el registro existente.'])
      } else {
        setErrors([caught instanceof Error ? caught.message : 'No pudimos guardar el registro.'])
      }
      requestAnimationFrame(() => errorRef.current?.focus())
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateIntervals(intervals)
    if (!editing && (!employeeId || !workplaceId || !date)) nextErrors.unshift('Seleccioná empleado, lugar y fecha.')
    if (nextErrors.length) {
      setErrors(nextErrors)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    setErrors([])
    setVersionConflict(false)
    mutation.mutate()
  }

  const updateInterval = (key: string, patch: Partial<EditableInterval>) => {
    setIntervals((current) => current.map((interval) => interval.key === key ? { ...interval, ...patch } : interval))
  }

  const loadCurrentVersion = () => {
    const current = conflictQuery.data
    if (!current) return
    const currentIntervals = current.intervals.map(fromRecordInterval)
    setBaseRecord(current)
    setObservations(current.observations ?? '')
    setIntervals(currentIntervals)
    setInitialSignature(editorSignature(current.employee.id, current.workplace.id, current.date, current.observations ?? '', currentIntervals))
    setVersionConflict(false)
    setErrors([])
  }

  return (
    <form className="flex flex-col gap-5" noValidate onSubmit={submit}>
      {errors.length ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4" ref={errorRef} role="alert" tabIndex={-1}>
          <h3 className="font-bold">Revisá estos datos</h3>
          <ul className="mt-2 list-disc pl-5 text-sm leading-6">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          {versionConflict ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-destructive/20 pt-3 text-sm">
              <span>{conflictQuery.data ? `Versión actual: ${conflictQuery.data.version}. Tu formulario conserva la versión ${baseRecord?.version}.` : 'Consultando la versión actual…'}</span>
              <button className="min-h-9 rounded-md border border-destructive px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" disabled={!conflictQuery.data} type="button" onClick={loadCurrentVersion}>Descartar y cargar versión actual</button>
            </div>
          ) : null}
        </div>
      ) : null}

      <fieldset className="grid gap-4 rounded-md border border-foreground/15 p-4 md:grid-cols-3" disabled={editing}>
        <legend className="px-1 font-bold">Identidad del registro</legend>
        {editing ? (
          <>
            <div><span className="block text-sm text-foreground/60">Empleado</span><strong>{baseRecord!.employee.lastName}, {baseRecord!.employee.firstName}</strong></div>
            <div><span className="block text-sm text-foreground/60">Lugar</span><strong>{baseRecord!.workplace.name}</strong></div>
            <div><span className="block text-sm text-foreground/60">Fecha</span><strong className="tabular-nums">{baseRecord!.date}</strong></div>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="record-employee">Empleado<select className={fieldClass} id="record-employee" name="employeeId" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">Seleccionar…</option>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.lastName}, {employee.firstName} · {employee.employeeId}</option>)}</select></label>
            <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="record-workplace">Lugar de trabajo<select className={fieldClass} id="record-workplace" name="workplaceId" value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)}><option value="">Seleccionar…</option>{activeWorkplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name} · {workplace.client.name}</option>)}</select></label>
            <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="record-date">Fecha<input className={fieldClass} id="record-date" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          </>
        )}
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-semibold" htmlFor="record-observations">Observaciones generales<textarea className="min-h-24 rounded-md border border-foreground/25 bg-background p-3 font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" id="record-observations" name="observations" value={observations} onChange={(event) => setObservations(event.target.value)} /></label>

      <section className="flex flex-col gap-3" aria-labelledby="record-editor-intervals">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-lg font-bold" id="record-editor-intervals">Intervalos</h3><p className="text-sm leading-6 text-foreground/65">No se pueden eliminar intervalos existentes. Las horas se editan en GMT-3.</p></div><button className="min-h-11 rounded-md border border-primary px-4 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button" onClick={() => setIntervals((current) => [...current, emptyInterval(current.length + 1)])}>Agregar intervalo</button></div>
        {intervals.map((interval, index) => (
          <fieldset className="grid gap-4 rounded-md border border-foreground/15 bg-muted/40 p-4 md:grid-cols-2" key={interval.key}>
            <legend className="px-1 font-bold">Intervalo {index + 1}{interval.id ? ' · existente' : ' · nuevo'}</legend>
            <label className="flex flex-col gap-2 text-sm font-semibold">Tipo<select className={fieldClass} name={`interval-${index}-type`} value={interval.type} onChange={(event) => updateInterval(interval.key, { type: event.target.value as EditableInterval['type'], absenceReason: '' })}><option value="WORK">Trabajo</option><option value="ABSENCE">Ausencia</option></select></label>
            {interval.type === 'ABSENCE' ? <label className="flex flex-col gap-2 text-sm font-semibold">Motivo opcional<select className={fieldClass} name={`interval-${index}-absence`} value={interval.absenceReason} onChange={(event) => updateInterval(interval.key, { absenceReason: event.target.value as EditableInterval['absenceReason'] })}><option value="">Sin motivo</option>{absenceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label> : <div />}
            <label className="flex flex-col gap-2 text-sm font-semibold">Entrada<input className={fieldClass} name={`interval-${index}-start`} type="datetime-local" value={interval.startTime} onChange={(event) => updateInterval(interval.key, { startTime: event.target.value })} /></label>
            <label className="flex flex-col gap-2 text-sm font-semibold">Salida<input className={fieldClass} name={`interval-${index}-end`} type="datetime-local" value={interval.endTime} onChange={(event) => updateInterval(interval.key, { endTime: event.target.value })} /></label>
            <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">Observaciones del intervalo<textarea className="min-h-20 rounded-md border border-foreground/25 bg-background p-3 font-normal text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" name={`interval-${index}-observations`} value={interval.observations} onChange={(event) => updateInterval(interval.key, { observations: event.target.value })} /></label>
          </fieldset>
        ))}
      </section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-foreground/15 bg-background py-4">
        <button className="min-h-11 rounded-md border border-foreground/25 px-4 font-semibold hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" disabled={mutation.isPending} type="button" onClick={onCancel}>Cancelar</button>
        <button className="min-h-11 rounded-md bg-primary px-4 font-semibold text-background hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : editing ? 'Guardar corrección' : 'Crear registro'}</button>
      </div>
    </form>
  )
}
