# Propuesta: P-03 — Solicitud administrativa completa con verificación previa

**Fecha:** 2026-09-17
**Origen:** admin_web_app / leader
**Estado:** aplicada
**Nota (2026-09-17, orchestrator, segunda ronda):** ratificada por el humano: ampliar la ruta existente (sin versionar), challenge 6 dígitos con TTL 10 min / 5 intentos / cooldown 60 s, payload sin verificar eliminado a las 72 h, link de decisión con expiración 7 días, **contraseña actual exigida** para cuentas existentes, discrepancias no identitarias → advertir y continuar, cuenta desactivada con decisión pendiente → solicitud cancelada, tipos candidatos como base. Todo en `docs/arquitectura/contratos-api.md` (decisión 10). Resta ejecución de backend: DTOs completos, respuestas neutrales y catálogo de errores.
**Responsable propuesto:** leader backend/auth y humano; orchestrator propaga.
**Módulos afectados:** F-003/F-010; mobile para compatibilidad de identidad y restricciones de rol.

## Archivo(s) común(es) afectado(s)

- `docs/arquitectura/contratos-api.md`.
- Coordinación externa: backend `02-modelo-de-datos.md`, `03-contratos-api.md`, `04-auth-y-seguridad.md`, `06-integraciones.md`, `07-convenciones.md`.
- Spec §§5, 7, 10.1–10.3; decisiones confirmadas en la hoja de ruta.

## Problema

El endpoint descrito recibe solo email; la web debe preservar diez campos y soportar cuenta nueva o existente. Cambiar el rol basándose solo en un email público permite bloquear a otra persona convirtiéndola en TO_BE_ADMIN. La verificación mobile termina en deep link y no puede reutilizarse silenciosamente para esta finalidad.

## Cambio propuesto

**Rutas, tipos y políticas de challenge siguientes son candidatos pendientes.** La verificación previa y los diez campos sí son decisiones del humano; el diseño exacto debe aprobarse específicamente.

1. `POST /auth/admin-access-request` recibe los diez campos, normaliza/valida y prepara un challenge. No crea User, cambia rol ni envía correo de decisión al SuperAdmin en este punto. Guardar payload pendiente mínimo, con contraseña nueva hasheada por backend, nunca en texto ni logs. Datos pendientes expiran y se eliminan según política aprobada.
2. Enviar código de seis dígitos al email. Propuesta: TTL diez minutos, máximo cinco intentos, cooldown de reenvío 60 segundos; adoptar esos números requiere ratificación aunque coincidan con OTP de login. Rate limit y cuotas de envío por IP/destino también son responsabilidad backend.
3. `POST /auth/admin-access-request/verify` valida challenge, código e identidad; en transacción consume challenge, resuelve unicidad, crea cuenta COMPLETA o cambia rol de la existente elegible y crea la solicitud PENDING. Ninguna operación depende solo de un userId enviado por cliente.
4. Solo después de esa transacción: correo de solicitud recibida al usuario y solicitud de decisión al SuperAdmin, con despacho idempotente/reintentable en backend. La UI no interpreta fallo de email como permiso para recrear la cuenta.
5. `POST /auth/admin-access-request/resend` reenvía sin revelar si existe cuenta; invalida código anterior y no renueva indefinidamente la vida máxima de la solicitud. Confirmar IDs/expiración/intentos tras reenvío.
6. Aprobación/rechazo conserva mecanismo de decisión por token del backend: página `/admin-access/confirm?token=...&decision=...` muestra acción y exige confirmación explícita antes de POST. GET solo muestra UI, nunca decide; los scanners de email no deben aprobar cuentas. Validar allowlist de `decision`, no reflejar HTML ni redirigir a URLs aportadas.

### Tipos candidatos

```ts
interface AdminAccessRequestCandidate {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dni: string;
  employeeId: string;
  address: string;
  siteId: string;
  birthDate: string;
}
interface AdminAccessChallengeCandidate {
  data: {
    challengeId: string;
    expiresAt: string;
    resendAvailableAt: string;
    message: string;
  };
}
interface VerifyAdminAccessCandidate {
  challengeId: string;
  code: string;
}
interface ResendAdminAccessCandidate { challengeId: string }
interface AdminAccessSubmittedCandidate {
  data: { status: "PENDING"; message: string };
}
```

`birthDate` es `YYYY-MM-DD`, timestamps de challenge UTC. `employeeId` aquí es número de legajo (no UUID), `siteId` UUID. Mantener strings para DNI/teléfono/legajo. No enviar confirmación de contraseña: es campo local si se usa. Resend devuelve `AdminAccessChallengeCandidate` completo y el cliente reemplaza su challenge activo.

Ejemplo candidato de formulario (datos ficticios, no cuenta provisionada):

```json
{
  "firstName": "Ana", "lastName": "Pérez", "email": "ana@example.test",
  "password": "<contraseña ingresada; política pendiente>", "phone": "2645551234",
  "dni": "12345678", "employeeId": "0081", "address": "Domicilio de prueba 123",
  "siteId": "33333333-3333-4333-8333-333333333333", "birthDate": "1990-05-12"
}
```

202 inicial/resend: `{"data":{"challengeId":"<opaco>","expiresAt":"2026-09-17T15:10:00Z","resendAvailableAt":"2026-09-17T15:01:00Z","message":"Si la solicitud es válida, recibirás las instrucciones en tu correo."}}`. No devolver `userExists`, rol ni perfil a solicitantes no verificados. Acordar challenges neutrales y tiempos razonablemente uniformes para solicitudes no elegibles, sin enviar datos de otra cuenta.

### Identidad y estados

| Caso tras comprobar email | Tratamiento propuesto / pendiente de ratificación |
|---|---|
| Email/DNI/legajo nuevos | Crear cuenta con los diez campos válidos, email verificado y rol TO_BE_ADMIN; cuenta no incompleta |
| EMPLOYEE ACTIVE existente, identidad coincidente | Preservar perfil y password; candidato: comprobar también contraseña existente durante la preparación y solo autorizar transición tras OTP válido. No reemplazar password por el del formulario |
| Email coincide pero DNI/legajo pertenecen a otra cuenta | Rechazar conflicto, no fusionar ni reasignar identificadores; mensaje preciso solo después de prueba de identidad suficiente |
| Perfil existente difiere en datos no identitarios | No sobrescribirlo. Definir si mostrar advertencia tras verificar o rechazar la solicitud; no bloquear silenciosamente por domicilio antiguo |
| TO_BE_ADMIN con solicitud PENDING | Respuesta idempotente pendiente; no generar otra solicitud ni correos duplicados |
| ADMIN / SUPER_ADMIN | No degradar rol ni crear solicitud duplicada; mensaje seguro tras verificación |
| INACTIVE | No reactivar ni cambiar rol; respuesta coherente con bloqueo total |
| Challenge vencido/consumido o cuenta cambió concurrentemente | No modificar datos; revalidar estado e identidad en la transacción |
| Solicitud aprobada | ADMIN; correo de resultado; login web aún requiere 2FA |
| Solicitud rechazada | EMPLOYEE; correo de resultado; no borrar cuenta |

Los cambios a TO_BE_ADMIN bloquean también mobile según contrato vigente, aunque §§5/10.3 antiguos digan lo contrario. Debe comunicarse antes de confirmar el formulario, sin revelar existencia de cuentas. Verificar revocación de sesiones o control de rol actual en backend, no esperar a que venza un JWT con rol antiguo.

Errores ya existentes potencialmente reutilizables: `INVALID_OTP`, `OTP_EXPIRED`, `TOO_MANY_ATTEMPTS`, `OTP_RESEND_COOLDOWN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `REQUEST_ALREADY_DECIDED`, `VALIDATION_ERROR`. Nuevos candidatos: `409 ADMIN_REQUEST_IDENTITY_CONFLICT` y `403 ADMIN_REQUEST_NOT_ELIGIBLE`, `retryable=false`, solo cuando sea seguro exponerlos tras verificación. La asignación exacta de HTTP/códigos y los casos idempotentes se aprueba antes de implementar.

### Protección de enlaces y datos

- Tokens de decisión/reset no van a analítica, console, referrer o almacenamiento persistente. Propuesta: leer query una vez, conservar en memoria y retirar de la URL con replaceState; recargar exige reabrir correo. Confirmar esta UX.
- Confirmación de decisión requiere token de un solo uso y validación backend de su propósito, solicitud y acción; no acepta acción arbitraria porque la query fue editada.
- Si decisión ya consumida, mostrar resultado/error contractual sin repetir POST automáticamente. No reintentar solicitudes con resultado ambiguo sin mecanismo de idempotencia aprobado.
- Contraseñas y payload pendiente se manejan exclusivamente en backend/estado efímero del formulario; ninguna provisión de correo o almacenamiento en este frontend.

## Impacto por app

- Admin: formulario completo, challenge, reenvío, confirmación y pantallas de resultado; necesita catálogo de provincias público seguro (P-04).
- Backend: payload temporal y verificación, unicidad transaccional, estados elegibles y correos; documentar el cambio del endpoint público existente y estrategia de compatibilidad.
- Mobile: preservar perfil/password, no usar verificación destinada a deep links; probar restricciones actuales de TO_BE_ADMIN y cambios de rol sobre sesiones abiertas.

## Preguntas restantes

¿Se mantiene ruta existente ampliada o se versiona? ¿Se exige password actual además del email para existentes? ¿Qué discrepancias de perfil impiden tramitar? ¿Cuál es retención máxima del payload, expiración de links de decisión, política de reenvío y comportamiento idempotente tras perder respuesta? ¿Qué ocurre si se desactiva la cuenta mientras una decisión está pendiente? Ninguna de estas preguntas queda decidida por el ejemplo.

## Criterio de desbloqueo y evidencia

Humano ratifica flujo/identidad y DTOs completos; backend publica respuestas neutrales, política de challenge/correos, errores y pruebas nueva/existente/duplicada/inactiva/admin/conflicto/concurrencia. Orchestrator propaga documentación común. F-003 incorpora los contratos aprobados; F-010 verifica que ningún rol cambia antes del email validado y que abrir links no produce POST. No se registra aprobación en esta entrega.
