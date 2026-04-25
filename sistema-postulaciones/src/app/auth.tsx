import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AUTH_KEY = 'amc.auth.session.v1'
const PENDING_CONCURSO_KEY = 'amc.auth.pendingConcurso.v1'

export type AuthSession = {
  email: string
  loggedInAtIso: string
  /** Facultad del representante (alcance del listado de fichas). */
  facultad: string
  /** Permiso para editar fichas de postulación. */
  puedeEditarFichas: boolean
}

export type PendingConcurso = {
  id: string
  fondo: string
  concurso: string
  fechaLimiteIso: string
}

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string }
  | { ok: false; needsSecondFactor: true }

type AuthContextValue = {
  session: AuthSession
  isAuthenticated: boolean
  login: (email: string, password: string, secondFactor?: string) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Sesión por defecto cuando no hay login (demostración). */
export const DEFAULT_DEMO_SESSION: AuthSession = {
  email: 'admin@uni.edu',
  loggedInAtIso: new Date().toISOString(),
  facultad: 'Ingeniería',
  puedeEditarFichas: true,
}

function normalizeSession(raw: unknown): AuthSession | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const email = typeof o.email === 'string' ? o.email : ''
  if (!email) return null
  const loggedInAtIso = typeof o.loggedInAtIso === 'string' ? o.loggedInAtIso : new Date().toISOString()
  const e = email.toLowerCase()
  const puedeEditarFichas = e === 'restringido@uni.edu' ? false : true
  const facultad = typeof o.facultad === 'string' && o.facultad ? o.facultad : 'Ingeniería'
  return { email, loggedInAtIso, facultad, puedeEditarFichas }
}

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    return normalizeSession(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeSession(s: AuthSession | null) {
  if (!s) window.localStorage.removeItem(AUTH_KEY)
  else window.localStorage.setItem(AUTH_KEY, JSON.stringify(s))
}

export function setPendingConcurso(c: PendingConcurso | null) {
  if (!c) window.localStorage.removeItem(PENDING_CONCURSO_KEY)
  else window.localStorage.setItem(PENDING_CONCURSO_KEY, JSON.stringify(c))
}

export function getPendingConcurso(): PendingConcurso | null {
  const raw = window.localStorage.getItem(PENDING_CONCURSO_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as PendingConcurso
    if (!parsed?.id || !parsed?.concurso || !parsed?.fondo || !parsed?.fechaLimiteIso) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPendingConcurso() {
  window.localStorage.removeItem(PENDING_CONCURSO_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession>(() => readSession() ?? DEFAULT_DEMO_SESSION)

  useEffect(() => {
    writeSession(session)
  }, [session])

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      isAuthenticated: true,
      login: async (email: string, password: string, secondFactor?: string) => {
        const e = email.toLowerCase().trim()
        const credOk =
          (e === 'admin@uni.edu' && password === '123456') || (e === 'restringido@uni.edu' && password === '123456')
        if (!credOk) {
          return { ok: false, message: 'Credenciales inválidas. Verifique e intente nuevamente.' }
        }
        if (secondFactor === undefined) {
          return { ok: false, needsSecondFactor: true }
        }
        if (secondFactor.trim() === '') {
          return { ok: false, message: 'Ingrese el código de doble autenticación.' }
        }
        if (secondFactor.trim() !== '000000') {
          return { ok: false, message: 'Código de doble autenticación incorrecto.' }
        }
        const puedeEditarFichas = e !== 'restringido@uni.edu'
        setSession({
          email,
          loggedInAtIso: new Date().toISOString(),
          facultad: 'Ingeniería',
          puedeEditarFichas,
        })
        return { ok: true }
      },
      logout: () => {
        writeSession(null)
        setSession(DEFAULT_DEMO_SESSION)
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
