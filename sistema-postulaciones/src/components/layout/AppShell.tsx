import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Building2, Rows3 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Breadcrumbs } from './Breadcrumbs'
import { Button } from '../ui/Button'
import { useAuth } from '../../app/auth'

function NavItem({
  to,
  icon,
  label,
}: {
  to: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
          isActive ? 'bg-black text-white shadow-sm' : 'text-black/70 hover:bg-black/5',
        )
      }
    >
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const navigate = useNavigate()
  const { isAuthenticated, session, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/65 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white shadow-sm">
              <Building2 size={18} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-[-0.02em]">
                Gestión de Proyectos Concursables
              </div>
              <div className="text-xs text-black/50">Módulo de Postulaciones</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-xs text-black/50">
              {isAuthenticated ? `Sesión: ${session?.email}` : 'Sesión: no autenticado'}
            </div>
            {isAuthenticated ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  logout()
                  navigate('/login', { replace: true })
                }}
              >
                Cerrar sesión
              </Button>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/login')}>
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1200px] grid-cols-[260px_1fr] gap-5 px-5 py-6">
        <aside className="h-fit rounded-2xl border border-black/10 bg-white/55 p-3 shadow-sm backdrop-blur">
          <div className="px-3 pb-2 text-xs font-semibold text-black/50">Navegación</div>
          <div className="flex flex-col gap-1">
            <NavItem to="/" icon={<Rows3 size={18} />} label="Fichas de la Facultad" />
          </div>
        </aside>

        <section className="min-w-0">
          <Breadcrumbs />
          <div className="mt-3">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  )
}

