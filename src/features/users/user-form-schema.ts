import { z } from 'zod'
import { getArgentinaCivilDate, isValidCivilDate } from '../../lib/dates'

const requiredText = (label: string, max: number) => z.string().trim().min(1, `Ingresá ${label}.`).max(max, `Usá como máximo ${max} caracteres.`)

export function createUserFormSchema(editing: boolean, now: () => Date = () => new Date()) {
  const civilDate = z.string().refine((value) => isValidCivilDate(value, getArgentinaCivilDate(now())), 'Ingresá una fecha válida que no sea futura.')
  return z.object({
    firstName: requiredText('el nombre', 100),
    lastName: requiredText('el apellido', 100),
    employeeId: requiredText('el legajo', 50),
    dni: z.string().trim().regex(/^\d{7,8}$/, 'El DNI debe contener 7 u 8 dígitos.'),
    email: z.string().trim().toLowerCase().email('Ingresá un email válido.').max(254, 'Usá como máximo 254 caracteres.'),
    phone: z.string().trim().regex(/^\d{10,13}$/, 'El teléfono debe contener entre 10 y 13 dígitos.'),
    address: requiredText('el domicilio', 200),
    siteId: z.string().uuid('Seleccioná una provincia habilitada.'),
    birthDate: civilDate,
    initialPassword: editing ? z.string() : z.string().min(12, 'La contraseña debe tener entre 12 y 128 caracteres.').max(128, 'La contraseña debe tener entre 12 y 128 caracteres.'),
    cuil: z.string().trim().refine((value) => !editing || value === '' || /^\d{11}$/.test(value), 'El CUIL debe contener 11 dígitos.'),
    hireDate: z.string().refine((value) => !editing || value === '' || isValidCivilDate(value, getArgentinaCivilDate(now())), 'Ingresá una fecha de ingreso válida que no sea futura.'),
    position: z.string().trim().max(100, 'Usá como máximo 100 caracteres.'),
  })
}

export type UserFormFields = z.infer<ReturnType<typeof createUserFormSchema>>
