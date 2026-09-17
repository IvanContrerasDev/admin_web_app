import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) && error.status === 404
    ? 'La ruta solicitada no existe.'
    : 'No se pudo mostrar esta sección. Volvé al inicio e intentá nuevamente.'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <section aria-labelledby="route-error-title" className="w-full max-w-xl rounded-lg border border-destructive/40 p-6">
        <p className="font-sans text-sm font-semibold text-destructive">Error de navegación</p>
        <h1 id="route-error-title" className="mt-2 text-balance font-sans text-2xl font-semibold">No pudimos abrir esta página</h1>
        <p className="mt-3 font-sans text-base leading-relaxed text-foreground/70">{message}</p>
        <Link className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-sans text-sm font-semibold text-background transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
