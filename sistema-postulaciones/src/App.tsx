import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { RegistrarFichaPage } from './pages/RegistrarFichaPage'
import { SeguimientoPage } from './pages/SeguimientoPage'
import { ActualizarAsociacionPage } from './pages/ActualizarAsociacionPage'
import { ActualizarAdjudicacionPage } from './pages/ActualizarAdjudicacionPage'
import { ConcursosDisponibles } from './pages/ConcursosDisponibles'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/concursos" element={<ConcursosDisponibles />} />
        <Route path="/postulacion" element={<RegistrarFichaPage />} />
        <Route path="/postulaciones/nueva" element={<RegistrarFichaPage />} />
        <Route path="/postulaciones/seguimiento" element={<SeguimientoPage />} />
        <Route
          path="/postulaciones/:id/asociacion"
          element={<ActualizarAsociacionPage />}
        />
        <Route
          path="/postulaciones/:id/adjudicacion"
          element={<ActualizarAdjudicacionPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
