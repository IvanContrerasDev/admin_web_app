import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../features/auth/auth-provider'
import { LoginPage } from '../features/auth/login-page'
import { ProtectedRoute } from '../features/auth/protected-route'
import { DashboardPage } from '../features/dashboard/dashboard-page'
import { DocumentsPage } from '../features/documents/documents-page'
import { EmployeeDocumentsPage } from '../features/documents/employee-documents-page'
import { ClientFormPage } from '../features/organization/client-form-page'
import { RecordDetailDialog } from '../features/records/record-detail-dialog'
import { RecordEditorForm } from '../features/records/record-editor-form'
import { RecordsPage } from '../features/records/records-page'
import { useMonthlyRecords } from '../features/records/use-monthly-records'
import { TimesheetsPage } from '../features/timesheets/timesheets-page'
import { ToastProvider } from '../features/toasts/toast-provider'
import { formatArgentinaDateTime, getArgentinaCivilDate } from '../lib/dates'
import { registerDocumentsMockRoutes } from '../mocks/documents-handlers'
import { registerOrganizationMockRoutes } from '../mocks/organization-handlers'
import { registerRecordsMockRoutes } from '../mocks/records-handlers'
import { registerTimesheetsMockRoutes } from '../mocks/timesheets-handlers'
import { registerUserMockRoutes } from '../mocks/user-handlers'
import { DocumentsService } from '../services/documents-service'
import { MockServiceAdapter } from '../services/mock-service-adapter'
import { OrganizationService } from '../services/organization-service'
import { RecordsService } from '../services/records-service'
import { ServiceError } from '../services/service-error'
import { authService, documentsService, organizationService, recordsService, timesheetsService, userService } from '../services/services'
import { TimesheetsService } from '../services/timesheets-service'
import { UserService } from '../services/user-service'
import type { AuthenticatedSession } from '../types/auth'
import { AppShell } from './app-shell'

const employeeId = '22000000-0000-4000-8000-000000000001'
const clientId = '33000000-0000-4000-8000-000000000001'
const siteId = '11000000-0000-4000-8000-000000000005'
const workplaceId = '44000000-0000-4000-8000-000000000001'
const documentId = '77000000-0000-4000-8000-000000000001'
const timesheetId = '66000000-0000-4000-8000-000000000001'
const session: AuthenticatedSession = {
  user: { id: 'admin', firstName: 'Marina', lastName: 'Quiroga', email: 'admin@example.test', employeeId: 'ADM-014', role: 'ADMIN' },
  rememberSession: false, sessionExpiresAt: '2030-10-01T12:00:00.000Z', accessToken: 'access', accessExpiresIn: 1800,
}

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderPage(path: string) {
  const queryClient = createClient()
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> },
    { element: <ProtectedRoute />, children: [{ path: '/', element: <AppShell />, children: [
      { index: true, element: <DashboardPage /> },
      { path: '/planillas', element: <TimesheetsPage /> },
      { path: '/documentos', element: <DocumentsPage /> },
      { path: '/usuarios/:userId/legajo', element: <EmployeeDocumentsPage /> },
      { path: '/clientes/:clientId/editar', element: <ClientFormPage /> },
      { path: '/clientes/:clientId', element: <h1>Cliente guardado</h1> },
      { path: '/registros', element: <RecordsPage /> },
    ] }] },
  ], { initialEntries: [path] })
  render(<QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><RouterProvider router={router} /></AuthProvider></ToastProvider></QueryClientProvider>)
  return { router, queryClient }
}

beforeEach(() => {
  const adapter = new MockServiceAdapter()
  registerOrganizationMockRoutes(adapter)
  registerUserMockRoutes(adapter)
  registerRecordsMockRoutes(adapter)
  registerDocumentsMockRoutes(adapter)
  registerTimesheetsMockRoutes(adapter)
  const organization = new OrganizationService(adapter)
  const users = new UserService(adapter)
  const records = new RecordsService(adapter)
  const documents = new DocumentsService(adapter)
  const timesheets = new TimesheetsService(adapter)
  vi.spyOn(authService, 'bootstrap').mockResolvedValue(session)
  vi.spyOn(authService, 'logout').mockResolvedValue(undefined)
  vi.spyOn(organizationService, 'listSites').mockImplementation(organization.listSites.bind(organization))
  vi.spyOn(organizationService, 'listClients').mockImplementation(organization.listClients.bind(organization))
  vi.spyOn(organizationService, 'listWorkplaces').mockImplementation(organization.listWorkplaces.bind(organization))
  vi.spyOn(organizationService, 'getClient').mockImplementation(organization.getClient.bind(organization))
  vi.spyOn(organizationService, 'updateClient').mockImplementation(organization.updateClient.bind(organization))
  vi.spyOn(userService, 'list').mockImplementation(users.list.bind(users))
  vi.spyOn(userService, 'get').mockImplementation(users.get.bind(users))
  vi.spyOn(recordsService, 'listMonthly').mockImplementation(records.listMonthly.bind(records))
  vi.spyOn(recordsService, 'getDetail').mockImplementation(records.getDetail.bind(records))
  vi.spyOn(recordsService, 'update').mockImplementation(records.update.bind(records))
  vi.spyOn(recordsService, 'approve').mockImplementation(records.approve.bind(records))
  vi.spyOn(documentsService, 'list').mockImplementation(documents.list.bind(documents))
  vi.spyOn(documentsService, 'get').mockImplementation(documents.get.bind(documents))
  vi.spyOn(documentsService, 'update').mockImplementation(documents.update.bind(documents))
  vi.spyOn(timesheetsService, 'list').mockImplementation(timesheets.list.bind(timesheets))
  vi.spyOn(timesheetsService, 'get').mockImplementation(timesheets.get.bind(timesheets))
  if (!HTMLDialogElement.prototype.showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', '') } })
})

describe('F-013 interface regressions', () => {
  it.each(['ADMIN', 'SUPER_ADMIN'] as const)('gives %s the same navigation access', async (role) => {
    vi.mocked(authService.bootstrap).mockResolvedValue({ ...session, user: { ...session.user, role } })
    renderPage('/')
    await screen.findByRole('heading', { name: 'Buen día, Marina' })
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toHaveTextContent('InicioRegistrosUsuariosClientesLugares de trabajoPlanillasDocumentos')
  })

  it.each(['/\\evil.test', '//evil.test', '/registros\\evil.test', '/login?returnTo=/login', '/\t/evil.test'])('rejects unsafe returnTo %s', async (returnTo) => {
    const { router } = renderPage(`/login?returnTo=${encodeURIComponent(returnTo)}`)
    await screen.findByRole('heading', { name: 'Buen día, Marina' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('preserves a legitimate internal returnTo with filters', async () => {
    const { router } = renderPage(`/login?returnTo=${encodeURIComponent('/planillas?month=2026-09&status=PENDING')}`)
    await screen.findByRole('heading', { name: 'Planillas' })
    expect(router.state.location.pathname).toBe('/planillas')
    expect(router.state.location.search).toBe('?month=2026-09&status=PENDING')
  })

  it('shows the challenge expiration from expiresAt', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.bootstrap).mockRejectedValue(new Error('No session'))
    const expiresAt = '2026-10-13T17:23:00.000Z'
    vi.spyOn(authService, 'login').mockResolvedValue({ challengeId: 'challenge', expiresAt, message: 'Revisá tu email.' })
    renderPage('/login')
    await screen.findByRole('heading', { name: 'Ingresá a Administración' })
    await user.type(screen.getByLabelText('Email'), 'admin@example.test')
    await user.type(screen.getByLabelText('Contraseña'), 'test password')
    await user.click(screen.getByRole('button', { name: 'Continuar con código' }))
    expect(await screen.findByText(`El código vence el ${formatArgentinaDateTime(expiresAt)} (hora Argentina).`)).toBeInTheDocument()
  })

  it('clears local data and warns when remote logout fails, with a working retry', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(undefined)
    const { router, queryClient } = renderPage('/')
    await screen.findByRole('heading', { name: 'Buen día, Marina' })
    queryClient.setQueryData(['private-data'], { secret: 'not persisted' })
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('no pudimos confirmar la revocación remota')
    expect(router.state.location.pathname).toBe('/login')
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined()
    expect(queryClient.getQueryData(['auth', 'session'])).toBeNull()
    expect(authService.bootstrap).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Reintentar cierre remoto' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('writes the initial Argentina month into the dashboard URL without losing filters', async () => {
    const { router } = renderPage('/?extra=preserved')
    await screen.findByRole('heading', { name: 'Buen día, Marina' })
    await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('month')).toBe(getArgentinaCivilDate().slice(0, 7)))
    expect(new URLSearchParams(router.state.location.search).get('extra')).toBe('preserved')
  })

  it('invalidates workplaces when renaming a client', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderPage(`/clientes/${clientId}/editar`)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await screen.findByRole('heading', { name: 'Editar Andes Logística' })
    await user.clear(screen.getByLabelText('Nombre'))
    await user.type(screen.getByLabelText('Nombre'), 'Andes actualizado')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await screen.findByRole('heading', { name: 'Cliente guardado' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['clients'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['workplaces'] })
  })

  it('keeps all organizational filters when submitting a timesheet search', async () => {
    const user = userEvent.setup()
    const filters = { siteId, clientId, workplaceId, employeeId, month: '2026-09', status: 'PENDING' }
    const { router } = renderPage(`/planillas?${new URLSearchParams(filters)}`)
    await screen.findByRole('heading', { name: 'Planillas' })
    await user.type(screen.getByLabelText('Buscar'), 'alvarez')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('search')).toBe('alvarez'))
    for (const [key, value] of Object.entries(filters)) expect(new URLSearchParams(router.state.location.search).get(key)).toBe(value)
  })

  it('opens a timesheet by ID even when the current list excludes it', async () => {
    renderPage(`/planillas?search=no-match&timesheetId=${timesheetId}`)
    expect(await screen.findByRole('dialog')).toHaveTextContent('Planilla de Álvarez, Lucía')
    expect(timesheetsService.get).toHaveBeenCalledWith(timesheetId, expect.any(AbortSignal))
  })

  it.each(['/documentos', `/usuarios/${employeeId}/legajo`])('opens a document independently of the current page at %s', async (path) => {
    renderPage(`${path}?page=2&documentId=${documentId}`)
    expect(await screen.findByRole('dialog')).toHaveTextContent('Documento de Álvarez, Lucía')
    expect(documentsService.get).toHaveBeenCalledWith(documentId, expect.any(AbortSignal))
  })

  it('keeps a document dialog mounted after editing removes it from the filtered list', async () => {
    const user = userEvent.setup()
    renderPage(`/documentos?type=CONTRACT&documentId=${documentId}`)
    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Tipo de documento'), 'OTHER')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(documentsService.update).toHaveBeenCalledWith(documentId, expect.objectContaining({ type: 'OTHER' })))
    await screen.findByText('Los cambios se guardaron correctamente.')
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(within(dialog).getByLabelText('Tipo de documento')).toHaveValue('OTHER')
  })

  it('shows an actionable error for a missing detail ID', async () => {
    renderPage('/documentos?documentId=missing')
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos abrir el documento')
    expect(screen.getByRole('button', { name: 'Reintentar detalle' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar detalle' })).toBeInTheDocument()
  })

  it.each(['sites', 'clients', 'workplaces', 'employees'] as const)('retries a failed %s catalog instead of only resetting monthly records', async (catalog) => {
    const method = { sites: organizationService.listSites, clients: organizationService.listClients, workplaces: organizationService.listWorkplaces, employees: userService.list }[catalog]
    vi.mocked(method).mockRejectedValueOnce(new Error('Offline'))
    renderPage(`/registros?month=2026-09&siteId=${siteId}`)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar la matriz mensual')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(method).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('stops automatic pagination after snapshot expiration until the user restarts', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId })
    monthly.pagination.totalPages = 2
    vi.mocked(recordsService.listMonthly).mockClear().mockImplementation(async (query) => {
      if (query.page === 2) throw new ServiceError({ code: 'MONTHLY_SNAPSHOT_EXPIRED', message: 'Venció', kind: 'api', status: 410, retryable: false })
      return monthly
    })
    renderPage(`/registros?month=2026-09&siteId=${siteId}`)
    const table = await screen.findByRole('table')
    fireEvent.scroll(table.parentElement!)
    await screen.findByRole('alert')
    expect(recordsService.listMonthly).toHaveBeenCalledTimes(2)
    fireEvent.scroll(table.parentElement!)
    expect(recordsService.listMonthly).toHaveBeenCalledTimes(2)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(recordsService.listMonthly).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, snapshotToken: undefined }), expect.any(AbortSignal))
  })

  it('renders official total minutes as h:mm rather than rounded hours', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId })
    monthly.meta.totals.monthWorkMinutes = 151
    vi.mocked(recordsService.listMonthly).mockResolvedValue(monthly)
    renderPage(`/registros?month=2026-09&siteId=${siteId}`)
    expect(await screen.findByText('2:31 h')).toBeInTheDocument()
  })

  it('invalidates dashboard metrics on approval', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId, reviewStatus: 'PENDING' })
    const day = monthly.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.matchesFilters)
    if (!day || day.state !== 'PRESENT') throw new Error('Missing fixture')
    const queryClient = createClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    render(<QueryClientProvider client={queryClient}><RecordDetailDialog recordId={day.record.id} onClose={vi.fn()} /></QueryClientProvider>)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /aprobar/i }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] }))
  })

  it('allows correcting observations without rewriting a historical open interval and invalidates metrics', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId, status: 'INCOMPLETE' })
    const day = monthly.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.record.recordStatus === 'INCOMPLETE' && !item.record.hasAbsence)
    if (!day || day.state !== 'PRESENT') throw new Error('Missing fixture')
    const detail = await recordsService.getDetail(day.record.id)
    const queryClient = createClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const saved = vi.fn()
    render(<QueryClientProvider client={queryClient}><RecordEditorForm record={detail} initialDate={detail.date} employees={[]} workplaces={[]} onCancel={vi.fn()} onSaved={saved} /></QueryClientProvider>)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Observaciones generales'), 'Aclaración administrativa')
    await user.click(screen.getByRole('button', { name: 'Guardar corrección' }))
    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(recordsService.update).toHaveBeenCalledWith(detail.id, { expectedVersion: detail.version, observations: 'Aclaración administrativa' })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('can add an untimed absence without rejecting overlapping untouched historical intervals', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId })
    const day = monthly.data.flatMap((row) => row.days).find((item) => item.state === 'PRESENT' && item.record.intervalCount === 2 && item.record.recordStatus === 'COMPLETE' && !item.record.hasAbsence)
    if (!day || day.state !== 'PRESENT') throw new Error('Missing fixture')
    const detail = await recordsService.getDetail(day.record.id)
    detail.intervals[0]!.endTime = detail.intervals[1]!.endTime
    vi.mocked(recordsService.update).mockResolvedValue(detail)
    const saved = vi.fn()
    render(<QueryClientProvider client={createClient()}><RecordEditorForm record={detail} initialDate={detail.date} employees={[]} workplaces={[]} onCancel={vi.fn()} onSaved={saved} /></QueryClientProvider>)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Agregar intervalo' }))
    await user.selectOptions(screen.getByLabelText('Tipo', { selector: 'select[name="interval-2-type"]' }), 'ABSENCE')
    await user.click(screen.getByRole('button', { name: 'Guardar corrección' }))
    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(recordsService.update).toHaveBeenCalledWith(detail.id, {
      expectedVersion: detail.version,
      intervalChanges: [{ operation: 'ADD', interval: { type: 'ABSENCE', startTime: null, endTime: null, absenceReason: null, observations: null } }],
    })
  })

  it('restarts an expired infinite query from page 1 without its old snapshot', async () => {
    const monthly = await recordsService.listMonthly({ year: 2026, month: 9, siteId })
    monthly.pagination.totalPages = 3
    vi.mocked(recordsService.listMonthly).mockImplementation(async (query) => {
      if (query.page === 3) throw new ServiceError({ code: 'MONTHLY_SNAPSHOT_EXPIRED', message: 'Venció', kind: 'api', status: 410, retryable: false })
      return { ...monthly, pagination: { ...monthly.pagination, page: query.page ?? 1 } }
    })
    const queryClient = createClient()
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useMonthlyRecords({ year: 2026, month: 9, siteId }, true), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    await act(async () => { await result.current.fetchNextPage() })
    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true))
    await act(async () => { await result.current.restart() })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1))
    expect(recordsService.listMonthly).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, snapshotToken: undefined }), expect.any(AbortSignal))
  })
})
