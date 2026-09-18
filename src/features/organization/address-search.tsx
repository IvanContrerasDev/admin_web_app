import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { geocodingService } from '../../services/services'
import type { GeocodingResult } from '../../types/organization'

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(value), delay); return () => window.clearTimeout(timeout) }, [delay, value])
  return debounced
}

export function AddressSearch({ onSelect }: { onSelect: (result: GeocodingResult) => void }) {
  const [query, setQuery] = useState('')
  const [selectedLabel, setSelectedLabel] = useState('')
  const debounced = useDebouncedValue(query.trim(), 350)
  const resultsQuery = useQuery({ queryKey: ['geocoding', debounced], queryFn: ({ signal }) => geocodingService.searchAddress(debounced, { country: 'AR', signal }), enabled: debounced.length >= 3, staleTime: 5 * 60_000 })
  const results = resultsQuery.data ?? []
  const select = (result: GeocodingResult) => { setQuery(result.label); setSelectedLabel(result.label); onSelect(result) }
  return <div className="flex flex-col gap-2"><label className="flex flex-col gap-2 font-semibold" htmlFor="address-search">Buscar dirección<input className="min-h-11 rounded-md border border-foreground/25 bg-background px-3 font-normal placeholder:text-foreground/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" id="address-search" name="addressSearch" value={query} onChange={(event) => { setQuery(event.target.value); setSelectedLabel('') }} placeholder="Ej.: Plaza 25 de Mayo, San Juan…" autoComplete="off" /></label><div aria-live="polite">{resultsQuery.isFetching ? <p className="text-sm text-foreground/60">Buscando direcciones…</p> : null}{resultsQuery.isError ? <p className="rounded-md border border-destructive/35 p-3 text-sm font-semibold text-destructive" role="alert">{resultsQuery.error instanceof Error ? resultsQuery.error.message : 'No pudimos buscar direcciones.'}</p> : null}{debounced.length >= 3 && !resultsQuery.isFetching && !resultsQuery.isError && results.length === 0 ? <p className="text-sm text-foreground/60">No encontramos direcciones. Probá con más datos o ingresá las coordenadas.</p> : null}{results.length > 0 && query !== selectedLabel ? <ul className="overflow-hidden rounded-md border border-foreground/20 bg-background" aria-label="Direcciones encontradas">{results.map((result) => <li className="border-b border-foreground/10 last:border-b-0" key={result.id}><button className="min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary" type="button" onClick={() => select(result)}>{result.label}</button></li>)}</ul> : null}</div></div>
}
