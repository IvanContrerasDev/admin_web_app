import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ServiceError } from '../../services/service-error'
import { organizationService } from '../../services/services'
import type { ClientListItem, CreateWorkplaceInput, SiteReference, WorkplaceDetail } from '../../types/organization'
import { AddressSearch } from './address-search'
import { fieldClass, labelClass } from './organization-ui'

const WorkplaceMap = lazy(() => import('./workplace-map').then((module) => ({ default: module.WorkplaceMap })))

interface FormContentProps { current?: WorkplaceDetail; clients: ClientListItem[]; sites: SiteReference[] }

function WorkplaceFormContent({ current, clients, sites }: FormContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const [latitude, setLatitude] = useState(current ? String(current.latitude) : '')
  const [longitude, setLongitude] = useState(current ? String(current.longitude) : '')
  const [radius, setRadius] = useState(current ? String(current.radiusMeters) : '100')
  const editing = Boolean(current)

  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn) }, [dirty])

  const mutation = useMutation({ mutationFn: (input: CreateWorkplaceInput) => current ? organizationService.updateWorkplace(current.id, input) : organizationService.createWorkplace(input), onSuccess: async (workplace) => { setDirty(false); queryClient.setQueryData(['workplace', workplace.id], workplace); await queryClient.invalidateQueries({ queryKey: ['workplaces'] }); navigate(`/lugares/${workplace.id}`, { replace: true }) }, onError: (caught) => { const code = caught instanceof ServiceError ? caught.code : ''; if (code === 'WORKPLACE_NAME_ALREADY_EXISTS') setError('Ya existe un lugar con ese nombre para el cliente y la provincia.'); else if (code === 'CLIENT_INACTIVE') setError('El cliente está inactivo y no admite nuevas asignaciones.'); else setError(caught instanceof Error ? caught.message : 'No pudimos guardar el lugar.') } })

  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)
  const location = latitude !== '' && longitude !== '' && Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude) && parsedLatitude >= -90 && parsedLatitude <= 90 && parsedLongitude >= -180 && parsedLongitude <= 180 ? { latitude: parsedLatitude, longitude: parsedLongitude } : null
  const radiusMeters = Number(radius)
  const availableClients = clients.filter((client) => client.status === 'ACTIVE' || client.id === current?.client.id)
  const setLocation = (next: { latitude: number; longitude: number }) => { setLatitude(next.latitude.toFixed(6)); setLongitude(next.longitude.toFixed(6)); setDirty(true) }
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setError(''); const data = new FormData(event.currentTarget); if (!location) { setError('Elegí una dirección o ingresá coordenadas válidas.'); return } const accuracy = String(data.get('gpsAccuracyThreshold') ?? '').trim(); mutation.mutate({ clientId: String(data.get('clientId') ?? ''), siteId: String(data.get('siteId') ?? ''), name: String(data.get('name') ?? '').trim(), latitude: location.latitude, longitude: location.longitude, radiusMeters, gpsAccuracyThreshold: accuracy ? Number(accuracy) : null }) }

  return <form className="flex flex-col gap-8" onChange={() => setDirty(true)} onSubmit={submit}><fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Asignación</legend><div className="grid gap-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Nombre<input className={fieldClass} defaultValue={current?.name} maxLength={120} name="name" required autoComplete="organization" /></label><label className={labelClass}>Cliente<select className={fieldClass} defaultValue={current?.client.id ?? ''} name="clientId" required><option disabled value="">Seleccioná un cliente</option>{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.status === 'INACTIVE' ? ' (inactivo)' : ''}</option>)}</select></label><label className={labelClass}>Provincia<select className={fieldClass} defaultValue={current?.site.id ?? ''} name="siteId" required><option disabled value="">Seleccioná una provincia</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label></div></fieldset><fieldset className="rounded-lg border border-foreground/15 bg-background p-5 sm:p-6"><legend className="px-2 text-lg font-bold">Zona permitida</legend><div className="flex flex-col gap-6"><AddressSearch onSelect={(result) => setLocation({ latitude: result.latitude, longitude: result.longitude })} /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><label className={labelClass}>Latitud<input className={fieldClass} inputMode="decimal" max={90} min={-90} name="latitude" required step="any" type="number" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label><label className={labelClass}>Longitud<input className={fieldClass} inputMode="decimal" max={180} min={-180} name="longitude" required step="any" type="number" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label><label className={labelClass}>Radio en metros<input className={fieldClass} inputMode="numeric" max={10000} min={10} name="radiusMeters" required step={1} type="number" value={radius} onChange={(event) => setRadius(event.target.value)} /></label><label className={labelClass}>Precisión GPS <span className="text-sm font-normal text-foreground/55">Opcional, en metros</span><input className={fieldClass} defaultValue={current?.gpsAccuracyThreshold ?? ''} inputMode="numeric" max={1000} min={1} name="gpsAccuracyThreshold" step={1} type="number" /></label></div>{location ? <Suspense fallback={<p className="rounded-lg border border-foreground/15 p-6 text-foreground/65">Cargando mapa…</p>}><WorkplaceMap location={location} radiusMeters={Number.isFinite(radiusMeters) && radiusMeters >= 10 ? radiusMeters : 10} onLocationChange={setLocation} /></Suspense> : <div className="rounded-lg border border-foreground/15 bg-muted p-8 text-center"><h2 className="text-lg font-bold">Definí el centro de la zona</h2><p className="mt-2 text-foreground/65">Elegí una dirección o completá latitud y longitud para cargar el mapa.</p></div>}</div></fieldset>{error ? <p className="rounded-md border border-destructive/35 p-4 font-semibold text-destructive" role="alert">{error}</p> : null}<div className="flex flex-col-reverse gap-3 border-t border-foreground/15 pt-6 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-foreground/25 px-5 font-semibold hover:border-primary" to={current ? `/lugares/${current.id}` : '/lugares'}>Cancelar</Link><button className="min-h-11 rounded-md bg-primary px-6 font-semibold text-background hover:bg-primary/90 disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear lugar'}</button></div></form>
}

export function WorkplaceFormPage() {
  const { workplaceId } = useParams()
  const editing = Boolean(workplaceId)
  const clientsQuery = useQuery({ queryKey: ['clients', 'options'], queryFn: ({ signal }) => organizationService.listClients({ pageSize: 100 }, signal) })
  const sitesQuery = useQuery({ queryKey: ['sites'], queryFn: ({ signal }) => organizationService.listSites(signal) })
  const workplaceQuery = useQuery({ queryKey: ['workplace', workplaceId], queryFn: ({ signal }) => organizationService.getWorkplace(workplaceId!, signal), enabled: editing })
  if (clientsQuery.isPending || sitesQuery.isPending || editing && workplaceQuery.isPending) return <p aria-live="polite">Cargando formulario…</p>
  if (clientsQuery.isError || sitesQuery.isError || editing && (workplaceQuery.isError || !workplaceQuery.data)) return <section role="alert"><h1 className="text-2xl font-bold">No pudimos preparar el formulario</h1><Link className="mt-4 inline-flex text-primary hover:underline" to="/lugares">Volver a lugares</Link></section>
  return <section className="mx-auto flex max-w-5xl flex-col gap-6"><nav aria-label="Migas de pan"><Link className="font-semibold text-primary hover:underline" to={workplaceQuery.data ? `/lugares/${workplaceQuery.data.id}` : '/lugares'}>Lugares de trabajo</Link><span className="px-2 text-foreground/40" aria-hidden="true">/</span><span aria-current="page">{editing ? 'Editar' : 'Nuevo'}</span></nav><header className="border-b border-foreground/15 pb-6"><h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{editing ? `Editar ${workplaceQuery.data?.name}` : 'Agregar lugar de trabajo'}</h1><p className="mt-2 text-pretty leading-relaxed text-foreground/65">Definí la organización, provincia y zona circular. El nombre de la dirección sirve para buscar, pero no se guarda.</p></header><WorkplaceFormContent key={workplaceQuery.data?.id ?? 'new'} current={workplaceQuery.data} clients={clientsQuery.data?.data ?? []} sites={sitesQuery.data ?? []} /></section>
}
