import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { userService } from '../../services/services'

const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00Z`)) : 'Sin informar'
}

export function UserDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmingStatus, setConfirmingStatus] = useState(false)
  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: ({ signal }) => userService.get(userId, signal), enabled: Boolean(userId) })
  const statusMutation = useMutation({
    mutationFn: () => userService.setAccountStatus(userId, userQuery.data?.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    onSuccess: async (user) => {
      queryClient.setQueryData(['user', userId], user)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmingStatus(false)
    },
  })

  if (userQuery.isPending) return <p aria-live="polite">Cargando empleado…</p>
  if (userQuery.isError || !userQuery.data) return <section className="rounded-lg border border-destructive/35 bg-background p-6" role="alert"><h1 className="text-2xl font-bold">No pudimos abrir este empleado</h1><p className="mt-2 text-foreground/65">Verificá el enlace o volvé al listado.</p><button className="mt-5 min-h-11 rounded-md border border-foreground/25 px-4 font-semibold" onClick={() => navigate('/usuarios')} type="button">Volver a empleados</button></section>

  const user = userQuery.data
  const active = user.accountStatus === 'ACTIVE'
  const details = [
    ['DNI', user.dni], ['CUIL', user.cuil ?? 'Sin informar'], ['Email', user.email], ['Teléfono', user.phone], ['Domicilio', user.address], ['Fecha de nacimiento', formatDate(user.birthDate)], ['Fecha de ingreso', formatDate(user.hireDate)], ['Puesto', user.position ?? 'Sin informar'], ['Provincia', user.site.name],
  ]

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Migas de pan"><Link className="font-semibold text-primary hover:underline" to="/usuarios">Empleados</Link><span className="px-2 text-foreground/40" aria-hidden="true">/</span><span aria-current="page">Detalle</span></nav>
      <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="font-semibold text-primary tabular-nums">Legajo {user.employeeId}</p><h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{user.firstName} {user.lastName}</h1><p className="mt-2 text-foreground/65">Cuenta {active ? 'activa' : 'inactiva'} · {user.site.name}</p></div>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-background hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={`/usuarios/${user.id}/editar`}>Editar datos</Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
        <section className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6" aria-labelledby="personal-data-heading">
          <h2 className="text-xl font-bold" id="personal-data-heading">Datos personales y laborales</h2>
          <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {details.map(([label, value]) => <div className="min-w-0 border-t border-foreground/10 pt-3" key={label}><dt className="text-sm text-foreground/60">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}
          </dl>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-foreground/15 bg-background p-5" aria-labelledby="related-heading"><h2 className="text-lg font-bold" id="related-heading">Información relacionada</h2><div className="mt-3 flex flex-col gap-2"><Link className="min-h-11 rounded-md border border-foreground/20 px-4 py-2.5 font-semibold hover:border-primary hover:text-primary" to={`/planillas?userId=${user.id}`}>Ver planillas</Link><Link className="min-h-11 rounded-md border border-foreground/20 px-4 py-2.5 font-semibold hover:border-primary hover:text-primary" to={`/legajos?userId=${user.id}`}>Ver legajo digital</Link></div></section>
          <section className="rounded-lg border border-foreground/15 bg-background p-5" aria-labelledby="access-heading"><h2 className="text-lg font-bold" id="access-heading">Acceso administrativo</h2><p className="mt-2 leading-relaxed text-foreground/65">{active ? 'Puede operar normalmente. La desactivación conserva toda su información histórica.' : 'No puede iniciar operaciones nuevas. Sus registros históricos siguen disponibles.'}</p>
            {!confirmingStatus ? <button className={`mt-4 min-h-11 w-full rounded-md border px-4 font-semibold ${active ? 'border-destructive text-destructive hover:bg-destructive/10' : 'border-secondary text-secondary hover:bg-secondary/10'}`} type="button" onClick={() => setConfirmingStatus(true)}>{active ? 'Desactivar cuenta' : 'Reactivar cuenta'}</button> : <div className="mt-4 rounded-md border border-destructive/35 p-4"><p className="font-semibold">¿Confirmás {active ? 'la desactivación' : 'la reactivación'}?</p><p className="mt-1 text-sm text-foreground/65">El cambio se aplicará de inmediato.</p><div className="mt-4 flex gap-2"><button className="min-h-11 flex-1 rounded-md border border-foreground/25 px-3 font-semibold" type="button" onClick={() => setConfirmingStatus(false)}>Cancelar</button><button className="min-h-11 flex-1 rounded-md bg-destructive px-3 font-semibold text-background disabled:opacity-60" disabled={statusMutation.isPending} type="button" onClick={() => statusMutation.mutate()}>{statusMutation.isPending ? 'Guardando…' : 'Confirmar'}</button></div></div>}
            {statusMutation.isError ? <p className="mt-3 text-sm font-semibold text-destructive" role="alert">No pudimos cambiar el estado. Volvé a intentarlo.</p> : null}
          </section>
        </aside>
      </div>
    </section>
  )
}
