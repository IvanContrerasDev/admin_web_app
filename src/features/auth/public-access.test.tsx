import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { accessService } from '../../services/services'
import { AdminAccessConfirmPage, PasswordRecoveryPage, PasswordResetPage } from './public-access-pages'

beforeEach(() => { window.history.replaceState(null, '', '/') })
it('recovery shows neutral success', async () => {
  vi.spyOn(accessService, 'recover').mockResolvedValue({ sent: true })
  render(<MemoryRouter><PasswordRecoveryPage /></MemoryRouter>)
  await userEvent.type(screen.getByLabelText('Email'), 'ana@example.test')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
  expect(await screen.findByRole('status')).toHaveTextContent('Si la cuenta está habilitada')
})
it('GET decision does not decide, cleans token and requires explicit POST', async () => {
  window.history.replaceState(null, '', '/admin-access/confirm?token=secret&decision=REJECT')
  const confirm = vi.spyOn(accessService, 'confirm').mockResolvedValue({ decision: 'REJECTED' })
  render(<MemoryRouter><AdminAccessConfirmPage /></MemoryRouter>)
  expect(window.location.search).toBe('')
  expect(confirm).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar rechazo' }))
  expect(confirm.mock.calls[0]!.slice(0,2)).toEqual(['secret', 'REJECT'])
  expect(await screen.findByRole('status')).toHaveTextContent('Solicitud rechazada')
})
it('reset strips token and posts a new password only on submit', async () => {
  window.history.replaceState(null, '', '/password-reset?token=secret')
  const reset = vi.spyOn(accessService, 'reset').mockResolvedValue({ updated: true })
  render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
  expect(window.location.search).toBe('')
  expect(reset).not.toHaveBeenCalled()
  await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'una frase segura')
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'una frase segura')
  await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(reset.mock.calls[0]!.slice(0,2)).toEqual(['secret', 'una frase segura'])
  expect(await screen.findByRole('status')).toHaveTextContent('Contraseña actualizada')
})

it.each([['INVALID_TOKEN', 'El enlace no es válido'], ['TOKEN_EXPIRED', 'El enlace venció'], ['REQUEST_ALREADY_DECIDED', 'ya fue decidida']])('presents %s from decision response', async (code, message) => {
  const { ServiceError } = await import('../../services/service-error')
  window.history.replaceState(null, '', '/admin-access/confirm?token=secret&decision=APPROVE')
  vi.spyOn(accessService, 'confirm').mockRejectedValue(new ServiceError({ code, message: 'Error', retryable: false, kind: 'api' }))
  render(<MemoryRouter><AdminAccessConfirmPage /></MemoryRouter>)
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar aprobación' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(message)
})
it('rejects malformed decision without a request', async () => {
  window.history.replaceState(null, '', '/admin-access/confirm?token=secret&decision=DELETE')
  const confirm = vi.spyOn(accessService, 'confirm')
  render(<MemoryRouter><AdminAccessConfirmPage /></MemoryRouter>)
  expect(screen.getByRole('alert')).toHaveTextContent('El enlace no es válido')
  expect(confirm).not.toHaveBeenCalled()
})
it('shows expired reset error and keeps the password form available', async () => {
  const { ServiceError } = await import('../../services/service-error')
  window.history.replaceState(null, '', '/password-reset?token=expired')
  vi.spyOn(accessService, 'reset').mockRejectedValue(new ServiceError({ code: 'TOKEN_EXPIRED', message: 'Error', retryable: false, kind: 'api' }))
  render(<MemoryRouter><PasswordResetPage /></MemoryRouter>)
  await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'una frase segura')
  await userEvent.type(screen.getByLabelText('Confirmar contraseña'), 'una frase segura')
  await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('El enlace venció')
})
