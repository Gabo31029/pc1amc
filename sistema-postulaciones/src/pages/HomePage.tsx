import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { listPostulaciones } from '../app/storage'
import { Badge } from '../components/ui/Badge'

function estadoBadge(estado: string) {
  if (estado === 'BORRADOR') return <Badge> Borrador </Badge>
  if (estado === 'ENVIADO_PARA_EVALUACION') return <Badge variant="info"> Enviado </Badge>
  if (estado === 'OBSERVADO') return <Badge variant="warning"> Observado </Badge>
  if (estado === 'ADJUDICADO') return <Badge variant="success"> Adjudicado </Badge>
  if (estado === 'CONVENIO_FORMALIZADO') return <Badge variant="default"> Formalizado </Badge>
  return <Badge>{estado}</Badge>
}

export function HomePage() {
  const items = listPostulaciones()

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Sistema de Postulaciones</h1>
          <p className="mt-1 text-sm text-black/60">
            Demo funcional con estados, versionado y documentos.
          </p>
        </div>
        <Link to="/postulaciones/nueva">
          <Button>Crear nueva ficha</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado (demo)</CardTitle>
          <CardDescription>
            Selecciona una ficha para actualizar asociación o adjudicación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-black/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/5 text-xs text-black/60">
                <tr>
                  <th className="px-3 py-2">Código</th>
                  <th className="px-3 py-2">Proyecto</th>
                  <th className="px-3 py-2">Facultad</th>
                  <th className="px-3 py-2">Fondo</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-t border-black/10">
                    <td className="px-3 py-2 font-medium">{p.codigo}</td>
                    <td className="px-3 py-2">{p.proyectoNombre}</td>
                    <td className="px-3 py-2">{p.facultad}</td>
                    <td className="px-3 py-2">{p.fondo}</td>
                    <td className="px-3 py-2">{estadoBadge(p.estado)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/postulaciones/${p.id}/asociacion`}>
                          <Button variant="secondary" size="sm">
                            Asociación
                          </Button>
                        </Link>
                        <Link to={`/postulaciones/${p.id}/adjudicacion`}>
                          <Button variant="secondary" size="sm">
                            Adjudicación
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

