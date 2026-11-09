import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError } from '../../services/service-error'
import { useAttendanceEventDetails, useMonthlyRecords } from './use-monthly-records'

const service = vi.hoisted(() => ({ listMonthly: vi.fn(), getAttendanceEventDetail: vi.fn() }))
vi.mock('../../services/services', () => ({ recordsService: service }))

function response(page: number, snapshotToken: string) {
  return { data: [], pagination: { page, totalPages: 2, totalItems: 2, pageSize: 50 }, meta: { snapshotToken } }
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: 2, retryDelay: 1, gcTime: 0 } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, wrapper }
}
beforeEach(() => vi.resetAllMocks())

describe('monthly snapshot lifecycle', () => {
  it('uses one snapshot across pages and resets from page one without mixing them', async () => {
    service.listMonthly.mockResolvedValueOnce(response(1, 'old')).mockResolvedValueOnce(response(2, 'old')).mockResolvedValueOnce(response(1, 'new'))
    const { wrapper } = setup()
    const { result } = renderHook(() => useMonthlyRecords({ month: 2, year: 2024 }, true), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => { await result.current.fetchNextPage() })
    expect(service.listMonthly.mock.calls[1]?.[0]).toEqual({ month: 2, year: 2024, page: 2, pageSize: 50, snapshotToken: 'old' })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    await act(async () => { await result.current.restart() })
    expect(service.listMonthly.mock.calls[2]?.[0]).toEqual({ month: 2, year: 2024, page: 1, pageSize: 50, snapshotToken: undefined })
    await waitFor(() => expect(result.current.data?.pages).toEqual([response(1, 'new')]))
  })

  it('does not retry an expired snapshot and restarts page one on request', async () => {
    const expired = new ServiceError({ code: 'MONTHLY_SNAPSHOT_EXPIRED', status: 410, kind: 'api', retryable: false, message: 'Expired' })
    service.listMonthly.mockResolvedValueOnce(response(1, 'old')).mockRejectedValue(expired)
    const { wrapper } = setup()
    const { result } = renderHook(() => useMonthlyRecords({ month: 9, year: 2026 }, true), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => { await result.current.fetchNextPage() })
    expect(service.listMonthly).toHaveBeenCalledTimes(2)
    await waitFor(() => expect(result.current.error).toBe(expired))
    service.listMonthly.mockResolvedValueOnce(response(1, 'fresh'))
    await act(async () => { await result.current.restart() })
    await waitFor(() => expect(result.current.data?.pages).toEqual([response(1, 'fresh')]))
  })

  it('changes filters by starting a separate page-one snapshot', async () => {
    service.listMonthly.mockImplementation(({ month }) => Promise.resolve(response(1, String(month))))
    const { wrapper } = setup()
    const { result, rerender } = renderHook(({ month }) => useMonthlyRecords({ month, year: 2026 }, true), { wrapper, initialProps: { month: 9 } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ month: 10 })
    await waitFor(() => expect(result.current.data?.pages[0]?.meta.snapshotToken).toBe('10'))
    expect(service.listMonthly.mock.lastCall?.[0]).toMatchObject({ month: 10, page: 1, snapshotToken: undefined })
    expect(result.current.data?.pages).toHaveLength(1)
  })
})

describe('event metadata loading', () => {
  it('fetches event metadata only after the detail request is enabled', async () => {
    service.getAttendanceEventDetail.mockResolvedValue({ id: 'event' })
    const { wrapper } = setup()
    const { result, rerender } = renderHook(({ enabled }) => useAttendanceEventDetails(['event'], enabled), { wrapper, initialProps: { enabled: false } })
    expect(service.getAttendanceEventDetail).not.toHaveBeenCalled()
    rerender({ enabled: true })
    await waitFor(() => expect(result.current[0]?.isSuccess).toBe(true))
    expect(service.getAttendanceEventDetail).toHaveBeenCalledTimes(1)
  })
})
