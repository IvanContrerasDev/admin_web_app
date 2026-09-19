import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { documentsService, organizationService, userService } from '../../services/services'
import type { DocumentListQuery } from '../../types/documents'

export function useDocumentList(query: DocumentListQuery) {
  return useQuery({
    queryKey: ['documents', query],
    queryFn: ({ signal }) => documentsService.list(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useDocumentOptions() {
  const workplaces = useQuery({
    queryKey: ['workplaces', 'documents-options'],
    queryFn: ({ signal }) => organizationService.listWorkplaces({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })
  const employees = useQuery({
    queryKey: ['users', 'documents-options'],
    queryFn: ({ signal }) => userService.list({ pageSize: 100 }, signal),
    staleTime: 5 * 60 * 1000,
  })

  return { workplaces, employees }
}
