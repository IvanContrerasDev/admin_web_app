import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ServiceError } from '../../services/service-error'
import { userService } from '../../services/services'
import type { CreateUserInput, UpdateUserInput, UserDetail } from '../../types/users'
import { useToast } from '../toasts/use-toast'

const fieldClass = 'min-h-11 rounded-md border border-foreground/25 bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const labelClass = 'flex flex-col gap-2 font-semibold'

type FieldErrors = Partial<Record<'email' | 'dni' | 'employeeId', string>>

function formValue(data: FormData, key: string) { return String(data.get(key) ?? '').trim() }

export function UserFormPage() {
  const { userId } = useParams()
  const editing = Boolean(userId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const toast = useToast()

  const sitesQuery = useQuery({ queryKey: ['sites'], queryFn: ({ signal }) => userService.listSites(signal) })
  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: ({ signal }) => userService.get(userId!, signal), enabled: editing })

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const mutation = useMutation({
    mutationFn: (input: CreateUserInput | UpdateUserInput) => editing ? userService.update(userId!, input as UpdateUserInput) : userService.create(input as CreateUserInput),
    onSuccess: async (user: UserDetail) => {
      setDirty(false)
      queryClient.setQueryData(['user', user.id], user)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(editing ? 'Los cambios se guardaron correctamente.' : 'El empleado se creó correctamente.')
      navigate(`/usuarios/${user.id}`, { replace: true })
    },
    onError: (error) => {
      const code = error instanceof ServiceError ? error.code : ''
      if (code === 'USER_EMAIL_ALREADY_EXISTS') setFieldErrors({ email: 'Ese email ya pertenece a otro empleado.' })
      else if (code === 'USER_DNI_ALREADY_EXISTS') setFieldErrors({ dni: 'Ese DNI ya pertenece a otro empleado.' })
      else if (code === 'USER_EMPLOYEE_ID_ALREADY_EXISTS') setFieldErrors({ employeeId: 'Ese legajo ya pertenece a otro empleado.' })
      else if (code === 'WEAK_PASSWORD') setFormError('La contraseña inicial debe tener entre 12 y 128 caracteres.')
      else setFormError(error instanceof Error ? error.message : 'No pudimos guardar el empleado. Revisá los datos y volvé a intentarlo.')
      toast.error('No pudimos guardar los cambios. Revisá los datos e intentá nuevamente.')
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})
    setFormError('')
    const data = new FormData(event.currentTarget)
    const common = { firstName: formValue(data, 'firstName'), lastName: formValue(data, 'lastName'), employeeId: formValue(data, 'employeeId'), dni: formValue(data, 'dni'), email: formValue(data, 'email'), phone: formValue(data, 'phone'), address: formValue(data, 'address'), siteId: formValue(data, 'siteId'), birthDate: formValue(data, 'birthDate') }
    mutation.mutate(editing ? { ...common, cuil: formValue(data, 'cuil') || null, hireDate: formValue(data, 'hireDate') || null, position: formValue(data, 'position') || null } : { ...common, initialPassword: String(data.get('initialPassword') ?? '') })
  }

  if (sitesQuery.isPending || editing && userQuery.isPending) return <p aria-live="polite">Cargando formulario…</p>
  if (sitesQuery.isError || editing && (userQuery.isError || !userQuery.data)) return <div className="rounded-lg border border-destructive/35 bg-background p-6" role="alert"><h1 className="text-2xl font-bold">No pudimos preparar el formulario</h1><p className="mt-2 text-foreground/65">Volvé al listado e intentá nuevamente.</p></div>

  const current = userQuery.data
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <nav aria-label="Migas de pan"><Link className="font-semibold text-primary hover:underline" to={current ? `/usuarios/${current.id}` : '/usuarios'}>Empleados</Link><span className="px-2 text-foreground/40" aria-hidden="true">/</span><span aria-current="page">{editing ? 'Editar' : 'Nuevo'}</span></nav>
      <header className="border-b border-foreground/15 pb-6"><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{editing ? `Editar a ${current?.firstName} ${current?.lastName}` : 'Agregar empleado'}</h1><p className="mt-2 text-pretty leading-relaxed text-foreground/65">{editing ? 'Actualizá los datos personales y laborales. El estado de acceso se administra desde el detalle.' : 'Ingresá los datos requeridos para crear una cuenta activa.'}</p></header>

      <form className="flex flex-col gap-8" onChange={() => setDirty(true)} onSubmit={handleSubmit} noValidate={false}>
        <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Identificación</legend><div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>Nombre<input className={fieldClass} defaultValue={current?.firstName} maxLength={100} name="firstName" required autoComplete="given-name" /></label>
          <label className={labelClass}>Apellido<input className={fieldClass} defaultValue={current?.lastName} maxLength={100} name="lastName" required autoComplete="family-name" /></label>
          <label className={labelClass}>Legajo<input aria-describedby={fieldErrors.employeeId ? 'employeeId-error' : undefined} className={fieldClass} defaultValue={current?.employeeId} maxLength={50} name="employeeId" required autoComplete="off" /><span className="text-sm font-normal text-destructive" id="employeeId-error" role={fieldErrors.employeeId ? 'alert' : undefined}>{fieldErrors.employeeId}</span></label>
          <label className={labelClass}>DNI<input aria-describedby={fieldErrors.dni ? 'dni-error' : undefined} className={fieldClass} defaultValue={current?.dni} inputMode="numeric" maxLength={8} minLength={7} name="dni" pattern="[0-9]{7,8}" required autoComplete="off" /><span className="text-sm font-normal text-destructive" id="dni-error" role={fieldErrors.dni ? 'alert' : undefined}>{fieldErrors.dni}</span></label>
          <label className={labelClass}>Fecha de nacimiento<input className={fieldClass} defaultValue={current?.birthDate} max="2026-09-17" name="birthDate" required type="date" autoComplete="bday" /></label>
          {editing ? <label className={labelClass}>CUIL <span className="text-sm font-normal text-foreground/55">Opcional</span><input className={fieldClass} defaultValue={current?.cuil ?? ''} inputMode="numeric" maxLength={11} name="cuil" pattern="[0-9]{11}" autoComplete="off" /></label> : null}
        </div></fieldset>

        <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Contacto y asignación</legend><div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>Email<input aria-describedby={fieldErrors.email ? 'email-error' : undefined} className={fieldClass} defaultValue={current?.email} maxLength={254} name="email" required type="email" autoComplete="email" spellCheck={false} /><span className="text-sm font-normal text-destructive" id="email-error" role={fieldErrors.email ? 'alert' : undefined}>{fieldErrors.email}</span></label>
          <label className={labelClass}>Teléfono<input className={fieldClass} defaultValue={current?.phone} inputMode="tel" maxLength={13} minLength={10} name="phone" pattern="[0-9]{10,13}" required type="tel" autoComplete="tel" /></label>
          <label className={`${labelClass} sm:col-span-2`}>Domicilio<input className={fieldClass} defaultValue={current?.address} maxLength={200} name="address" required autoComplete="street-address" /></label>
          <label className={labelClass}>Provincia<select className={fieldClass} defaultValue={current?.site.id ?? ''} name="siteId" required><option disabled value="">Seleccioná una provincia</option>{sitesQuery.data?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
          {editing ? <><label className={labelClass}>Fecha de ingreso <span className="text-sm font-normal text-foreground/55">Opcional</span><input className={fieldClass} defaultValue={current?.hireDate ?? ''} max="2026-09-17" name="hireDate" type="date" autoComplete="off" /></label><label className={labelClass}>Puesto <span className="text-sm font-normal text-foreground/55">Opcional</span><input className={fieldClass} defaultValue={current?.position ?? ''} maxLength={100} name="position" autoComplete="organization-title" /></label></> : null}
        </div></fieldset>

        {!editing ? <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Acceso inicial</legend><label className={labelClass}>Contraseña inicial<input className={fieldClass} minLength={12} maxLength={128} name="initialPassword" required type="password" autoComplete="new-password" /><span className="text-sm font-normal leading-relaxed text-foreground/55">Entre 12 y 128 caracteres. Puede incluir espacios y caracteres Unicode.</span></label></fieldset> : null}

        {formError ? <p className="rounded-md border border-destructive/35 bg-background p-4 font-semibold text-destructive" role="alert">{formError}</p> : null}
        <div className="flex flex-col-reverse gap-3 border-t border-foreground/15 pt-6 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary" to={current ? `/usuarios/${current.id}` : '/usuarios'}>Cancelar</Link><button className="min-h-11 rounded-md bg-primary px-6 font-semibold text-background hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear empleado'}</button></div>
      </form>
    </section>
  )
}
