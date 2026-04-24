import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Label } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { clearPendingConcurso, getPendingConcurso, setPendingConcurso, useAuth } from '../app/auth'
import { type ConcursoSeleccionado } from './ConcursosDisponibles'
import './LoginPage.css'

const schema = z.object({
  email: z.string().min(1, 'Ingrese el correo').email('Ingrese un correo válido'),
  password: z.string().min(1, 'Ingrese la contraseña'),
})

const schemaOtp = z.object({
  otp: z.string().min(6, 'Ingrese el código de 6 dígitos').max(6),
})

type LocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const { toast } = useToast()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const state =
    (location.state as (LocationState & { intent?: string; concursoSeleccionado?: ConcursoSeleccionado }) | null) ??
    null
  const from = state?.from?.pathname ?? '/'
  const intent = state?.intent
  const concursoFromState = state?.concursoSeleccionado

  useEffect(() => {
    if (intent === 'postular') {
      toast({
        title: 'Debe iniciar sesión',
        message: 'Inicie sesión para continuar.',
        variant: 'default',
      })
    }
    if (concursoFromState) setPendingConcurso(concursoFromState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [fase, setFase] = useState<'credenciales' | 'doble_autenticacion'>('credenciales')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean; otp: boolean }>({
    email: false,
    password: false,
    otp: false,
  })

  const errorsCred = useMemo(() => {
    const res = schema.safeParse({ email, password })
    if (res.success) return {}
    const out: Record<string, string> = {}
    for (const issue of res.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      out[key] = issue.message
    }
    return out
  }, [email, password])

  const errorsOtp = useMemo(() => {
    const res = schemaOtp.safeParse({ otp })
    if (res.success) return {}
    const out: Record<string, string> = {}
    for (const issue of res.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      out[key] = issue.message
    }
    return out
  }, [otp])

  const canSubmitCred = !loading && !errorsCred.email && !errorsCred.password
  const canSubmitOtp = !loading && !errorsOtp.otp

  async function onSubmitCredenciales(e: React.FormEvent) {
    e.preventDefault()
    setTouched((t) => ({ ...t, email: true, password: true }))
    if (!canSubmitCred) {
      toast({ title: 'Campos incompletos', message: 'Revise correo y contraseña.', variant: 'danger' })
      return
    }
    try {
      setLoading(true)
      const res = await login(email, password)
      if (!res.ok && 'needsSecondFactor' in res && res.needsSecondFactor) {
        setFase('doble_autenticacion')
        toast({
          title: 'Doble autenticación',
          message: 'Ingrese el código de verificación.',
          variant: 'default',
        })
        return
      }
      if (!res.ok) {
        const msg = 'message' in res ? res.message : 'Error de autenticación.'
        toast({ title: 'Autenticación', message: msg, variant: 'danger' })
        return
      }
      const pending = concursoFromState ?? getPendingConcurso()
      if (pending) clearPendingConcurso()
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmitOtp(e: React.FormEvent) {
    e.preventDefault()
    setTouched((t) => ({ ...t, otp: true }))
    if (!canSubmitOtp) {
      toast({ title: 'Código incompleto', message: 'Ingrese los 6 dígitos.', variant: 'danger' })
      return
    }
    try {
      setLoading(true)
      const res = await login(email, password, otp)
      if (!res.ok) {
        toast({ title: 'Autenticación', message: 'message' in res ? res.message : 'Error', variant: 'danger' })
        return
      }
      toast({ title: 'Sesión iniciada', message: 'Credenciales y doble autenticación validadas.', variant: 'success' })
      const pending = concursoFromState ?? getPendingConcurso()
      if (pending) clearPendingConcurso()
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <div className="mt-1 text-sm text-black/60">
            Acceso al sistema: validación de credenciales y doble autenticación.
          </div>
        </CardHeader>
        <CardContent>
          {fase === 'credenciales' ? (
            <form className="login-form" onSubmit={onSubmitCredenciales}>
              <div className="login-field">
                <Label>Correo electrónico</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  placeholder="admin@uni.edu"
                  autoComplete="email"
                />
                {touched.email && errorsCred.email ? <div className="login-error">{errorsCred.email}</div> : null}
              </div>

              <div className="login-field">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="123456"
                  autoComplete="current-password"
                />
                {touched.password && errorsCred.password ? (
                  <div className="login-error">{errorsCred.password}</div>
                ) : null}
              </div>

              <div className="login-actions">
                <Button type="submit" disabled={!canSubmitCred}>
                  {loading ? 'Validando...' : 'Continuar'}
                </Button>
                <div className="login-hint">
                  Demo: <strong>admin@uni.edu</strong> o <strong>restringido@uni.edu</strong> / <strong>123456</strong>
                </div>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={onSubmitOtp}>
              <div className="login-field">
                <Label>Código de doble autenticación (6 dígitos)</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={() => setTouched((t) => ({ ...t, otp: true }))}
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                {touched.otp && errorsOtp.otp ? <div className="login-error">{errorsOtp.otp}</div> : null}
              </div>
              <div className="login-actions">
                <Button type="submit" disabled={!canSubmitOtp}>
                  {loading ? 'Verificando...' : 'Verificar y acceder'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFase('credenciales')
                    setOtp('')
                  }}
                >
                  Volver a credenciales
                </Button>
                <div className="login-hint">
                  Código demo de doble factor: <strong>000000</strong>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
