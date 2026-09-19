import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { organizationService, recordsService, userService } from '../../services/services'
import type { MonthlyQuery } from '../../types/records'

interface PageParameter {
  page: number
  snapshotToken?: string
}

export function useMonthlyRecords(filters: Omit<MonthlyQuery, 'page' | 'pageSize' | 'snapshotToken'>, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['records', 'monthly', filters],
    queryFn: ({ pageParam, signal }) => recordsService.listMonthly({
      ...filters,
      page: pageParam.page,
      pageSize: 50,
      snapshotToken: pageParam.snapshotToken,
    }, signal),
    initialPageParam: { page: 1 } as PageParameter,
    getNextPageParam: (lastPage, allPages): PageParameter | undefined => {
      if (lastPage.pagination.page >= lastPage.pagination.totalPages) return undefined
      return {
        page: lastPage.pagination.page + 1,
        snapshotToken: allPages[0]?.meta.snapshotToken,
      }
    },
    enabled,
  })
}

export function useRecordsFilterOptions() {
  const sites = useQuery({
    queryKey: ['sites'],
    queryFn: ({ signal }) => organizationService.listSites(signal),
    staleTime: 15 * 60 * 1000,
  })
  const clients = useQuery({
    queryKey: ['clients', 'records-options'],
    queryFn: ({ signal }) => organizationService.listClients({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })
  const workplaces = useQuery({
    queryKey: ['workplaces', 'records-options'],
    queryFn: ({ signal }) => organizationService.listWorkplaces({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })
  const employees = useQuery({
    queryKey: ['users', 'records-options'],
    queryFn: ({ signal }) => userService.list({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })

  return { sites, clients, workplaces, employees }
}
