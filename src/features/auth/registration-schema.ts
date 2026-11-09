import { z } from 'zod'
import { createUserFormSchema } from '../users/user-form-schema'

export function createRegistrationSchema(now: () => Date = () => new Date()) {
  return createUserFormSchema(false, now).pick({
    firstName: true,
    lastName: true,
    email: true,
    initialPassword: true,
    phone: true,
    dni: true,
    employeeId: true,
    address: true,
    siteId: true,
    birthDate: true,
  }).extend({
    initialPassword: z.string().refine((value) => [...value].length >= 1 && [...value].length <= 128, 'La contraseña debe tener entre 1 y 128 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña.'),
  }).refine((values) => values.initialPassword === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
}

export type RegistrationFields = z.infer<ReturnType<typeof createRegistrationSchema>>
