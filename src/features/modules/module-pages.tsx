interface ModulePageProps {
  title: string
  description: string
}

function ModulePage({ title, description }: ModulePageProps) {
  return (
    <section className="flex max-w-3xl flex-col gap-4">
      <p className="font-sans text-sm font-semibold text-primary">Módulo administrativo</p>
      <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="text-pretty font-sans text-base leading-relaxed text-foreground/70">{description}</p>
      <div className="mt-3 rounded-md border border-secondary/40 bg-secondary/10 px-5 py-4 text-sm leading-relaxed text-foreground">
        La navegación ya está disponible. Las operaciones de esta sección se incorporarán en su feature correspondiente.
      </div>
    </section>
  )
}

export function UsersPage() {
  return <ModulePage title="Usuarios" description="Gestión de empleados y consulta de su información administrativa." />
}

export function WorkplacesPage() {
  return <ModulePage title="Lugares de trabajo" description="Clientes, provincias y ubicaciones operativas." />
}

export function TimesheetsPage() {
  return <ModulePage title="Planillas" description="Carga, consulta y seguimiento de planillas mensuales." />
}

export function DocumentsPage() {
  return <ModulePage title="Legajos" description="Documentación digital organizada por empleado." />
}
