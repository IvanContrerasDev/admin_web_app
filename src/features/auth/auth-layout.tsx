import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
  registration?: boolean
}

export function AuthLayout({ children, registration = false }: AuthLayoutProps) {
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
