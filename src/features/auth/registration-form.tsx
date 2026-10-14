import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { getArgentinaCivilDate } from '../../lib/dates'
import { userService } from '../../services/services'
import { createRegistrationSchema, type RegistrationFields } from './registration-schema'

const inputClass = 'min-h-11 w-full rounded-md border border-foreground/25 bg-background px-3 py-2 font-sans text-base text-foreground shadow-sm transition-colors hover:border-foreground/50 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const fields = [
  { name: 'firstName', label: 'Nombre', autoComplete: 'given-name', maxLength: 100 },
  { name: 'lastName', label: 'Apellido', autoComplete: 'family-name', maxLength: 100 },
  { name: 'dni', label: 'DNI', autoComplete: 'off', inputMode: 'numeric', maxLength: 8 },
  { name: 'employeeId', label: 'Número de legajo', autoComplete: 'off', maxLength: 50 },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: 254 },
  { name: 'phone', label: 'Teléfono', type: 'tel', autoComplete: 'tel', inputMode: 'numeric', maxLength: 13 },
  { name: 'address', label: 'Domicilio', autoComplete: 'street-address', maxLength: 200 },
  { name: 'birthDate', label: 'Fecha de nacimiento', type: 'date', autoComplete: 'bday' },
  { name: 'initialPassword', label: 'Contraseña', type: 'password', autoComplete: 'new-password', maxLength: 128 },
  { name: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', autoComplete: 'new-password', maxLength: 128 },
] as const

export function RegistrationForm() {
  const noticeRef = useRef<HTMLDivElement>(null)
  const [validated, setValidated] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const sitesQuery = useQuery({
    queryKey: ['registration', 'sites'],
    queryFn: ({ signal }) => userService.listSites(signal),
    retry: false,
  })
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegistrationFields>({
    resolver: zodResolver(createRegistrationSchema()),
    defaultValues: { firstName: '', lastName: '', dni: '', employeeId: '', email: '', phone: '', address: '', birthDate: '', siteId: '', initialPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (validated) noticeRef.current?.focus()
  }, [validated])

  const validateForm = handleSubmit((values) => {
    if (!sitesQuery.data?.some((site) => site.id === values.siteId)) {
      setError('siteId', { message: 'Seleccioná una provincia disponible en el catálogo.' }, { shouldFocus: true })
      return
    }
    setValidated(true)
  })

  return (
    <form className="flex flex-col gap-6" onSubmit={validateForm} onChange={() => setValidated(false)} noValidate>
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-primary">Registro administrativo</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">Crear cuenta</h1>
        <p className="text-pretty text-base leading-relaxed text-foreground/70">Completá tus datos para solicitar acceso a Administración. Todos los campos son obligatorios.</p>
      </header>

      <aside className="rounded-md border border-primary/25 bg-primary/5 p-4 text-sm leading-relaxed text-foreground" aria-label="Disponibilidad del registro">
        <p className="font-semibold">Pantalla de registro en preparación</p>
        <p>Podés validar los datos del formulario. El envío al backend todavía no está habilitado: no se crean cuentas, no se guardan datos ni se envían correos.</p>
      </aside>

      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4 text-base font-semibold text-foreground">Tus datos</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.slice(0, 8).map((field) => {
            const error = errors[field.name]
            const type = 'type' in field ? field.type : 'text'
            return (
              <div key={field.name} className={`flex min-w-0 flex-col gap-2 ${field.name === 'address' ? 'sm:col-span-2' : ''}`}>
                <label htmlFor={`registration-${field.name}`} className="text-sm font-semibold text-foreground">{field.label}</label>
                <input id={`registration-${field.name}`} type={type} autoComplete={field.autoComplete} inputMode={'inputMode' in field ? field.inputMode : undefined} maxLength={'maxLength' in field ? field.maxLength : undefined} max={type === 'date' ? getArgentinaCivilDate() : undefined} spellCheck={false} className={inputClass} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? `registration-${field.name}-error` : field.name === 'phone' ? 'registration-phone-help' : undefined} {...register(field.name)} />
                {field.name === 'phone' ? <p id="registration-phone-help" className="text-sm text-foreground/65">Entre 10 y 13 dígitos, sin espacios ni símbolos.</p> : null}
                {error ? <p id={`registration-${field.name}-error`} role="alert" className="text-sm font-medium text-accent">{error.message}</p> : null}
              </div>
            )
          })}
          <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
            <label htmlFor="registration-siteId" className="text-sm font-semibold text-foreground">Provincia</label>
            <select id="registration-siteId" className={inputClass} disabled={sitesQuery.isPending || sitesQuery.isError} aria-required="true" aria-invalid={Boolean(errors.siteId)} aria-describedby={errors.siteId ? 'registration-siteId-error' : undefined} {...register('siteId')}>
              <option value="">{sitesQuery.isPending ? 'Cargando provincias…' : 'Seleccioná tu provincia'}</option>
              {sitesQuery.data?.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
            </select>
            {sitesQuery.isError ? <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-accent"><p>No pudimos cargar las provincias.</p><button type="button" onClick={() => void sitesQuery.refetch()} className="min-h-11 rounded-md border border-accent px-3 font-semibold hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">Reintentar</button></div> : null}
            {errors.siteId ? <p id="registration-siteId-error" role="alert" className="text-sm font-medium text-accent">{errors.siteId.message}</p> : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-4 border-t border-foreground/15 pt-5">
        <legend className="text-base font-semibold text-foreground">Seguridad de tu cuenta</legend>
        <p id="registration-password-help" className="text-sm leading-relaxed text-foreground/65">Usá entre 12 y 128 caracteres. Podés utilizar una frase fácil de recordar.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.slice(8).map((field) => {
            const error = errors[field.name]
            return (
              <div key={field.name} className="flex min-w-0 flex-col gap-2">
                <label htmlFor={`registration-${field.name}`} className="text-sm font-semibold text-foreground">{field.label}</label>
                <input id={`registration-${field.name}`} type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" maxLength={128} className={inputClass} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={`registration-password-help${error ? ` registration-${field.name}-error` : ''}`} {...register(field.name)} />
                {error ? <p id={`registration-${field.name}-error`} role="alert" className="text-sm font-medium text-accent">{error.message}</p> : null}
              </div>
            )
          })}
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground"><input type="checkbox" className="size-5 accent-primary" checked={passwordVisible} onChange={(event) => setPasswordVisible(event.target.checked)} />Mostrar contraseñas</label>
      </fieldset>

      {validated ? <div ref={noticeRef} role="status" tabIndex={-1} className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-foreground focus-visible:outline-2 focus-visible:outline-primary"><p className="font-semibold">Datos validados. Solicitud no enviada.</p><p>Para completar el registro falta habilitar el envío al backend. No se creó una cuenta ni se solicitó aprobación al SuperAdmin.</p></div> : null}
      <button type="submit" disabled={sitesQuery.isPending || sitesQuery.isError} className="min-h-11 rounded-md bg-primary px-4 py-3 text-base font-semibold text-background transition-colors hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60">Validar datos de registro</button>
      <p className="text-center text-sm leading-relaxed text-foreground/70">¿Ya tenés acceso? <Link to="/login" className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Iniciar sesión</Link></p>
    </form>
  )
}
