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

type LocationState = { from?: { pathname?: string } }

export function LoginPage() {
  const { toast } = useToast()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const state = (location.state as (LocationState & { intent?: string; concursoSeleccionado?: ConcursoSeleccionado }) | null) ?? null
  const from = state?.from?.pathname ?? '/concursos'
  const intent = state?.intent
  const concursoFromState = state?.concursoSeleccionado

  useEffect(() => {
    if (intent === 'postular') {
      toast({
        title: 'Debe iniciar sesión para postular',
        message: 'Inicie sesión para continuar con la postulación.',
        variant: 'default',
      })
    }
    if (concursoFromState) setPendingConcurso(concursoFromState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })

  const errors = useMemo(() => {
    const res = schema.safeParse({ email, password })
    if (res.success) return {}
    const out: Record<string, string> = {}
    for (const issue of res.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      out[key] = issue.message
    }
    return out
  }, [email, password])

  const canSubmit = !loading && !errors.email && !errors.password

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ email: true, password: true })

    if (!canSubmit) {
      toast({ title: 'Campos incompletos', message: 'Revise los datos del formulario.', variant: 'danger' })
      return
    }

    try {
      setLoading(true)
      const res = await login(email, password)
      if (!res.ok) {
        toast({ title: 'No se pudo iniciar sesión', message: res.message, variant: 'danger' })
        return
      }
      toast({ title: 'Sesión iniciada', message: 'Bienvenido(a).', variant: 'success' })
      const pending = concursoFromState ?? getPendingConcurso()
      if (pending) {
        clearPendingConcurso()
        navigate('/postulacion', { replace: true, state: { concursoSeleccionado: pending } })
      } else {
        navigate(from, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticated) {
    navigate('/concursos', { replace: true })
    return null
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <div className="mt-1 text-sm text-black/60">Acceso al sistema de postulación (demo).</div>
        </CardHeader>
        <CardContent>
          <form className="login-form" onSubmit={onSubmit}>
            <div className="login-field">
              <Label>Correo electrónico</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="admin@uni.edu"
                autoComplete="email"
              />
              {touched.email && errors.email ? <div className="login-error">{errors.email}</div> : null}
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
              {touched.password && errors.password ? <div className="login-error">{errors.password}</div> : null}
            </div>

            <div className="login-actions">
              <Button type="submit" disabled={!canSubmit}>
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </Button>
              <div className="login-hint">
                Credenciales demo: <strong>admin@uni.edu</strong> / <strong>123456</strong>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

