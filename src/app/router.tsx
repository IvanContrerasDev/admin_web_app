import { createBrowserRouter } from 'react-router-dom'
import { LoginPage } from '../features/auth/login-page'
import { ProtectedRoute } from '../features/auth/protected-route'
import { RouteErrorPage } from '../features/errors/route-error-page'
import { NotFoundPage } from '../features/not-found/not-found-page'
import { AppShell } from './app-shell'

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
      errorElement: <RouteErrorPage />,
    },
    {
      element: <ProtectedRoute />,
      errorElement: <RouteErrorPage />,
      children: [
        {
          path: '/',
          element: <AppShell />,
          children: [
            {
              index: true,
              lazy: async () => {
                const { DashboardPage } = await import('../features/dashboard/dashboard-page')
                return { Component: DashboardPage }
              },
            },
            {
              path: 'registros',
              lazy: async () => {
                const { RecordsPage } = await import('../features/modules/module-pages')
                return { Component: RecordsPage }
              },
            },
            {
              path: 'usuarios',
              lazy: async () => {
                const { UsersPage } = await import('../features/users/users-page')
                return { Component: UsersPage }
              },
            },
            {
              path: 'usuarios/nuevo',
              lazy: async () => {
                const { UserFormPage } = await import('../features/users/user-form-page')
                return { Component: UserFormPage }
              },
            },
            {
              path: 'usuarios/:userId',
              lazy: async () => {
                const { UserDetailPage } = await import('../features/users/user-detail-page')
                return { Component: UserDetailPage }
              },
            },
            {
              path: 'usuarios/:userId/editar',
              lazy: async () => {
                const { UserFormPage } = await import('../features/users/user-form-page')
                return { Component: UserFormPage }
              },
            },
            {
              path: 'clientes',
              lazy: async () => {
                const { ClientsPage } = await import('../features/organization/clients-page')
                return { Component: ClientsPage }
              },
            },
            {
              path: 'clientes/nuevo',
              lazy: async () => {
                const { ClientFormPage } = await import('../features/organization/client-form-page')
                return { Component: ClientFormPage }
              },
            },
            {
              path: 'clientes/:clientId',
              lazy: async () => {
                const { ClientDetailPage } = await import('../features/organization/client-detail-page')
                return { Component: ClientDetailPage }
              },
            },
            {
              path: 'clientes/:clientId/editar',
              lazy: async () => {
                const { ClientFormPage } = await import('../features/organization/client-form-page')
                return { Component: ClientFormPage }
              },
            },
            {
              path: 'lugares',
              lazy: async () => {
                const { WorkplacesPage } = await import('../features/organization/workplaces-page')
                return { Component: WorkplacesPage }
              },
            },
            {
              path: 'lugares/nuevo',
              lazy: async () => {
                const { WorkplaceFormPage } = await import('../features/organization/workplace-form-page')
                return { Component: WorkplaceFormPage }
              },
            },
            {
              path: 'lugares/:workplaceId',
              lazy: async () => {
                const { WorkplaceDetailPage } = await import('../features/organization/workplace-detail-page')
                return { Component: WorkplaceDetailPage }
              },
            },
            {
              path: 'lugares/:workplaceId/editar',
              lazy: async () => {
                const { WorkplaceFormPage } = await import('../features/organization/workplace-form-page')
                return { Component: WorkplaceFormPage }
              },
            },
            {
              path: 'planillas',
              lazy: async () => {
                const { TimesheetsPage } = await import('../features/modules/module-pages')
                return { Component: TimesheetsPage }
              },
            },
            {
              path: 'legajos',
              lazy: async () => {
                const { DocumentsPage } = await import('../features/modules/module-pages')
                return { Component: DocumentsPage }
              },
            },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ])
}
