import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { ServiceError } from '../../services/service-error'
import { useAuth } from './use-auth'

const loginSchema = z.object({
  identifier: z.string().trim().email('Ingresá un email válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
  rememberSession: z.boolean(),
})

type LoginFields = z.infer<typeof loginSchema>

const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Ingresá los 6 dígitos del código.'),
})

type CodeFields = z.infer<typeof codeSchema>

function getErrorMessage(error: unknown) {
  if (error instanceof ServiceError) return error.message
  return 'No se pudo completar el acceso. Intentá nuevamente.'
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/login')) return '/'
  return value
}

function LoginForm() {
  const { login, isSubmitting } = useAuth()
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberSession: false },
  })

  useEffect(() => {
    if (errors.root) errorSummaryRef.current?.focus()
  }, [errors.root])

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login({ ...values, identifier: values.identifier.trim(), client: 'ADMIN' })
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-foreground">Ingresá a Administración</h1>
        <p className="mt-2 max-w-md text-pretty font-sans text-base leading-relaxed text-foreground/70">
          Revisá registros, equipos y documentación operativa desde un único lugar.
        </p>
      </div>

      {errors.root ? (
        <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-md border border-accent bg-accent/10 px-4 py-3 text-sm font-medium text-foreground">
          {errors.root.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="font-sans text-sm font-semibold text-foreground" htmlFor="identifier">Email</label>
        <input
          id="identifier"
          type="email"
          autoComplete="username"
          spellCheck={false}
          className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 py-2 font-sans text-base text-foreground shadow-sm transition-colors duration-150 placeholder:text-foreground/45 hover:border-foreground/50 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          placeholder="nombre@empresa.com…"
          aria-invalid={Boolean(errors.identifier)}
          aria-describedby={errors.identifier ? 'identifier-error' : undefined}
          {...register('identifier')}
        />
        {errors.identifier ? <p id="identifier-error" className="text-sm font-medium text-accent">{errors.identifier.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-sans text-sm font-semibold text-foreground" htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 py-2 font-sans text-base text-foreground shadow-sm transition-colors duration-150 hover:border-foreground/50 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password ? <p id="password-error" className="text-sm font-medium text-accent">{errors.password.message}</p> : null}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
        <input type="checkbox" className="size-5 accent-primary" {...register('rememberSession')} />
        Recordar sesión en este dispositivo
      </label>

      <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-md bg-primary px-4 py-3 font-sans text-base font-semibold text-background transition-colors duration-150 hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70">
        {isSubmitting ? 'Validando acceso…' : 'Continuar con código'}
      </button>

      <p className="text-center text-sm text-foreground/65">
        La recuperación de contraseña se habilitará cuando el backend publique el contrato administrativo definitivo.
      </p>
    </form>
  )
}

function ChallengeForm() {
  const { challenge, verify, cancelChallenge, isSubmitting } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CodeFields>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } })

  useEffect(() => {
    if (errors.root) errorSummaryRef.current?.focus()
  }, [errors.root])

  if (!challenge) return null

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await verify(code)
      navigate(safeReturnTo(searchParams.get('returnTo')), { replace: true })
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div>
        <p className="mb-3 font-sans text-sm font-semibold text-primary">Segundo paso de seguridad</p>
        <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-foreground">Revisá tu email</h1>
        <p className="mt-2 text-pretty font-sans text-base leading-relaxed text-foreground/70">{challenge.message}</p>
      </div>

      {errors.root ? (
        <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="rounded-md border border-accent bg-accent/10 px-4 py-3 text-sm font-medium text-foreground">
          {errors.root.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="font-sans text-sm font-semibold text-foreground" htmlFor="code">Código de verificación</label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={6}
          className="min-h-14 rounded-md border border-foreground/25 bg-background px-4 py-3 text-center font-sans text-2xl font-semibold tracking-[0.35em] text-foreground shadow-sm focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-invalid={Boolean(errors.code)}
          aria-describedby={errors.code ? 'code-error' : 'code-help'}
          {...register('code')}
        />
        <p id="code-help" className="text-sm text-foreground/65">El código vence a los 10 minutos.</p>
        {errors.code ? <p id="code-error" className="text-sm font-medium text-accent">{errors.code.message}</p> : null}
      </div>

      <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-md bg-primary px-4 py-3 font-sans text-base font-semibold text-background transition-colors duration-150 hover:bg-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70">
        {isSubmitting ? 'Verificando código…' : 'Ingresar a Administración'}
      </button>
      <button type="button" onClick={cancelChallenge} disabled={isSubmitting} className="min-h-11 rounded-md border border-foreground/25 px-4 py-3 font-sans text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Volver al inicio de sesión
      </button>
    </form>
  )
}

export function LoginPage() {
  const { status } = useAuth()
  const [searchParams] = useSearchParams()

  if (status === 'checking') {
    return <main className="flex min-h-dvh items-center justify-center bg-background" aria-live="polite">Verificando sesión…</main>
  }

  if (status === 'authenticated') {
    return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />
  }

  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[minmax(20rem,0.9fr)_minmax(32rem,1.1fr)]">
      <section className="flex min-h-64 flex-col justify-between gap-8 bg-primary px-6 py-8 text-background sm:px-10 lg:min-h-dvh lg:px-12 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md border border-background/40 font-sans text-lg font-bold" aria-hidden="true">G</span>
          <div>
            <p className="font-sans text-base font-semibold">GdeS Administración</p>
            <p className="font-sans text-sm text-background/80">Gestión operativa</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-balance font-sans text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">El trabajo diario, ordenado para decidir mejor.</p>
          <p className="mt-4 max-w-lg text-pretty font-sans text-base leading-relaxed text-background/85">Acceso exclusivo para responsables de administración y gerencia.</p>
        </div>
        <p className="font-sans text-sm text-background/75">Entorno de desarrollo con servicios mock</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">{status === 'challenge' ? <ChallengeForm /> : <LoginForm />}</div>
      </section>
    </main>
  )
}
