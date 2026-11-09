import { useEffect, useState } from 'react'
import { accessService } from '../../services/services'
import type { AdminAccessChallenge } from '../../types/access'
import { accessButtonClass, accessInputClass, useAccessOperation } from './access-ui'

export function RegistrationChallenge({ initial }: { initial: AdminAccessChallenge }) {
  const [challenge, setChallenge] = useState(initial)
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const { busy, error, run } = useAccessOperation()
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const remaining = Math.max(0, Math.ceil((Date.parse(challenge.resendAvailableAt) - now) / 1000))
  if (submitted) return <div role="status" className="flex flex-col gap-4"><h1 className="text-3xl font-semibold">Solicitud pendiente de aprobación</h1><p>{submitted}</p><p>La solicitud no habilita el acceso administrativo.</p></div>
  return <form className="flex flex-col gap-5" onSubmit={(event) => { event.preventDefault(); if (/^\d{6}$/.test(code)) void run(async (signal) => { const result = await accessService.verify(challenge.challengeId, code, signal); if (!signal.aborted) setSubmitted(result.message) }) }}>
    <h1 className="text-3xl font-semibold">Verificá tu email</h1>
    <p>{challenge.message}</p>
    <label htmlFor="registration-code">Código de verificación</label>
    <input id="registration-code" name="code" className={accessInputClass} value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" spellCheck={false} required pattern="[0-9]{6}" maxLength={6} />
    <p>Ingresá los seis dígitos recibidos. El código tiene una vigencia limitada.</p>
    {error ? <p role="alert">{error}</p> : null}
    <button className={accessButtonClass} disabled={busy} type="submit">{busy ? 'Procesando…' : 'Verificar email'}</button>
    <button className={accessButtonClass} disabled={busy || remaining > 0} type="button" onClick={() => void run(async (signal) => { const next = await accessService.resend(challenge.challengeId, signal); if (!signal.aborted) { setChallenge(next); setCode(''); setNow(Date.now()) } })}>{remaining > 0 ? `Reenviar código en ${remaining} s` : 'Reenviar código'}</button>
  </form>
}
