import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ServiceError } from '../../services/service-error'
import { organizationService } from '../../services/services'
import { fieldClass, labelClass } from './organization-ui'

export function ClientFormPage() {
  const { clientId } = useParams()
  const editing = Boolean(clientId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const query = useQuery({ queryKey: ['client', clientId], queryFn: ({ signal }) => organizationService.getClient(clientId!, signal), enabled: editing })

  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [dirty])

  const mutation = useMutation({
    mutationFn: (name: string) => editing ? organizationService.updateClient(clientId!, { name }) : organizationService.createClient({ name }),
    onSuccess: async (client) => { setDirty(false); queryClient.setQueryData(['client', client.id], client); await queryClient.invalidateQueries({ queryKey: ['clients'] }); navigate(`/clientes/${client.id}`, { replace: true }) },
    onError: (caught) => setError(caught instanceof ServiceError && caught.code === 'CLIENT_NAME_ALREADY_EXISTS' ? 'Ya existe un cliente con ese nombre.' : caught instanceof Error ? caught.message : 'No pudimos guardar el cliente.'),
  })

  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(''); const name = String(new FormData(event.currentTarget).get('name') ?? '').trim(); mutation.mutate(name) }
  if (editing && query.isPending) return <p aria-live="polite">Cargando cliente…</p>
  if (editing && (query.isError || !query.data)) return <div role="alert"><h1 className="text-2xl font-bold">No pudimos abrir este cliente</h1><Link className="mt-4 inline-flex text-primary hover:underline" to="/clientes">Volver a clientes</Link></div>
  const client = query.data

  return <section className="mx-auto flex max-w-3xl flex-col gap-6"><nav aria-label="Migas de pan"><Link className="font-semibold text-primary hover:underline" to={client ? `/clientes/${client.id}` : '/clientes'}>Clientes</Link><span className="px-2 text-foreground/40" aria-hidden="true">/</span><span aria-current="page">{editing ? 'Editar' : 'Nuevo'}</span></nav><header className="border-b border-foreground/15 pb-6"><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{editing ? `Editar ${client?.name}` : 'Agregar cliente'}</h1><p className="mt-2 text-pretty leading-relaxed text-foreground/65">{editing ? 'Actualizá el nombre. El estado se administra desde el detalle.' : 'Creá una organización activa para comenzar a asignar lugares de trabajo.'}</p></header><form className="flex flex-col gap-6" onChange={() => setDirty(true)} onSubmit={submit}><fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Datos del cliente</legend><label className={labelClass} htmlFor="client-name">Nombre<input className={fieldClass} defaultValue={client?.name} id="client-name" maxLength={120} name="name" required autoComplete="organization" /></label></fieldset>{error ? <p className="rounded-md border border-destructive/35 p-4 font-semibold text-destructive" role="alert">{error}</p> : null}<div className="flex flex-col-reverse gap-3 border-t border-foreground/15 pt-6 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary" to={client ? `/clientes/${client.id}` : '/clientes'}>Cancelar</Link><button className="min-h-11 rounded-md bg-primary px-6 font-semibold text-background hover:bg-primary/90 disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear cliente'}</button></div></form></section>
}
