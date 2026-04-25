import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { ActualizarAdjudicacionPage } from './pages/ActualizarAdjudicacionPage'
import { ActualizarAsociacionPage } from './pages/ActualizarAsociacionPage'
import { RequireAuth } from './components/auth/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/postulaciones/:id/asociacion"
          element={
            <RequireAuth>
              <ActualizarAsociacionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/postulaciones/:id/adjudicacion"
          element={
            <RequireAuth>
              <ActualizarAdjudicacionPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
