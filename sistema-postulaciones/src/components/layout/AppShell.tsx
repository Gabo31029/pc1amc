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
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-[color:var(--inst-primary)] text-white shadow-sm'
            : 'text-black/70 hover:bg-black/[0.06]',
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
  const { session, logout } = useAuth()

  return (
    <div className="inst-app flex min-h-screen flex-col bg-[color:var(--inst-page-bg)] text-[color:var(--inst-page-fg)]">
      <header
        className="z-40 shrink-0 border-b border-black/10 shadow-sm"
        style={{ background: 'var(--inst-bar-bg)', color: 'var(--inst-bar-fg)' }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2 no-underline opacity-95 hover:opacity-100">
            <div
              className="grid h-9 w-9 place-items-center rounded-lg text-white shadow-sm"
              style={{ background: 'var(--inst-primary-hover)' }}
            >
              <Building2 size={18} />
            </div>
            <div className="leading-tight" style={{ color: 'var(--inst-bar-fg)' }}>
              <div className="text-sm font-semibold tracking-[-0.02em]">Gestión de Proyectos Concursables</div>
              <div className="text-xs" style={{ color: 'var(--inst-bar-fg-muted)' }}>
                Módulo de Postulaciones
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-xs" style={{ color: 'var(--inst-bar-fg-muted)' }}>
              Sesión: {session.email}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="border-white/25 bg-white/10 text-white backdrop-blur hover:bg-white/20"
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="inst-app__main">
        <div className="inst-app__main-inner">
          <main className="mx-auto grid max-w-[1200px] grid-cols-[260px_1fr] gap-5 px-5 py-6">
            <aside
              className="h-fit rounded-[10px] border bg-[color:var(--inst-card-bg)] p-3"
              style={{ borderColor: 'var(--inst-card-border)', boxShadow: 'var(--inst-card-shadow)' }}
            >
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
      </div>

      <footer
        className="shrink-0 py-3 text-center text-xs"
        style={{ background: 'var(--inst-bar-bg)', color: 'var(--inst-bar-fg-muted)' }}
      >
        <span className="opacity-90">Todos los derechos reservados</span>
      </footer>
    </div>
  )
}
