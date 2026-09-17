import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <header className="border-b border-foreground/15 bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary font-sans text-sm font-bold text-background" aria-hidden="true">
              G
            </span>
            <div className="min-w-0">
              <p className="truncate font-sans text-base font-semibold">GdeS Administración</p>
              <p className="truncate font-sans text-sm text-foreground/65">Gestión operativa</p>
            </div>
          </div>
          <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 font-sans text-sm font-medium text-foreground">
            Entorno mock
          </span>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Outlet />
      </main>
    </div>
  )
}
