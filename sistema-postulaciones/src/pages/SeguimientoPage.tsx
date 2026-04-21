import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { listPostulaciones } from '../app/storage'
import { exportToXlsx } from '../lib/exportExcel'

function docStatusForRow(row: { adjuntos: { tipo: string }[] }) {
  const hasOblig = row.adjuntos.some((d) => d.tipo === 'OBLIGATORIO')
  if (!hasOblig) return { label: 'No presentados', variant: 'danger' as const }
  return { label: 'Completos', variant: 'success' as const }
}

export function SeguimientoPage() {
  const { toast } = useToast()
  const items = listPostulaciones()

  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [fondo, setFondo] = useState('')
  const [facultad, setFacultad] = useState('')
  const [page, setPage] = useState(1)

  const fondos = useMemo(() => Array.from(new Set(items.map((x) => x.fondo))).sort(), [items])
  const facultades = useMemo(() => Array.from(new Set(items.map((x) => x.facultad))).sort(), [items])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return items
      .filter((x) =>
        qq
          ? x.codigo.toLowerCase().includes(qq) || x.proyectoNombre.toLowerCase().includes(qq)
          : true,
      )
      .filter((x) => (estado ? x.estado === estado : true))
      .filter((x) => (fondo ? x.fondo === fondo : true))
      .filter((x) => (facultad ? x.facultad === facultad : true))
      .sort((a, b) => b.fechaRegistroIso.localeCompare(a.fechaRegistroIso))
  }, [items, q, estado, fondo, facultad])

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  async function onExport() {
    try {
      const data = filtered.map((p) => {
        const ds = docStatusForRow(p)
        return {
          codigo: p.codigo,
          proyecto: p.proyectoNombre,
          facultad: p.facultad,
          fondo: p.fondo,
          estado: p.estado,
          fechaRegistro: format(new Date(p.fechaRegistroIso), 'yyyy-MM-dd HH:mm'),
          documentos: ds.label,
        }
      })

      await exportToXlsx(
        `seguimiento_postulaciones.xlsx`,
        'Seguimiento',
        [
          { header: 'Código', key: 'codigo', width: 16 },
          { header: 'Proyecto', key: 'proyecto', width: 40 },
          { header: 'Facultad', key: 'facultad', width: 20 },
          { header: 'Fondo', key: 'fondo', width: 24 },
          { header: 'Estado', key: 'estado', width: 22 },
          { header: 'Fecha registro', key: 'fechaRegistro', width: 22 },
          { header: 'Documentos', key: 'documentos', width: 18 },
        ],
        data,
      )

      toast({ title: 'Exportación lista', message: 'Excel generado correctamente.', variant: 'success' })
    } catch (e) {
      toast({
        title: 'Fallo de exportación',
        message: e instanceof Error ? e.message : 'No se pudo generar el Excel.',
        variant: 'danger',
      })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-black/50">Comité de Evaluación</div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Seguimiento de postulaciones</h1>
        <p className="mt-1 text-sm text-black/60">
          Bandeja para revisar trazabilidad y estado documental sin ingresar al detalle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Buscar (código o proyecto)</Label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="AMC-2026-0001 / nombre..." />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ENVIADO_PARA_EVALUACION">Enviado</option>
                <option value="OBSERVADO">Observado</option>
                <option value="ADJUDICADO">Adjudicado</option>
                <option value="CONVENIO_FORMALIZADO">Formalizado</option>
              </Select>
            </div>
            <div>
              <Label>Fondo</Label>
              <Select value={fondo} onChange={(e) => setFondo(e.target.value)}>
                <option value="">Todos</option>
                {fondos.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Facultad</Label>
              <Select value={facultad} onChange={(e) => setFacultad(e.target.value)}>
                <option value="">Todas</option>
                {facultades.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3" />
            <div className="flex items-end justify-end">
              <Button variant="secondary" onClick={onExport}>
                Descargar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white/60 p-5 text-sm text-black/60">
              No existen postulaciones registradas con los filtros actuales.
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-black/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/5 text-xs text-black/60">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Proyecto</th>
                      <th className="px-3 py-2">Facultad</th>
                      <th className="px-3 py-2">Fondo</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Fecha registro</th>
                      <th className="px-3 py-2">Documentos</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const ds = docStatusForRow(p)
                      return (
                        <tr key={p.id} className="border-t border-black/10">
                          <td className="px-3 py-2 font-medium">{p.codigo}</td>
                          <td className="px-3 py-2">{p.proyectoNombre}</td>
                          <td className="px-3 py-2">{p.facultad}</td>
                          <td className="px-3 py-2">{p.fondo}</td>
                          <td className="px-3 py-2">
                            <Badge variant={p.estado === 'ADJUDICADO' ? 'success' : 'info'}>
                              {p.estado}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-black/60">
                            {format(new Date(p.fechaRegistroIso), 'yyyy-MM-dd HH:mm')}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={ds.variant}>{ds.label}</Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-black/50">
                            Ver detalle (en progreso)
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-black/60">
                <div>
                  Mostrando {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </Button>
                  <span>
                    Página {currentPage} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

