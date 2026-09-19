import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { organizationService, timesheetsService, userService } from '../../services/services'
import type { TimesheetListQuery } from '../../types/timesheets'

export function useTimesheetList(query: TimesheetListQuery) {
  return useQuery({
    queryKey: ['timesheets', query],
    queryFn: ({ signal }) => timesheetsService.list(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useTimesheetOptions() {
  const sites = useQuery({
    queryKey: ['sites'],
    queryFn: ({ signal }) => organizationService.listSites(signal),
    staleTime: 15 * 60 * 1000,
  })
  const clients = useQuery({
    queryKey: ['clients', 'timesheets-options'],
    queryFn: ({ signal }) => organizationService.listClients({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })
  const workplaces = useQuery({
    queryKey: ['workplaces', 'timesheets-options'],
    queryFn: ({ signal }) => organizationService.listWorkplaces({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })
  const employees = useQuery({
    queryKey: ['users', 'timesheets-options'],
    queryFn: ({ signal }) => userService.list({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })

  return { sites, clients, workplaces, employees }
}

const monthFormatter = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export function formatPeriod(month: number, year: number) {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MiB`
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('es-AR')} KiB`
}
