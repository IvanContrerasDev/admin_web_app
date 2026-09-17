const capabilities = [
  ['Servicios intercambiables', 'Mock determinista y transporte HTTP comparten el mismo contrato interno.'],
  ['Tiempo consistente', 'Las fechas se interpretan en UTC y se muestran en hora de Argentina.'],
  ['Archivos protegidos', 'Los lotes se validan de forma atómica antes de iniciar una carga.'],
] as const

export function FoundationPage() {
  return (
    <section aria-labelledby="foundation-title" className="flex flex-col gap-8">
      <div className="max-w-3xl">
        <p className="font-sans text-sm font-semibold text-primary">Infraestructura inicial</p>
        <h1 id="foundation-title" className="mt-2 text-balance font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
          Base técnica lista para construir los módulos administrativos
        </h1>
        <p className="mt-4 max-w-2xl text-pretty font-sans text-base leading-relaxed text-foreground/70">
          El proyecto ya cuenta con navegación, consultas, servicios mock-first y validaciones transversales. Los módulos de negocio se incorporarán según el orden aprobado.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-foreground/15 bg-background">
        <div className="border-b border-foreground/15 bg-primary px-5 py-4 text-background sm:px-6">
          <h2 className="text-balance font-sans text-lg font-semibold">Controles incorporados</h2>
        </div>
        <dl className="divide-y divide-foreground/15">
          {capabilities.map(([term, description]) => (
            <div key={term} className="grid gap-1 px-5 py-5 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-6 sm:px-6">
              <dt className="font-sans text-sm font-semibold">{term}</dt>
              <dd className="font-sans text-sm leading-relaxed text-foreground/70">{description}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="border-l-4 border-success pl-4 font-sans text-sm leading-relaxed text-foreground/75">
        Esta pantalla confirma el scaffold. No representa datos reales ni anticipa funcionalidades pendientes.
      </p>
    </section>
  )
}
