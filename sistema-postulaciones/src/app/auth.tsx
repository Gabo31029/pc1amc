import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AUTH_KEY = 'amc.auth.session.v1'
const PENDING_CONCURSO_KEY = 'amc.auth.pendingConcurso.v1'

export type AuthSession = {
  email: string
  loggedInAtIso: string
}

export type PendingConcurso = {
  id: string
  fondo: string
  concurso: string
  fechaLimiteIso: string
}

type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.email) return null
    return parsed
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
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  useEffect(() => {
    writeSession(session)
  }, [session])

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      isAuthenticated: !!session,
      login: async (email: string, password: string) => {
        // Auth simulada (hardcode)
        const ok = email.toLowerCase() === 'admin@uni.edu' && password === '123456'
        if (!ok) return { ok: false, message: 'Credenciales inválidas. Verifique correo y contraseña.' }
        setSession({ email, loggedInAtIso: new Date().toISOString() })
        return { ok: true }
      },
      logout: () => setSession(null),
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

