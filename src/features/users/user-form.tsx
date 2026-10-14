import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, type InputHTMLAttributes, type ReactNode } from 'react'
import { useForm, type FieldError } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { getArgentinaCivilDate } from '../../lib/dates'
import { ServiceError } from '../../services/service-error'
import { userService } from '../../services/services'
import type { CreateUserInput, SiteReference, UpdateUserInput, UserDetail } from '../../types/users'
import { useToast } from '../toasts/use-toast'
import { createUserFormSchema, type UserFormFields } from './user-form-schema'

const fieldClass = 'min-h-11 rounded-md border border-foreground/25 bg-background px-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

function UserField({ name, label, error, children, ...inputProps }: InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; error?: FieldError; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2" data-invalid={Boolean(error)}>
      <label className="font-semibold" htmlFor={name}>{label}</label>
      {children ?? <input {...inputProps} className={fieldClass} id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} />}
      {error ? <p className="text-sm text-destructive" id={`${name}-error`} role="alert">{error.message}</p> : null}
    </div>
  )
}

export function UserForm({ current, sites }: { current?: UserDetail; sites: SiteReference[] }) {
  const editing = Boolean(current)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const schema = createUserFormSchema(editing)
  const { register, handleSubmit, setError, clearErrors, getValues, reset, formState: { errors, isDirty } } = useForm<UserFormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: current?.firstName ?? '', lastName: current?.lastName ?? '', employeeId: current?.employeeId ?? '', dni: current?.dni ?? '', email: current?.email ?? '', phone: current?.phone ?? '', address: current?.address ?? '', siteId: current?.site.id ?? '', birthDate: current?.birthDate ?? '', initialPassword: '', cuil: current?.cuil ?? '', hireDate: current?.hireDate ?? '', position: current?.position ?? '',
    },
  })

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (isDirty) event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty])

  const mutation = useMutation({
    mutationFn: (input: CreateUserInput | UpdateUserInput) => current ? userService.update(current.id, input as UpdateUserInput) : userService.create(input as CreateUserInput),
    onSuccess: async (user: UserDetail) => {
      reset({ ...getValues(), initialPassword: '' })
      queryClient.setQueryData(['user', user.id], user)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(editing ? 'Los cambios se guardaron correctamente.' : 'El empleado se creó correctamente.')
      navigate(`/usuarios/${user.id}`, { replace: true })
    },
    onError: (error) => {
      const code = error instanceof ServiceError ? error.code : ''
      const message = error instanceof Error ? error.message : 'No pudimos guardar el empleado. Revisá los datos y volvé a intentarlo.'
      const fieldByCode: Record<string, keyof UserFormFields> = { USER_EMAIL_ALREADY_EXISTS: 'email', USER_DNI_ALREADY_EXISTS: 'dni', USER_EMPLOYEE_ID_ALREADY_EXISTS: 'employeeId', INVALID_SITE: 'siteId', WEAK_PASSWORD: 'initialPassword' }
      const field = fieldByCode[code]
      if (field) setError(field, { type: 'server', message }, { shouldFocus: true })
      else if (code === 'INVALID_USER_DATA') {
        const result = schema.safeParse(getValues())
        if (!result.success) {
          result.error.issues.forEach((issue, index) => setError(issue.path[0] as keyof UserFormFields, { type: 'server', message: issue.message }, { shouldFocus: index === 0 }))
        } else {
          const identifiableField = /CUIL/i.test(message) ? 'cuil' : /fecha de ingreso/i.test(message) ? 'hireDate' : /puesto/i.test(message) ? 'position' : undefined
          if (identifiableField && editing) setError(identifiableField, { type: 'server', message }, { shouldFocus: true })
          else setError('root', { message })
        }
      } else setError('root', { message })
      toast.error('No pudimos guardar los cambios. Revisá los datos e intentá nuevamente.')
    },
  })

  const onSubmit = handleSubmit((values) => {
    clearErrors()
    if (!sites.some((site) => site.id === values.siteId)) {
      setError('siteId', { message: 'Seleccioná una provincia habilitada.' }, { shouldFocus: true })
      return
    }
    const { initialPassword, cuil, hireDate, position, ...common } = values
    mutation.mutate(editing ? { ...common, cuil: cuil || null, hireDate: hireDate || null, position: position || null } : { ...common, initialPassword })
  })
  const today = getArgentinaCivilDate()

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit} noValidate aria-busy={mutation.isPending}>
      <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6" disabled={mutation.isPending}>
        <legend className="px-2 text-lg font-bold">Identificación</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <UserField label="Nombre" error={errors.firstName} maxLength={100} required autoComplete="given-name" {...register('firstName')} />
          <UserField label="Apellido" error={errors.lastName} maxLength={100} required autoComplete="family-name" {...register('lastName')} />
          <UserField label="Legajo" error={errors.employeeId} maxLength={50} required autoComplete="off" {...register('employeeId')} />
          <UserField label="DNI" error={errors.dni} inputMode="numeric" maxLength={8} required autoComplete="off" {...register('dni')} />
          <UserField label="Fecha de nacimiento" error={errors.birthDate} max={today} required type="date" autoComplete="bday" {...register('birthDate')} />
          {editing ? <UserField label="CUIL (opcional)" error={errors.cuil} inputMode="numeric" maxLength={11} autoComplete="off" {...register('cuil')} /> : null}
        </div>
      </fieldset>
      <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6" disabled={mutation.isPending}>
        <legend className="px-2 text-lg font-bold">Contacto y asignación</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <UserField label="Email" error={errors.email} maxLength={254} required type="email" autoComplete="email" spellCheck={false} {...register('email')} />
          <UserField label="Teléfono" error={errors.phone} inputMode="tel" maxLength={13} required type="tel" autoComplete="tel" {...register('phone')} />
          <UserField label="Domicilio" error={errors.address} maxLength={200} required autoComplete="street-address" {...register('address')} />
          <UserField name="siteId" label="Provincia" error={errors.siteId}>
            <select className={fieldClass} id="siteId" required aria-invalid={Boolean(errors.siteId)} aria-describedby={errors.siteId ? 'siteId-error' : undefined} {...register('siteId')}>
              <option disabled value="">Seleccioná una provincia</option>
              {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
          </UserField>
          {editing ? <><UserField label="Fecha de ingreso (opcional)" error={errors.hireDate} max={today} type="date" autoComplete="off" {...register('hireDate')} /><UserField label="Puesto (opcional)" error={errors.position} maxLength={100} autoComplete="organization-title" {...register('position')} /></> : null}
        </div>
      </fieldset>
      {!editing ? <fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6" disabled={mutation.isPending}>
        <legend className="px-2 text-lg font-bold">Acceso inicial</legend>
        <UserField label="Contraseña inicial" error={errors.initialPassword} maxLength={128} required type="password" autoComplete="new-password" {...register('initialPassword')} />
        <p className="mt-2 text-sm leading-relaxed text-foreground/55">Entre 12 y 128 caracteres. Puede incluir espacios y caracteres Unicode.</p>
      </fieldset> : null}
      {errors.root ? <p className="rounded-md border border-destructive/35 bg-background p-4 font-semibold text-destructive" role="alert">{errors.root.message}</p> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-foreground/15 pt-6 sm:flex-row sm:justify-end">
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary" to={current ? `/usuarios/${current.id}` : '/usuarios'}>Cancelar</Link>
        <button className="min-h-11 rounded-md bg-primary px-6 font-semibold text-background hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear empleado'}</button>
      </div>
    </form>
  )
}
