import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input, Label, Select } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { setPendingConcurso, useAuth } from '../app/auth'
import './ConcursosDisponibles.css'

type ConcursoEstado = 'ACTIVO' | 'PROXIMO' | 'CERRADO'

type Concurso = {
  id: string
  fondo: string
  concurso: string
  fechaInicioIso: string
  fechaLimiteIso: string
  basesUrl?: string
}

export type ConcursoSeleccionado = Pick<Concurso, 'id' | 'fondo' | 'concurso' | 'fechaLimiteIso'>

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function businessDaysUntil(from: Date, to: Date) {
  const start = startOfDay(from)
  const end = startOfDay(to)
  if (Number.isNaN(end.getTime())) return null
  if (end <= start) return 0

  let days = 0
  const cur = new Date(start)
  while (cur < end) {
    cur.setDate(cur.getDate() + 1)
    const dow = cur.getDay() // 0 dom, 6 sáb
    if (dow !== 0 && dow !== 6) days += 1
  }
  return days
}

function getEstado(now: Date, c: Concurso): ConcursoEstado {
  const ini = new Date(c.fechaInicioIso)
  const fin = new Date(c.fechaLimiteIso)
  if (!Number.isNaN(fin.getTime()) && startOfDay(fin) < startOfDay(now)) return 'CERRADO'
  if (!Number.isNaN(ini.getTime()) && startOfDay(ini) > startOfDay(now)) return 'PROXIMO'
  return 'ACTIVO'
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
}

const SEIS_DIAS_HABILES = 6
const PAGE_SIZE = 6

const concursosMock: Concurso[] = [
  {
    id: 'c1',
    fondo: 'Fondo Concursable Innovación 2026',
    concurso: 'Innovación Educativa – I',
    fechaInicioIso: '2026-04-01',
    fechaLimiteIso: '2026-05-30',
    basesUrl: '#',
  },
  {
    id: 'c2',
    fondo: 'Fondo Concursable Investigación 2026',
    concurso: 'I+D Aplicada – Convocatoria A',
    fechaInicioIso: '2026-04-15',
    fechaLimiteIso: '2026-05-05',
    basesUrl: '#',
  },
  {
    id: 'c3',
    fondo: 'Fondo Concursable Equipamiento 2026',
    concurso: 'Infraestructura – Laboratorios',
    fechaInicioIso: '2026-03-01',
    fechaLimiteIso: '2026-04-10',
    basesUrl: '#',
  },
  {
    id: 'c4',
    fondo: 'Fondo Concursable Vinculación 2026',
    concurso: 'Transferencia Tecnológica – I',
    fechaInicioIso: '2026-06-01',
    fechaLimiteIso: '2026-07-10',
    basesUrl: '#',
  },
  {
    id: 'c5',
    fondo: 'Fondo Concursable Sostenibilidad 2026',
    concurso: 'Campus Sostenible – I',
    fechaInicioIso: '2026-04-10',
    fechaLimiteIso: '2026-04-29',
    basesUrl: '#',
  },
  {
    id: 'c6',
    fondo: 'Fondo Concursable TIC 2026',
    concurso: 'Transformación Digital – I',
    fechaInicioIso: '2026-04-01',
    fechaLimiteIso: '2026-06-20',
    basesUrl: '#',
  },
  {
    id: 'c7',
    fondo: 'Fondo Concursable Investigación 2026',
    concurso: 'I+D+i+TT – Convocatoria B',
    fechaInicioIso: '2026-04-20',
    fechaLimiteIso: '2026-04-28',
    basesUrl: '#',
  },
  {
    id: 'c8',
    fondo: 'Fondo Concursable Regional 2026',
    concurso: 'Proyectos con impacto regional – I',
    fechaInicioIso: '2026-05-01',
    fechaLimiteIso: '2026-05-25',
    basesUrl: '#',
  },
  {
    id: 'c9',
    fondo: 'Fondo Concursable Cooperación 2026',
    concurso: 'Alianzas estratégicas – I',
    fechaInicioIso: '2026-04-05',
    fechaLimiteIso: '2026-05-15',
    basesUrl: '#',
  },
  {
    id: 'c10',
    fondo: 'Fondo Concursable Innovación 2026',
    concurso: 'Prototipado y validación – I',
    fechaInicioIso: '2026-04-01',
    fechaLimiteIso: '2026-04-27',
    basesUrl: '#',
  },
  {
    id: 'c11',
    fondo: 'Fondo Concursable Equipamiento 2026',
    concurso: 'Adquisición de equipamiento – II',
    fechaInicioIso: '2026-05-15',
    fechaLimiteIso: '2026-06-05',
    basesUrl: '#',
  },
  {
    id: 'c12',
    fondo: 'Fondo Concursable Calidad 2026',
    concurso: 'Acreditación y mejora continua – I',
    fechaInicioIso: '2026-03-20',
    fechaLimiteIso: '2026-05-02',
    basesUrl: '#',
  },
]

export function ConcursosDisponibles() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [page, setPage] = useState(1)
  const [filtro, setFiltro] = useState<'TODOS' | ConcursoEstado>('TODOS')
  const [q, setQ] = useState('')

  const now = new Date()

  const enriched = useMemo(() => {
    return concursosMock.map((c) => {
      const estado = getEstado(now, c)
      const diasHabilesRestantes = businessDaysUntil(now, new Date(c.fechaLimiteIso))
      const fueraDePlazo =
        estado !== 'CERRADO' && diasHabilesRestantes !== null && diasHabilesRestantes < SEIS_DIAS_HABILES
      const postularDisabled = estado === 'CERRADO' || fueraDePlazo
      return { c, estado, diasHabilesRestantes, fueraDePlazo, postularDisabled }
    })
  }, [now])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return enriched
      .filter(({ estado }) => (filtro === 'TODOS' ? true : estado === filtro))
      .filter(({ c }) => {
        if (!query) return true
        return `${c.fondo} ${c.concurso}`.toLowerCase().includes(query)
      })
  }, [enriched, filtro, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function onPrev() {
    setPage((p) => Math.max(1, p - 1))
  }
  function onNext() {
    setPage((p) => Math.min(totalPages, p + 1))
  }

  function estadoBadge(estado: ConcursoEstado) {
    if (estado === 'ACTIVO') return <Badge variant="success">Activo</Badge>
    if (estado === 'PROXIMO') return <Badge variant="warning">Próximo</Badge>
    return <Badge variant="danger">Cerrado</Badge>
  }

  return (
    <div className="cd-page space-y-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Concursos disponibles</h1>
          <p className="mt-1 text-sm text-black/60">Seleccione un concurso para descargar bases o iniciar la postulación.</p>
        </div>
        <div className="cd-toolbar">
          <div className="cd-field">
            <Label>Buscar</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por fondo o concurso..." />
          </div>
          <div className="cd-field">
            <Label>Estado</Label>
            <Select
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value as 'TODOS' | ConcursoEstado)
                setPage(1)
              }}
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="PROXIMO">Próximo</option>
              <option value="CERRADO">Cerrado</option>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Total</span>
                  <Badge variant="default">{filtered.length}</Badge>
                </div>
                <div className="rounded-xl bg-black/5 p-3 text-xs text-black/60">
                  El botón <strong>Postular</strong> se deshabilita si el concurso está cerrado o si faltan menos de{' '}
                  <strong>6 días hábiles</strong> para la fecha límite.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      <div className="grid grid-cols-1 gap-5">
        <div className="space-y-5">
          <div className="cd-grid">
            {pageItems.map(({ c, estado, diasHabilesRestantes, fueraDePlazo, postularDisabled }) => (
              <Card key={c.id} className="cd-card">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="cd-card-title">{c.concurso}</CardTitle>
                      <div className="mt-1 text-xs text-black/55">{c.fondo}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {estadoBadge(estado)}
                      {fueraDePlazo ? <Badge variant="warning">Fuera de plazo</Badge> : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="cd-meta">
                    <div className="cd-meta-item">
                      <span className="cd-meta-label">Fecha límite</span>
                      <span className="cd-meta-value">{fmtDate(c.fechaLimiteIso)}</span>
                    </div>
                    <div className="cd-meta-item">
                      <span className="cd-meta-label">Días hábiles restantes</span>
                      <span className="cd-meta-value">
                        {diasHabilesRestantes === null ? '—' : String(diasHabilesRestantes)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        // Simulación de descarga
                        // eslint-disable-next-line no-console
                        console.log('Descargar bases:', c.basesUrl ?? '(mock)', c)
                      }}
                    >
                      Descargar bases
                    </Button>
                    <Button
                      type="button"
                      disabled={postularDisabled}
                      onClick={() =>
                        (() => {
                          const payload: ConcursoSeleccionado = {
                            id: c.id,
                            fondo: c.fondo,
                            concurso: c.concurso,
                            fechaLimiteIso: c.fechaLimiteIso,
                          }

                          // Persistimos intención + concurso para sobrevivir al login
                          setPendingConcurso(payload)

                          if (!isAuthenticated) {
                            toast({
                              title: 'Debe iniciar sesión para postular',
                              message: 'Inicie sesión para continuar con la postulación.',
                              variant: 'default',
                            })
                            navigate('/login', {
                              replace: false,
                              state: { intent: 'postular', concursoSeleccionado: payload },
                            })
                            return
                          }

                          navigate('/postulacion', { state: { concursoSeleccionado: payload } })
                        })()
                      }
                      title={
                        estado === 'CERRADO'
                          ? 'Concurso cerrado'
                          : fueraDePlazo
                            ? 'No se permite postular con menos de 6 días hábiles'
                            : 'Postular'
                      }
                    >
                      Postular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="cd-pagination">
            <Button type="button" variant="secondary" onClick={onPrev} disabled={safePage <= 1}>
              Anterior
            </Button>
            <div className="cd-page-indicator">
              Página <strong>{safePage}</strong> de <strong>{totalPages}</strong>
            </div>
            <Button type="button" variant="secondary" onClick={onNext} disabled={safePage >= totalPages}>
              Siguiente
            </Button>
          </div>
        </div>

        
      </div>
    </div>
  )
}

