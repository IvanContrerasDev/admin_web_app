import { useLayoutEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accessService } from '../../services/services'
import { AuthLayout } from './auth-layout'
import { accessButtonClass, accessInputClass, useAccessOperation } from './access-ui'

function useEmailLink() {
  const [link] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return { token: params.get('token') ?? '', decision: params.get('decision') }
  })
  useLayoutEffect(() => {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }, [])
  return link
}
function LoginLink() { return <Link className="min-h-11 text-primary underline hover:text-foreground focus-visible:outline-2" to="/login">Volver al inicio de sesión</Link> }

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const { busy, error, run } = useAccessOperation()
  return <AuthLayout><form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); void run(async (signal) => { await accessService.recover(email.trim().toLowerCase(), signal); if (!signal.aborted) { setEmail(''); setSent(true) } }) }}>
    <h1 className="text-3xl font-semibold">Recuperar contraseña</h1>
    {sent ? <p role="status">Si la cuenta está habilitada, recibirás un enlace para restablecer tu contraseña.</p> : <><label htmlFor="recovery-email">Email</label><input className={accessInputClass} id="recovery-email" name="email" type="email" autoComplete="email" spellCheck={false} maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /><button className={accessButtonClass} disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</button></>}
    {error ? <p role="alert">{error}</p> : null}<LoginLink />
  </form></AuthLayout>
}

export function PasswordResetPage() {
  const { token } = useEmailLink()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [validation, setValidation] = useState('')
  const [updated, setUpdated] = useState(false)
  const { busy, error, run } = useAccessOperation()
  return <AuthLayout><form className="flex flex-col gap-5" noValidate onSubmit={(event) => {
    event.preventDefault()
    if ([...password].length < 8 || [...password].length > 30) { setValidation('La contraseña debe tener entre 8 y 30 caracteres.'); return }
    if (password !== confirm) { setValidation('Las contraseñas no coinciden.'); return }
    setValidation('')
    void run(async (signal) => { await accessService.reset(token, password, signal); if (!signal.aborted) { setPassword(''); setConfirm(''); setUpdated(true) } })
  }}>
    <h1 className="text-3xl font-semibold">Restablecer contraseña</h1>
    {!token ? <p role="alert">El enlace no es válido. Solicitá uno nuevo.</p> : updated ? <p role="status">Contraseña actualizada. Volvé a iniciar sesión en tu aplicación.</p> : <>
      <p>Usá entre 8 y 30 caracteres. La contraseña nueva se validará al guardar.</p>
      <label htmlFor="reset-password">Nueva contraseña</label><input className={accessInputClass} id="reset-password" name="newPassword" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      <label htmlFor="reset-confirm">Confirmar contraseña</label><input className={accessInputClass} id="reset-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
      <button className={accessButtonClass} disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </>}
    {validation || error ? <p role="alert">{validation || error}</p> : null}<LoginLink />
  </form></AuthLayout>
}

export function AdminAccessConfirmPage() {
  const { token, decision } = useEmailLink()
  const [result, setResult] = useState('')
  const { busy, error, run } = useAccessOperation()
  const valid = token && (decision === 'APPROVE' || decision === 'REJECT')
  return <AuthLayout><div className="flex flex-col gap-5">
    <h1 className="text-3xl font-semibold">Confirmar decisión administrativa</h1>
    {!valid ? <p role="alert">El enlace no es válido. Revisá el correo recibido.</p> : result ? <p role="status">{result}</p> : <>
      <p>{decision === 'APPROVE' ? 'Vas a aprobar el acceso administrativo de esta solicitud.' : 'Vas a rechazar el acceso administrativo de esta solicitud.'} Confirmá para aplicar la decisión.</p>
      <button className={accessButtonClass} disabled={busy} onClick={() => void run(async (signal) => { const response = await accessService.confirm(token, decision, signal); if (!signal.aborted) setResult(response.decision === 'APPROVED' ? 'Solicitud aprobada.' : 'Solicitud rechazada.') })}>{busy ? 'Confirmando…' : decision === 'APPROVE' ? 'Confirmar aprobación' : 'Confirmar rechazo'}</button>
    </>}
    {error ? <p role="alert">{error}</p> : null}<LoginLink />
  </div></AuthLayout>
}
