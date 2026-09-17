import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { createQueryClient } from './query-client'
import { createAppRouter } from './router'

function renderApplication(path = '/') {
  window.history.pushState({}, '', path)
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={createAppRouter()} />
    </QueryClientProvider>,
  )
}

describe('application shell', () => {
  it('renders the foundation route in Spanish', async () => {
    renderApplication()

    expect(await screen.findByRole('heading', {
      name: /base técnica lista para construir los módulos administrativos/i,
    })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /saltar al contenido principal/i })).toHaveAttribute('href', '#main-content')
  })

  it('renders an accessible not-found route', async () => {
    renderApplication('/ruta-inexistente')

    expect(await screen.findByRole('heading', { name: /esta sección no está disponible/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })
})
