import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SiteReference } from '../../types/users'

// `all` exists only in the URL. Services receive undefined for a global scope.
export function useProvinceSelection(catalog: { data?: SiteReference[]; isPending: boolean; isError: boolean }, allowAll = false) {
  const [params, setParams] = useSearchParams()
  const requested = params.get('siteId')
  const all = allowAll && requested === 'all'
  const sites = catalog.data ?? []
  const selected = all ? undefined : requested
    ? sites.find((site) => site.id === requested)
    : sites.find((site) => site.name.trim().toLocaleLowerCase('es-AR') === 'san juan')
  const ready = all || (!catalog.isPending && !catalog.isError && Boolean(selected))
  const error = all || catalog.isPending ? undefined : catalog.isError
    ? 'No pudimos cargar las provincias. Reintentá la carga.'
    : requested && !selected
      ? 'La provincia del enlace no está disponible. Seleccioná una provincia habilitada.'
      : !selected ? 'San Juan no está disponible en el catálogo de provincias. Seleccioná una provincia habilitada o reintentá la carga.' : undefined

  useEffect(() => {
    if (requested || !selected || !ready) return
    const next = new URLSearchParams(params)
    next.set('siteId', selected.id)
    setParams(next, { replace: true })
  }, [params, ready, requested, selected, setParams])

  return { siteId: selected?.id, value: all ? '' : selected?.id ?? '', ready, error }
}
