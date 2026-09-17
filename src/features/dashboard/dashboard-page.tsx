import { Link } from 'react-router-dom'
import { useAuth } from '../auth/use-auth'

const primaryActions = [
  { title: 'Revisar registros', description: 'Consultá la matriz mensual y atendé pendientes.', href: '/registros' },
  { title: 'Gestionar usuarios', description: 'Accedé al equipo y sus datos administrativos.', href: '/usuarios' },
  { title: 'Ver planillas', description: 'Organizá las cargas mensuales por empleado y lugar.', href: '/planillas' },
]

export function DashboardPage() {
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-8">
      <section className="border-b border-foreground/15 pb-8">
        <p className="font-sans text-sm font-semibold text-primary">Inicio</p>
        <h1 className="mt-2 text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Buen día, {session?.user.firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty font-sans text-base leading-relaxed text-foreground/70">
          Elegí una sección para continuar con la gestión operativa.
        </p>
      </section>

      <section aria-labelledby="acciones-title" className="flex flex-col gap-4">
        <h2 id="acciones-title" className="text-balance font-sans text-xl font-semibold text-foreground">Accesos principales</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {primaryActions.map((action) => (
            <Link key={action.href} to={action.href} className="group flex min-h-40 flex-col justify-between gap-6 rounded-md border border-foreground/15 bg-background p-5 transition-colors duration-150 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <div>
                <h3 className="font-sans text-lg font-semibold text-foreground group-hover:text-primary">{action.title}</h3>
                <p className="mt-2 text-pretty font-sans text-sm leading-relaxed text-foreground/65">{action.description}</p>
              </div>
              <span className="font-sans text-sm font-semibold text-primary">Abrir sección</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
