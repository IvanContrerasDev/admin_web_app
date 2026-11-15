import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './dashboard-page'

const getMetrics = vi.hoisted(() => vi.fn(async () => ({ pendingTimesheets: 1, incompleteRecords: 2, pendingReviewRecords: 3, recordsWithAbsence: 4, byProvince: [{ id: 'province', name: 'San Juan', pendingTimesheets: 1, incompleteRecords: 2, pendingReviewRecords: 3, recordsWithAbsence: 4 }] })))
vi.mock('../../services/services', () => ({ dashboardService: { getMetrics } }))
vi.mock('../auth/use-auth', () => ({ useAuth: () => ({ session: { user: { firstName: 'Ana' } } }) }))

describe('dashboard metric period and destination', () => {
  it('uses the selected month for the request and every global/provincial counter destination', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/?month=2024-02']}><DashboardPage /></MemoryRouter></QueryClientProvider>)
    await screen.findByRole('link', { name: /Planillas pendientes: 1/ })
    expect(getMetrics).toHaveBeenLastCalledWith({ month: 2, year: 2024 }, expect.any(AbortSignal))
    const targets = [
      ['Planillas pendientes', '/planillas', 'status=PENDING'],
      ['Registros incompletos', '/registros', 'status=INCOMPLETE'],
      ['Pendientes de validación', '/registros', 'reviewStatus=PENDING'],
      ['Registros con ausencia', '/registros', 'hasAbsence=true'],
    ]
    for (const [title, path, filter] of targets) {
      const links = screen.getAllByRole('link', { name: new RegExp(`${title}[:,]`) })
      expect(links).toHaveLength(1)
      for (const link of links) expect(link).toHaveAttribute('href', `${path}?month=2024-02&${filter}${path === "/registros" ? "&siteId=all" : ""}`)
    }
    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '2026-10' } })
    await waitFor(() => expect(getMetrics).toHaveBeenLastCalledWith({ month: 10, year: 2026 }, expect.any(AbortSignal)))
    await waitFor(() => expect(screen.getByRole('link', { name: /Planillas pendientes: 1/ })).toHaveAttribute('href', '/planillas?month=2026-10&status=PENDING'))
  })
})
