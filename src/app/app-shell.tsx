import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/use-auth'

const navigation = [
  { label: 'Inicio', href: '/' },
  { label: 'Registros', href: '/registros' },
  { label: 'Usuarios', href: '/usuarios' },
  { label: 'Clientes', href: '/clientes' },
  { label: 'Lugares de trabajo', href: '/lugares' },
  { label: 'Planillas', href: '/planillas' },
  { label: 'Legajos', href: '/legajos' },
]

export function AppShell() {
  const { session, logout, isSubmitting } = useAuth()
  const fullName = session ? `${session.user.firstName} ${session.user.lastName}` : ''

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a className="skip-link" href="#main-content">Saltar al contenido principal</a>

      <aside className="border-b border-foreground/15 bg-foreground text-background lg:min-h-dvh lg:border-b-0 lg:border-r lg:border-background/15">
        <div className="flex items-center gap-3 px-5 py-5 lg:px-6 lg:py-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary font-sans text-sm font-bold text-background" aria-hidden="true">G</span>
          <div className="min-w-0">
            <p className="truncate font-sans text-base font-semibold">GdeS Administración</p>
            <p className="truncate font-sans text-sm text-background/65">Gestión operativa</p>
          </div>
        </div>
        <nav aria-label="Navegación principal" className="overflow-x-auto px-3 pb-4 lg:overflow-visible lg:px-4 lg:pb-6">
          <ul className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
            {navigation.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) => `flex min-h-11 items-center rounded-md px-3 py-2 font-sans text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isActive ? 'bg-primary text-background' : 'text-background/80 hover:bg-background/10 hover:text-background'}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-foreground/15 bg-background">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate font-sans text-sm font-semibold text-foreground">{fullName}</p>
              <p className="truncate font-sans text-sm text-foreground/60">{session?.user.role === 'SUPER_ADMIN' ? 'Superadministración' : 'Administración'} · Legajo {session?.user.employeeId}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={isSubmitting}
              className="min-h-11 shrink-0 rounded-md border border-foreground/25 px-4 py-2 font-sans text-sm font-semibold text-foreground transition-colors duration-150 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
