import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { uiEstadoPostulacion } from '../app/postulacionPresentacion'
import { listPostulaciones } from '../app/storage'
import { useAuth } from '../app/auth'

export function HomePage() {
  const { session } = useAuth()
  const items = listPostulaciones()

  const deLaFacultad = useMemo(
    () => items.filter((p) => p.facultad === session?.facultad).sort((a, b) => b.fechaRegistroIso.localeCompare(a.fechaRegistroIso)),
    [items, session?.facultad],
  )

  const pageSize = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(deLaFacultad.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const rows = deLaFacultad.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (!session?.puedeEditarFichas) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Acceso a fichas</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error de acceso</CardTitle>
            <CardDescription>No tiene permisos para editar fichas de postulación.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-black/70">
              El sistema validó sus credenciales, pero su perfil no autoriza esta operación. Cierre sesión o contacte
              a la administración.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Fichas de postulación de la Facultad</h1>
        <p className="mt-1 text-sm text-black/60">
          Facultad: <span className="font-medium text-black/80">{session.facultad}</span>. Listado paginado (10 por
          página).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fichas registradas</CardTitle>
          <CardDescription>Seleccione la ficha del proyecto a actualizar.</CardDescription>
        </CardHeader>
        <CardContent>
          {deLaFacultad.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white/60 p-4 text-sm text-black/60">
              No hay fichas registradas para esta facultad.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-black/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/5 text-xs text-black/60">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Proyecto</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const est = uiEstadoPostulacion(p.estado)
                      return (
                      <tr key={p.id} className="border-t border-black/10">
                        <td className="px-3 py-2 font-medium">{p.codigo}</td>
                        <td className="px-3 py-2">{p.proyectoNombre}</td>
                        <td className="px-3 py-2">
                          <Badge variant={est.variant} className="font-normal">
                            {est.label}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Link to={`/postulaciones/${p.id}/asociacion`}>
                            <Button variant="secondary" size="sm">
                              Seleccionar
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-black/60">
                <span>
                  {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, deLaFacultad.length)} de{' '}
                  {deLaFacultad.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage((x) => x - 1)}>
                    Anterior
                  </Button>
                  <span>
                    Página {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((x) => x + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
