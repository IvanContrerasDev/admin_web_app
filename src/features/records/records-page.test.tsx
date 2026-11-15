import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMonthlyRecords } from './use-monthly-records'
import { RecordsPage } from './records-page'

const catalog = vi.hoisted(() => ({ data: [{ id: 'sj', name: 'San Juan' }, { id: 'mz', name: 'Mendoza' }], isPending: false, isError: false, refetch: vi.fn() }))
vi.mock('./use-monthly-records', () => {
  const option = { isPending: false, isError: false, data: { data: [] } }
  return {
    useRecordsFilterOptions: () => ({ sites: catalog, clients: option, employees: option, workplaces: option }),
    useMonthlyRecords: vi.fn(() => ({ isPending: false, isError: false, data: { pages: [] } })),
  }
})
function setup(url: string) {
  const router = createMemoryRouter([{ path: '/registros', element: <RecordsPage /> }], { initialEntries: [url] })
  const view = render(<RouterProvider router={router} />)
  return { router, ...view }
}
beforeEach(() => {
  catalog.data = [{ id: 'sj', name: 'San Juan' }, { id: 'mz', name: 'Mendoza' }]
  catalog.isPending = false
  catalog.isError = false
})

describe('monthly province selection', () => {
  it('defaults to catalogue San Juan with the requested period and condition', () => {
    const { router } = setup('/registros?month=2024-02&status=INCOMPLETE')
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ month: 2, year: 2024, status: 'INCOMPLETE', siteId: 'sj' }), true)
    expect(screen.getByLabelText('Provincia')).toHaveValue('sj')
    expect(router.state.location.search).toContain('siteId=sj')
    expect(within(screen.getByLabelText('Provincia')).getByRole('option', { name: 'Todas' })).toBeInTheDocument()
  })
  it('preserves a province explicitly selected by the user', () => {
    setup('/registros?month=2024-02&siteId=mz')
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ siteId: 'mz' }), true)
    expect(screen.getByLabelText('Provincia')).toHaveValue('mz')
  })
  it('persists explicit Todas through filters, history and reload without passing its sentinel to API', async () => {
    const { router, unmount } = setup('/registros?month=2026-11&siteId=sj')
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: '' } })
    expect(router.state.location.search).toContain('siteId=all')
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ siteId: undefined }), true)
    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '2026-10' } })
    fireEvent.change(screen.getByLabelText('Completitud'), { target: { value: 'INCOMPLETE' } })
    expect(router.state.location.search).toContain('siteId=all')
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]!)
    expect(router.state.location.search).toBe('?month=2026-10&siteId=all')
    await act(() => router.navigate(-1))
    expect(screen.getByLabelText('Provincia')).toHaveValue('')
    await act(() => router.navigate(1))
    const url = `/registros${router.state.location.search}`
    unmount()
    setup(url)
    expect(screen.getByLabelText('Provincia')).toHaveValue('')
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ month: 10, siteId: undefined }), true)
  })
  it('waits for default catalogue before starting the snapshot and preserves other filters', async () => {
    catalog.isPending = true
    catalog.data = []
    const { router } = setup('/registros?month=2026-11&status=INCOMPLETE&clientId=c')
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.anything(), false)
    catalog.isPending = false
    catalog.data = [{ id: 'sj', name: 'San Juan' }]
    await act(() => router.navigate('/registros?month=2026-11&status=INCOMPLETE&clientId=c'))
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ siteId: 'sj', status: 'INCOMPLETE', clientId: 'c' }), true)
  })
  it.each(['error', 'missing', 'invalid'])('blocks default/invalid selection on catalogue %s without global snapshot', (state) => {
    catalog.isError = state === 'error'
    if (state === 'missing') catalog.data = []
    setup(`/registros?month=2026-11${state === 'invalid' ? '&siteId=invalid' : ''}`)
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.anything(), false)
    expect(screen.getByRole('alert')).toHaveTextContent(/provincia|San Juan/)
  })
})
