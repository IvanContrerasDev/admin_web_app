import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section aria-labelledby="not-found-title" className="max-w-2xl">
      <p className="font-sans text-sm font-semibold text-destructive">Ruta no encontrada</p>
      <h1 id="not-found-title" className="mt-2 text-balance font-sans text-3xl font-semibold">
        Esta sección no está disponible
      </h1>
      <p className="mt-4 font-sans text-base leading-relaxed text-foreground/70">
        Revisá la dirección o volvé a la base técnica para continuar.
      </p>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-sans text-sm font-semibold text-background transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to="/">
        Volver al inicio
      </Link>
    </section>
  )
}
