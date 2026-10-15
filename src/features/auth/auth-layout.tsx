import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  registration?: boolean
}

export function AuthLayout({ children, registration = false }: AuthLayoutProps) {
  if (!registration) {
    return (
      <main id="main-content" className="flex min-h-dvh flex-col overflow-x-hidden bg-background text-foreground lg:h-dvh lg:flex-row">
        <section
          aria-label="GdeS Grupo de Servicios — Administración"
          className="relative isolate flex h-72 shrink-0 flex-col justify-between overflow-hidden bg-primary px-6 py-6 text-surface sm:h-80 sm:px-10 sm:py-8 lg:h-full lg:w-1/2 lg:px-12 lg:py-12 xl:px-16"
        >
          <img
            src="/images/login-operario.png"
            alt=""
            width={768}
            height={1376}
            fetchPriority="high"
            className="absolute inset-0 -z-20 size-full object-cover object-[75%_22%] lg:object-[72%_center]"
          />
          <div aria-hidden="true" className="auth-hero-overlay absolute inset-0 -z-10" />

          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src="/images/gdes-logo-marca-agua.png"
              alt="GdeS Grupo de Servicios"
              width={1049}
              height={979}
              className="h-12 w-auto opacity-100 sm:h-14"
            />
            <div className="h-12 w-px bg-surface/40 sm:h-14" aria-hidden="true" />
            <p className="flex flex-col font-sans text-sm leading-snug">
              <span className="font-semibold">GdeS Grupo de Servicios</span>
              <span className="font-medium text-surface/85">Administración</span>
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:gap-0">
            <p className="max-w-md text-balance font-sans text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:mb-auto lg:max-w-lg lg:text-4xl xl:text-5xl">
              Servicios Estratégicos de Limpieza y Mantenimiento.
            </p>
          </div>
        </section>
        <section aria-label="Ingreso a Administración" className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 sm:py-14 lg:h-full lg:w-1/2 lg:overflow-y-auto lg:px-16 lg:py-12">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="grid min-h-dvh bg-background lg:grid-cols-[minmax(20rem,0.9fr)_minmax(32rem,1.1fr)]">
      <section className="flex min-h-64 flex-col justify-between gap-8 bg-primary px-6 py-8 text-background sm:px-10 lg:min-h-dvh lg:px-12 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-md border border-background/40 font-sans text-lg font-bold" aria-hidden="true">G</span>
          <div>
            <p className="font-sans text-base font-semibold">GdeS Administración</p>
            <p className="font-sans text-sm text-background/80">Gestión operativa</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-balance font-sans text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {registration ? 'Tu próximo paso en la gestión del equipo.' : 'El trabajo diario, ordenado para decidir mejor.'}
          </p>
          <p className="mt-4 max-w-lg text-pretty font-sans text-base leading-relaxed text-background/85">
            {registration ? 'El acceso administrativo requiere la aprobación del SuperAdmin. Registrarte no habilita el ingreso inmediato.' : 'Acceso exclusivo para responsables de administración y gerencia.'}
          </p>
        </div>
        <p className="font-sans text-sm text-background/75">Entorno de desarrollo con servicios mock</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className={`w-full ${registration ? 'max-w-xl' : 'max-w-md'}`}>{children}</div>
      </section>
    </main>
  )
}
