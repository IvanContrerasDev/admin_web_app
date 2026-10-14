import { describe, expect, it } from 'vitest'
import { createUserFormSchema } from './user-form-schema'

const fields = { firstName: ' Ana ', lastName: ' Pérez ', employeeId: ' EMP-051 ', dni: '41234567', email: ' ANA@example.test ', phone: '2645550199', address: ' Mitre 150 ', siteId: '11000000-0000-4000-8000-000000000005', birthDate: '2000-05-20', initialPassword: '  frase segura 2026  ', cuil: '', hireDate: '', position: '' }
const now = () => new Date('2026-10-14T01:00:00Z')

describe('employee form validation', () => {
  it('normalizes contact fields without trimming the password', () => {
    expect(createUserFormSchema(false, now).parse(fields)).toMatchObject({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.test', initialPassword: fields.initialPassword })
  })

  it.each([
    ['firstName', '  '], ['lastName', 'x'.repeat(101)], ['employeeId', 'x'.repeat(51)], ['dni', '12abc456'], ['email', 'invalid'], ['phone', '123'], ['address', ''], ['siteId', 'invalid'], ['birthDate', '2026-02-31'], ['birthDate', '2026-10-14'], ['birthDate', '0000-01-01'], ['initialPassword', 'corta'], ['initialPassword', 'x'.repeat(129)],
  ])('reports invalid %s by field', (field, value) => {
    const result = createUserFormSchema(false, now).safeParse({ ...fields, [field]: value })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([field])
  })

  it('accepts today in Argentina and optional empty edit fields without requiring a password', () => {
    expect(createUserFormSchema(true, now).safeParse({ ...fields, birthDate: '2026-10-13', hireDate: '2026-10-13', initialPassword: '' }).success).toBe(true)
    expect(createUserFormSchema(true, now).safeParse({ ...fields, initialPassword: '' }).success).toBe(true)
  })

  it.each([['cuil', '123'], ['hireDate', '2026-10-14'], ['hireDate', '2026-02-31'], ['position', 'x'.repeat(101)]])('validates optional edit field %s', (field, value) => {
    const result = createUserFormSchema(true, now).safeParse({ ...fields, [field]: value })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([field])
  })
})
