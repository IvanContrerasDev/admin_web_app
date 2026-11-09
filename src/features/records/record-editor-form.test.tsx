import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError } from '../../services/service-error'
import type { RecordDetail } from '../../types/records'
import { RecordEditorForm } from './record-editor-form'

const service = vi.hoisted(() => ({ update: vi.fn(), getDetail: vi.fn() }))
vi.mock('../../services/services', () => ({ recordsService: service }))
const record: RecordDetail = {
  id: 'record', date: '2026-09-01', employee: { id: 'employee', firstName: 'Ana', lastName: 'Pérez', employeeId: '123' },
  workplace: { id: 'workplace', name: 'Oficina' }, client: { id: 'client', name: 'Cliente' }, site: { id: 'site', name: 'Provincia' },
  totalWorkMinutes: 480, recordStatus: 'COMPLETE', reviewStatus: 'NONE', origin: 'AUTOMATIC', hasAbsence: false, observations: null, version: 3,
  intervals: [{ id: 'interval', type: 'WORK', status: 'CLOSED', startTime: '2026-09-01T12:00:00.000Z', endTime: '2026-09-01T20:00:00.000Z', absenceReason: null, observations: null, origin: 'AUTOMATIC', reviewStatus: 'NONE', attendanceEvents: [] }],
  createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T20:00:00.000Z',
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } })
  client.setQueryData(['records', 'monthly', { month: 9 }], { pages: ['old-first', 'old-second'] })
  client.setQueryData(['dashboard', 'metrics'], { pendingReviewRecords: 1 })
  const onSaved = vi.fn()
  render(<QueryClientProvider client={client}><RecordEditorForm record={record} initialDate={record.date} employees={[]} workplaces={[]} onSaved={onSaved} onCancel={vi.fn()} /></QueryClientProvider>)
  return { client, onSaved, user: userEvent.setup() }
}
beforeEach(() => vi.resetAllMocks())

describe('record editor concurrency', () => {
  it('uses the expected version and resets all monthly pages after saving, invalidating dashboard', async () => {
    service.update.mockResolvedValue({ ...record, observations: 'Nueva', version: 4, reviewStatus: 'MANUAL_LOADED' })
    const { client, user, onSaved } = setup()
    await user.type(screen.getByLabelText('Observaciones generales'), 'Nueva')
    await user.click(screen.getByRole('button', { name: 'Guardar corrección' }))
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1))
    expect(service.update).toHaveBeenCalledExactlyOnceWith('record', { expectedVersion: 3, observations: 'Nueva' })
    expect(client.getQueryData(['records', 'monthly', { month: 9 }])).toBeUndefined()
    expect(client.getQueryState(['dashboard', 'metrics'])?.isInvalidated).toBe(true)
  })

  it('preserves the draft on 409 until the user explicitly loads the current version', async () => {
    service.update.mockRejectedValue(new ServiceError({ code: 'RECORD_VERSION_CONFLICT', status: 409, retryable: false, kind: 'api', message: 'Conflict' }))
    service.getDetail.mockResolvedValue({ ...record, observations: 'Cambio remoto', version: 4 })
    const { user, onSaved } = setup()
    await user.type(screen.getByLabelText('Observaciones generales'), 'Mi borrador')
    await user.click(screen.getByRole('button', { name: 'Guardar corrección' }))
    await screen.findByText(/Tu formulario conserva la versión 3/)
    expect(screen.getByLabelText('Observaciones generales')).toHaveValue('Mi borrador')
    expect(onSaved).not.toHaveBeenCalled()
    expect(service.update).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Descartar y cargar versión actual' }))
    expect(screen.getByLabelText('Observaciones generales')).toHaveValue('Cambio remoto')
  })
})
