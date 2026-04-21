import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'

function labelFor(seg: string) {
  const map: Record<string, string> = {
    postulaciones: 'Postulaciones',
    nueva: 'Nueva ficha',
    seguimiento: 'Seguimiento',
    asociacion: 'Asociación',
    adjudicacion: 'Adjudicación',
  }
  return map[seg] ?? seg
}

export function Breadcrumbs({ className }: { className?: string }) {
  const loc = useLocation()
  const segments = loc.pathname.split('/').filter(Boolean)

  const parts = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isLast = i === segments.length - 1
    const text = labelFor(seg)
    return { href, text, isLast }
  })

  return (
    <nav className={cn('text-xs text-black/50', className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link className="hover:text-black/70" to="/">
            Inicio
          </Link>
        </li>
        {parts.map((p) => (
          <li key={p.href} className="flex items-center gap-1">
            <span className="text-black/30">/</span>
            {p.isLast ? (
              <span className="text-black/60">{p.text}</span>
            ) : (
              <Link className="hover:text-black/70" to={p.href}>
                {p.text}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

