import { expect, it } from 'vitest'
import { createServiceAdapter } from './create-service-adapter'
import { AccessService } from './access-service'
it('supports a local UI-only request/OTP/reset/decision flow', async () => {
  const service = new AccessService(createServiceAdapter({ VITE_SERVICE_MODE: 'mock' }))
  const challenge = await service.requestAccess({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', password: 'legacy', phone: '2645550199', dni: '41234567', employeeId: 'EMP-051', address: 'Mitre 150', siteId: '11000000-0000-4000-8000-000000000005', birthDate: '2000-05-20' })
  expect(await service.verify(challenge.challengeId, '123456')).toMatchObject({ status: 'PENDING' })
  expect(await service.recover('ana@example.test')).toEqual({ sent: true })
  expect(await service.reset('mock-token', 'frase segura nueva')).toEqual({ updated: true })
  expect(await service.confirm('mock-token', 'REJECT')).toEqual({ decision: 'REJECTED' })
  await expect(service.confirm('mock-token', 'APPROVE')).rejects.toMatchObject({ code: 'REQUEST_ALREADY_DECIDED' })
})
