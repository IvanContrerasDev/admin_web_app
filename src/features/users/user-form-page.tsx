import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { userService } from '../../services/services'
import { LoadingSkeleton } from '../../app/loading-skeleton'
import { UserForm } from './user-form'

export function UserFormPage() {
  const { userId } = useParams()
  const editing = Boolean(userId)
  const sitesQuery = useQuery({ queryKey: ['sites'], queryFn: ({ signal }) => userService.listSites(signal) })
  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: ({ signal }) => userService.get(userId!, signal), enabled: editing })

  if (sitesQuery.isPending || editing && userQuery.isPending) return <LoadingSkeleton label="Cargando formulario…" variant="form" />
  if (sitesQuery.isError || editing && (userQuery.isError || !userQuery.data)) return <div className="rounded-lg border border-destructive/35 bg-background p-6" role="alert"><h1 className="text-2xl font-bold">No pudimos preparar el formulario</h1><p className="mt-2 text-foreground/65">Volvé al listado e intentá nuevamente.</p></div>

  const current = editing ? userQuery.data : undefined
  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <nav aria-label="Migas de pan"><Link className="font-semibold text-primary hover:underline" to={current ? `/usuarios/${current.id}` : '/usuarios'}>Empleados</Link><span className="px-2 text-foreground/40" aria-hidden="true">/</span><span aria-current="page">{editing ? 'Editar' : 'Nuevo'}</span></nav>
      <header className="border-b border-foreground/15 pb-6"><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{editing ? `Editar a ${current?.firstName} ${current?.lastName}` : 'Agregar empleado'}</h1><p className="mt-2 text-pretty leading-relaxed text-foreground/65">{editing ? 'Actualizá los datos personales y laborales. El estado de acceso se administra desde el detalle.' : 'Ingresá los datos requeridos para crear una cuenta activa.'}</p></header>
      <UserForm key={current?.id ?? 'new'} current={current} sites={sitesQuery.data ?? []} />
    </section>
  )
}
