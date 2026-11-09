import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { useMonthlyRecords } from './use-monthly-records'
import { RecordsPage } from './records-page'

vi.mock('./use-monthly-records', () => {
  const option = { isPending: false, isError: false, data: { data: [] } }
  return {
    useRecordsFilterOptions: () => ({ sites: { ...option, data: [{ id: 'sj', name: 'San Juan' }] }, clients: option, employees: option, workplaces: option }),
    useMonthlyRecords: vi.fn(() => ({ isPending: false, isError: false, data: { pages: [] } })),
  }
})

describe('global monthly entry', () => {
  it('queries all provinces with the requested period and condition', () => {
    render(<MemoryRouter initialEntries={['/registros?month=2024-02&status=INCOMPLETE']}><RecordsPage /></MemoryRouter>)
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ month: 2, year: 2024, status: 'INCOMPLETE', siteId: undefined }), true)
    expect(screen.getByLabelText('Provincia')).toHaveValue('')
    expect(within(screen.getByLabelText('Provincia')).getByRole('option', { name: 'Todas' })).toBeInTheDocument()
  })
  it('preserves a province explicitly selected by the user', () => {
    render(<MemoryRouter initialEntries={['/registros?month=2024-02&siteId=sj']}><RecordsPage /></MemoryRouter>)
    expect(useMonthlyRecords).toHaveBeenLastCalledWith(expect.objectContaining({ month: 2, year: 2024, siteId: 'sj' }), true)
    expect(screen.getByLabelText('Provincia')).toHaveValue('sj')
  })
})
