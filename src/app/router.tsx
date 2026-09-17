import { createBrowserRouter } from 'react-router-dom'
import { FoundationPage } from '../features/foundation/foundation-page'
import { NotFoundPage } from '../features/not-found/not-found-page'
import { RouteErrorPage } from '../features/errors/route-error-page'
import { AppShell } from './app-shell'

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <FoundationPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ])
}
