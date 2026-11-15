import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DashboardMetricCard } from './dashboard-metric-card'

const provinces = ['San Juan', 'Mendoza'].map((name, index) => ({ id: String(index), name, pendingTimesheets: index, incompleteRecords: index, pendingReviewRecords: index, recordsWithAbsence: index }))

describe('metric navigation', () => {
  it.each([
    ['pendingTimesheets', '/planillas?month=2024-02&status=PENDING'],
    ['incompleteRecords', '/registros?month=2024-02&status=INCOMPLETE'],
    ['pendingReviewRecords', '/registros?month=2024-02&reviewStatus=PENDING'],
    ['recordsWithAbsence', '/registros?month=2024-02&hasAbsence=true'],
  ] as const)('opens the global view for every %s counter and province', (metric, href) => {
    const { container } = render(<MemoryRouter><DashboardMetricCard title="Contador" description="Mes" value={5} href={href} metric={metric} provinces={provinces} /></MemoryRouter>)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', href)
    for (const province of provinces) {
      expect(within(link).getByText(province.name)).toBeInTheDocument()
    }
    expect(container.querySelector('a a')).toBeNull()
  })
})
