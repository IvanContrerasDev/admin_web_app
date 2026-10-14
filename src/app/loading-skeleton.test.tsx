import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { QueryState } from '../features/organization/organization-ui'
import { ToastProvider } from '../features/toasts/toast-provider'
import { UserFormPage } from '../features/users/user-form-page'
import { userService } from '../services/services'
import type { SiteReference } from '../types/users'
import { LoadingSkeleton } from './loading-skeleton'

describe('Skeletons transversales aprobados', () => {
  it.each(['table', 'matrix', 'metrics', 'form', 'detail', 'map', 'session', 'inline'] as const)('renders accessible %s placeholders, without interactive fake content', (variant) => {
    const { container } = render(<LoadingSkeleton label="Cargando información…" variant={variant} />)
    expect(screen.getByRole('status', { name: 'Cargando información…' })).toHaveAttribute('data-skeleton', variant)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    expect(container.querySelectorAll('button, input, a, select')).toHaveLength(0)
    expect(screen.getByText('Cargando información…')).toHaveClass('sr-only')
    expect(container.querySelector('.motion-safe\\:animate-pulse')).toBeInTheDocument()
  })

  it('matches the four dashboard cards', () => {
    const { container } = render(<LoadingSkeleton label="Cargando métricas…" variant="metrics" />)
    expect(container.querySelector('.grid')?.children).toHaveLength(4)
  })

  it('hides incomplete content while pending and replaces the skeleton with data', () => {
    const props = { pending: true, error: false, empty: false, subject: 'las planillas', onRetry: vi.fn() }
    const { rerender } = render(<QueryState {...props}><p>Datos listos</p></QueryState>)
    expect(screen.getByRole('status', { name: 'Cargando las planillas…' })).toBeInTheDocument()
    expect(screen.queryByText('Datos listos')).not.toBeInTheDocument()
    rerender(<QueryState {...props} pending={false}><p>Datos listos</p></QueryState>)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Datos listos')).toBeInTheDocument()
  })

  it('preserves the retry action on an error without showing loading or incomplete content', async () => {
    const onRetry = vi.fn()
    render(<QueryState pending={false} error empty={false} subject="los clientes" onRetry={onRetry}><p>Datos incompletos</p></QueryState>)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar los clientes.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Datos incompletos')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('preserves the empty state without fake rows', () => {
    render(<QueryState pending={false} error={false} empty subject="los documentos" onRetry={vi.fn()}><p>Datos listos</p></QueryState>)
    expect(screen.getByRole('heading', { name: 'No hay resultados' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Datos listos')).not.toBeInTheDocument()
  })

  it('shows a form skeleton until the real catalog resolves', async () => {
    let resolveSites!: (sites: SiteReference[]) => void
    vi.spyOn(userService, 'listSites').mockImplementation(() => new Promise((resolve) => { resolveSites = resolve }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const router = createMemoryRouter([{ path: '/usuarios/nuevo', element: <UserFormPage /> }], { initialEntries: ['/usuarios/nuevo'] })
    render(<QueryClientProvider client={client}><ToastProvider><RouterProvider router={router} /></ToastProvider></QueryClientProvider>)
    expect(await screen.findByRole('status', { name: 'Cargando formulario…' })).toHaveAttribute('data-skeleton', 'form')
    expect(screen.queryByRole('button', { name: 'Crear empleado' })).not.toBeInTheDocument()
    await act(async () => resolveSites([]))
    expect(await screen.findByRole('button', { name: 'Crear empleado' })).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Cargando formulario…' })).not.toBeInTheDocument()
  })
})
