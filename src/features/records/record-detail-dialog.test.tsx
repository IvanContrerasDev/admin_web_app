import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceError } from '../../services/service-error'
import type { RecordDetail } from '../../types/records'
import { RecordDetailDialog } from './record-detail-dialog'

const service = vi.hoisted(() => ({ getDetail: vi.fn(), approve: vi.fn(), getAttendanceEventDetail: vi.fn() }))
vi.mock('../../services/services', () => ({ recordsService: service }))
vi.mock('./use-monthly-records', async (importOriginal) => ({
  ...await importOriginal<typeof import('./use-monthly-records')>(),
  useRecordsFilterOptions: () => ({ sites: {}, clients: {}, workplaces: {}, employees: {} }),
}))
const initialRecord: RecordDetail = {
  id: 'record', date: '2026-09-01', employee: { id: 'employee', firstName: 'Ana', lastName: 'Pérez', employeeId: '123' },
  workplace: { id: 'workplace', name: 'Oficina' }, client: { id: 'client', name: 'Cliente' }, site: { id: 'site', name: 'Provincia' },
  totalWorkMinutes: 480, recordStatus: 'COMPLETE', reviewStatus: 'NONE', origin: 'AUTOMATIC', hasAbsence: false, observations: null, version: 3,
  intervals: [{ id: 'interval', type: 'WORK', status: 'CLOSED', startTime: '2026-09-01T12:00:00.000Z', endTime: '2026-09-01T20:00:00.000Z', absenceReason: null, observations: null, origin: 'AUTOMATIC', reviewStatus: 'NONE', attendanceEvents: [{ id: 'event', type: 'CHECK_IN', occurredAt: '2026-09-01T12:00:00.000Z' }] }],
  createdAt: '2026-09-01T12:00:00.000Z', updatedAt: '2026-09-01T20:00:00.000Z',
}
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
})
beforeEach(() => {
  vi.resetAllMocks()
  service.getDetail.mockResolvedValue(initialRecord)
  service.getAttendanceEventDetail.mockResolvedValue({ id: 'event', type: 'CHECK_IN', occurredAt: '2026-09-01T12:00:00.000Z', receivedAt: '2026-09-01T12:00:01.000Z', origin: 'MOBILE', observation: null, location: null, metadata: { offline: false } })
})
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  client.setQueryData(['records', 'monthly'], { pages: ['old', 'old-second'] })
  client.setQueryData(['dashboard'], { pendingReviewRecords: 1 })
  render(<QueryClientProvider client={client}><RecordDetailDialog recordId="record" onClose={vi.fn()} /></QueryClientProvider>)
  return { client, user: userEvent.setup() }
}
describe('record detail actions', () => {
  it('loads event metadata only when requested and refreshes matrix and metrics after approval', async () => {
    const approved = { ...initialRecord, reviewStatus: 'APPROVED', version: 4 }
    service.approve.mockResolvedValue(approved)
    const { client, user } = setup()
    await screen.findByRole('button', { name: 'Aprobar registro' })
    expect(service.getAttendanceEventDetail).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Más detalles' }))
    await screen.findByText('Registrado sin conexión')
    expect(service.getAttendanceEventDetail).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Aprobar registro' }))
    await waitFor(() => expect(client.getQueryData(['records', 'detail', 'record'])).toEqual(approved))
    expect(service.approve).toHaveBeenCalledExactlyOnceWith('record', { expectedVersion: 3, reviewStatus: 'APPROVED' })
    expect(client.getQueryData(['records', 'monthly'])).toBeUndefined()
    expect(client.getQueryState(['dashboard'])?.isInvalidated).toBe(true)
  })
  it('asks to reload a conflicting approval and shows the refreshed version', async () => {
    service.approve.mockRejectedValue(new ServiceError({ code: 'RECORD_VERSION_CONFLICT', status: 409, kind: 'api', retryable: false, message: 'Conflict' }))
    const { client, user } = setup()
    await user.click(await screen.findByRole('button', { name: 'Aprobar registro' }))
    await screen.findByText(/El registro cambió antes de aprobarlo/)
    expect(service.approve).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(['records', 'detail', 'record'])).toEqual(initialRecord)
    service.getDetail.mockResolvedValue({ ...initialRecord, version: 5, reviewStatus: 'PENDING' })
    await user.click(screen.getByRole('button', { name: 'Recargar detalle' }))
    await waitFor(() => expect(client.getQueryData(['records', 'detail', 'record'])).toMatchObject({ version: 5, reviewStatus: 'PENDING' }))
  })
})
