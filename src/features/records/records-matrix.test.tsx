import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { MonthlyRow } from '../../types/records'
import { RecordsMatrix } from './records-matrix'

const row: MonthlyRow = {
  employee: { id: 'employee-1', firstName: 'Ana', lastName: 'Pérez', employeeId: '123' },
  workplace: { id: 'workplace-1', name: 'Oficina' },
  client: { id: 'client-1', name: 'Cliente' },
  site: { id: 'site-1', name: 'San Juan' },
  days: [
    { date: '2026-09-01', state: 'PRESENT', matchesFilters: true, record: {
      id: 'record-1', totalWorkMinutes: 480, recordStatus: 'COMPLETE', reviewStatus: 'NONE', origin: 'AUTOMATIC', hasAbsence: false, intervalCount: 1,
    } },
    { date: '2026-09-02', state: 'EMPTY' },
  ],
  totals: { monthWorkMinutes: 480, matchingWorkMinutes: 480 },
}

function setup() {
  const onRecordOpen = vi.fn()
  const onEmptyCreate = vi.fn()
  render(<RecordsMatrix rows={[row]} dates={row.days.map((day) => day.date)} totalItems={1} hasNextPage={false} isFetchingNextPage={false} onEndReached={vi.fn()} onRecordOpen={onRecordOpen} onEmptyCreate={onEmptyCreate} />)
  return {
    user: userEvent.setup(), onRecordOpen, onEmptyCreate,
    recordCell: screen.getByRole('button', { name: /2026-09-01/ }),
    emptyCell: screen.getByRole('button', { name: /2026-09-02/ }),
  }
}

describe('RecordsMatrix cell selection', () => {
  it('keeps a single-clicked cell marked after focus and hover move away, without opening a dialog', async () => {
    const { user, recordCell, onRecordOpen, onEmptyCreate } = setup()
    await user.click(recordCell)
    await user.unhover(recordCell)
    await user.tab()
    expect(recordCell).toHaveAttribute('aria-pressed', 'true')
    expect(recordCell).toHaveClass('bg-primary/15', 'outline-primary')
    expect(onRecordOpen).not.toHaveBeenCalled()
    expect(onEmptyCreate).not.toHaveBeenCalled()
  })

  it('moves selection to the next clicked cell, including empty cells', async () => {
    const { user, recordCell, emptyCell, onEmptyCreate } = setup()
    await user.click(recordCell)
    await user.click(emptyCell)
    expect(recordCell).toHaveAttribute('aria-pressed', 'false')
    expect(recordCell).not.toHaveClass('bg-primary/15')
    expect(emptyCell).toHaveAttribute('aria-pressed', 'true')
    expect(emptyCell).toHaveClass('bg-primary/15', 'outline-primary')
    expect(onEmptyCreate).not.toHaveBeenCalled()
  })

  it('opens existing record details only on double click and keeps the cell selected', async () => {
    const { user, recordCell, onRecordOpen } = setup()
    await user.dblClick(recordCell)
    expect(onRecordOpen).toHaveBeenCalledExactlyOnceWith('record-1')
    expect(recordCell).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens manual creation on double click of an empty cell', async () => {
    const { user, emptyCell, onEmptyCreate } = setup()
    await user.dblClick(emptyCell)
    expect(onEmptyCreate).toHaveBeenCalledExactlyOnceWith('employee-1', 'workplace-1', '2026-09-02')
    expect(emptyCell).toHaveAttribute('aria-pressed', 'true')
  })

  it.each(['{Enter}', ' '])('preserves keyboard access to record details with %s', async (key) => {
    const { user, recordCell, onRecordOpen } = setup()
    await user.click(recordCell)
    await user.keyboard(key)
    expect(onRecordOpen).toHaveBeenCalledExactlyOnceWith('record-1')
  })

  it('preserves keyboard access to manual creation', async () => {
    const { user, emptyCell, onEmptyCreate } = setup()
    await user.click(emptyCell)
    await user.keyboard('{Enter}')
    expect(onEmptyCreate).toHaveBeenCalledExactlyOnceWith('employee-1', 'workplace-1', '2026-09-02')
  })
})
