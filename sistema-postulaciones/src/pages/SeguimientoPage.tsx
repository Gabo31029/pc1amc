import { Fragment, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input, Label, Select } from '../components/ui/Field'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { listPostulaciones } from '../app/storage'
import { etiquetaEstadoPostulacion, uiEstadoPostulacion } from '../app/postulacionPresentacion'
import { type Postulacion } from '../app/types'

type DocEstado = 'COMPLETO' | 'INCOMPLETO' | 'NO_PRESENTADO' | 'NO_DISPONIBLE' | 'NO_APLICA'

function badgeForDocEstado(estado: DocEstado) {
  if (estado === 'COMPLETO') return { label: 'Completo', variant: 'success' as const }
  if (estado === 'INCOMPLETO') return { label: 'Incompleto', variant: 'warning' as const }
  if (estado === 'NO_PRESENTADO') return { label: 'No presentado', variant: 'danger' as const }
  if (estado === 'NO_DISPONIBLE') return { label: 'No disponible', variant: 'default' as const }
  return { label: 'No aplica', variant: 'default' as const }
}

function fichaDotClass(estado: DocEstado) {
  if (estado === 'COMPLETO') return 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
  if (estado === 'INCOMPLETO') return 'bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]'
  if (estado === 'NO_PRESENTADO') return 'bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]'
  if (estado === 'NO_DISPONIBLE') return 'bg-black/30 shadow-[0_0_0_4px_rgba(0,0,0,0.08)]'
  return 'bg-black/15 shadow-[0_0_0_4px_rgba(0,0,0,0.06)]'
}

function FichaIndicators({
  postulacion,
  asociacion,
  adjudicacion,
}: {
  postulacion: DocEstado
  asociacion: DocEstado
  adjudicacion: DocEstado
}) {
  const items: { key: string; letter: string; title: string; estado: DocEstado }[] = [
    { key: 'P', letter: 'P', title: 'Ficha de postulación', estado: postulacion },
    { key: 'A', letter: 'A', title: 'Ficha para asociación', estado: asociacion },
    { key: 'J', letter: 'J', title: 'Ficha para adjudicación', estado: adjudicacion },
  ]

  return (
    <div className="flex items-center gap-2">
      {items.map((it) => (
        <div
          key={it.key}
          className="group relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white/70 shadow-sm backdrop-blur"
          title={`${it.title}: ${badgeForDocEstado(it.estado).label}`}
        >
          <div className="text-[11px] font-semibold tracking-[-0.02em] text-black/70">{it.letter}</div>
          <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${fichaDotClass(it.estado)}`} />
        </div>
      ))}
    </div>
  )
}

function hasAdjunto(p: Postulacion, tipo: Postulacion['adjuntos'][number]['tipo']) {
  return p.adjuntos.some((d) => d.tipo === tipo)
}

function requiredPostulacionTipos(p: Postulacion) {
  const tipos: Postulacion['adjuntos'][number]['tipo'][] = [
    'CARTA_PRESENTACION',
    'CARTA_COMPROMISO_FACULTAD',
    'INFORME_TECNICO_POSTULACION',
  ]
  if (p.incluyeInfraestructura) tipos.push('INFORME_TECNICO_GRUPO_TECNICO')
  if (p.incluyeIDiTT) tipos.push('VALIDACION_GRUPO_INVESTIGACION')
  if (p.tieneEntidadAsociada || p.tipoParticipacion === 'ASOCIADO') tipos.push('FICHA_ASOCIACION')
  return tipos
}

function estadoDocumentacionPostulacion(p: Postulacion): DocEstado {
  const req = requiredPostulacionTipos(p)
  const presentes = req.filter((t) => hasAdjunto(p, t))
  if (presentes.length === 0) return 'NO_PRESENTADO'
  if (presentes.length < req.length) return 'INCOMPLETO'
  return 'COMPLETO'
}

function estadoFichaPostulacion(p: Postulacion, sim: SimFlags): DocEstado {
  if (sim.fichaPostulacionNoDisponible) return 'NO_DISPONIBLE'
  return estadoDocumentacionPostulacion(p)
}

function estadoFichaAsociacion(p: Postulacion, sim: SimFlags): DocEstado {
  const aplica = p.tieneEntidadAsociada || p.tipoParticipacion === 'ASOCIADO'
  if (!aplica) return 'NO_APLICA'
  if (sim.fichaAsociacionNoDisponible) return 'NO_DISPONIBLE'
  if (hasAdjunto(p, 'FICHA_ASOCIACION')) return 'COMPLETO'
  return 'NO_PRESENTADO'
}

function estadoFichaAdjudicacion(p: Postulacion, sim: SimFlags): DocEstado {
  const aplica = p.adjudicado || p.estado === 'ADJUDICADO' || p.estado === 'EN_EVALUACION'
  if (!aplica) return 'NO_APLICA'
  if (sim.fichaAdjudicacionNoDisponible) return 'NO_DISPONIBLE'
  if (hasAdjunto(p, 'DOCUMENTO_ADJUDICACION')) return 'COMPLETO'
  return 'NO_PRESENTADO'
}

function estadoGeneralRegistro(p: Postulacion, sim: SimFlags) {
  if (sim.registroIncompleto) {
    return { label: 'Incompleto', variant: 'warning' as const }
  }
  const missingGeneral =
    !p.proyectoNombre?.trim() ||
    !p.facultad?.trim() ||
    !p.fondo?.trim() ||
    !p.concurso?.trim() ||
    !p.objetivo?.trim()
  if (missingGeneral) return { label: 'Incompleto', variant: 'warning' as const }
  return { label: 'Completo', variant: 'success' as const }
}

type SimFlags = {
  registroIncompleto: boolean
  fichaPostulacionNoDisponible: boolean
  fichaAsociacionNoDisponible: boolean
  fichaAdjudicacionNoDisponible: boolean
}

function defaultSim(): SimFlags {
  return {
    registroIncompleto: false,
    fichaPostulacionNoDisponible: false,
    fichaAsociacionNoDisponible: false,
    fichaAdjudicacionNoDisponible: false,
  }
}

export function SeguimientoPage() {
  const { toast } = useToast()
  const items = listPostulaciones()

  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [fondo, setFondo] = useState('')
  const [facultad, setFacultad] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [simById, setSimById] = useState<Record<string, SimFlags>>({})

  const [genAttempt, setGenAttempt] = useState(0)
  const [dlAttempt, setDlAttempt] = useState(0)
  const [forceGenFailOnce, setForceGenFailOnce] = useState(false)
  const [forceDlFailOnce, setForceDlFailOnce] = useState(false)

  const [generatedAtIso, setGeneratedAtIso] = useState<string | null>(null)
  const [generatedFilename, setGeneratedFilename] = useState<string | null>(null)
  const [workbookBlob, setWorkbookBlob] = useState<Blob | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [lastDownloadAtIso, setLastDownloadAtIso] = useState<string | null>(null)

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

  function simFor(id: string): SimFlags {
    return simById[id] ?? defaultSim()
  }

  function setSim(id: string, patch: Partial<SimFlags>) {
    setSimById((prev) => ({
      ...prev,
      [id]: { ...simFor(id), ...patch },
    }))
  }

  function anyFichaNoDisponible(p: Postulacion) {
    const s = simFor(p.id)
    const fp = estadoFichaPostulacion(p, s)
    const fa = estadoFichaAsociacion(p, s)
    const fj = estadoFichaAdjudicacion(p, s)
    return fp === 'NO_DISPONIBLE' || fa === 'NO_DISPONIBLE' || fj === 'NO_DISPONIBLE'
  }

  async function buildWorkbookBlob(): Promise<{ filename: string; blob: Blob }> {
    const data = filtered.map((p) => {
      const s = simFor(p.id)
      const general = estadoGeneralRegistro(p, s)
      const fp = estadoFichaPostulacion(p, s)
      const fa = estadoFichaAsociacion(p, s)
      const fj = estadoFichaAdjudicacion(p, s)
      const faltanFichas = anyFichaNoDisponible(p)

      return {
        codigo: p.codigo,
        proyecto: p.proyectoNombre,
        facultad: p.facultad,
        fondo: p.fondo,
        estadoGeneralRegistro: general.label,
        estadoFichaPostulacion: fp,
        estadoFichaAsociacion: fa,
        estadoFichaAdjudicacion: fj,
        faltanFichasNoDisponibles: faltanFichas ? 'Sí' : 'No',
        estado: etiquetaEstadoPostulacion(p.estado),
        fechaRegistro: format(new Date(p.fechaRegistroIso), 'yyyy-MM-dd HH:mm'),
        documentacionPostulacion: estadoDocumentacionPostulacion(p),
      }
    })

    // Generación en memoria (sin guardar en servidor): workbook -> Blob.
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    wb.created = new Date()
    const ws = wb.addWorksheet('Seguimiento')
    ws.columns = [
      { header: 'Código', key: 'codigo', width: 16 },
      { header: 'Proyecto', key: 'proyecto', width: 40 },
      { header: 'Facultad', key: 'facultad', width: 20 },
      { header: 'Fondo', key: 'fondo', width: 24 },
      { header: 'Estado general registro', key: 'estadoGeneralRegistro', width: 22 },
      { header: 'Estado ficha postulación', key: 'estadoFichaPostulacion', width: 22 },
      { header: 'Estado ficha asociación', key: 'estadoFichaAsociacion', width: 22 },
      { header: 'Estado ficha adjudicación', key: 'estadoFichaAdjudicacion', width: 22 },
      { header: '¿Falta info de fichas (no disponible)?', key: 'faltanFichasNoDisponibles', width: 28 },
      { header: 'Estado', key: 'estado', width: 22 },
      { header: 'Fecha registro', key: 'fechaRegistro', width: 22 },
      { header: 'Documentación postulación', key: 'documentacionPostulacion', width: 24 },
    ]
    data.forEach((r) => ws.addRow(r))
    ws.getRow(1).font = { bold: true }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const buf = await wb.xlsx.writeBuffer()
    const filename = `seguimiento_postulaciones_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    return { filename, blob: new Blob([buf]) }
  }

  async function onGenerateExcel(): Promise<{ filename: string; blob: Blob } | null> {
    setExportError(null)
    try {
      if (filtered.length === 0) {
        throw new Error('No hay postulaciones para consolidar con los filtros actuales.')
      }

      // Simula E3: fallo al generar (reintento vía botón)
      if (forceGenFailOnce) {
        setForceGenFailOnce(false)
        throw new Error('No se pudo generar el consolidado (simulación). Intente nuevamente.')
      }
      if (Math.random() < 0.08 && genAttempt === 0) {
        throw new Error('Error temporal al preparar el consolidado (simulación).')
      }

      const { filename, blob } = await buildWorkbookBlob()
      setWorkbookBlob(blob)
      setGeneratedFilename(filename)
      setGeneratedAtIso(new Date().toISOString())
      setLastDownloadAtIso(null)
      setDlAttempt(0)
      setGenAttempt((n) => n + 1)

      toast({ title: 'Excel generado', message: 'Listo para descargar.', variant: 'success' })
      return { filename, blob }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo generar el Excel.'
      setExportError(msg)
      setWorkbookBlob(null)
      setGeneratedFilename(null)
      setGeneratedAtIso(null)
      setLastDownloadAtIso(null)
      toast({ title: 'E3 · Error al generar', message: msg, variant: 'danger' })
      return null
    }
  }

  async function onDownloadExcel(blobArg?: Blob, filenameArg?: string) {
    setExportError(null)
    try {
      const blob = blobArg ?? workbookBlob
      const filename = filenameArg ?? generatedFilename
      if (!blob || !filename) {
        throw new Error('Primero debe generar el consolidado.')
      }

      if (forceDlFailOnce) {
        setForceDlFailOnce(false)
        throw new Error('Falló la descarga del archivo (simulación).')
      }
      if (Math.random() < 0.08 && dlAttempt === 0) {
        throw new Error('Falló la descarga del archivo (simulación).')
      }

      const { saveAs } = await import('file-saver')
      saveAs(blob, filename)
      setLastDownloadAtIso(new Date().toISOString())
      setDlAttempt((n) => n + 1)
      toast({ title: 'Descarga completada', message: filename, variant: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo descargar el Excel.'
      setExportError(msg)
      toast({ title: 'E4 · Error al descargar', message: msg, variant: 'danger' })
    }
  }

  async function onExportOneClick() {
    // Atajo: genera + descarga (útil), pero el flujo principal queda separado como en el diagrama.
    const built = await onGenerateExcel()
    if (built) await onDownloadExcel(built.blob, built.filename)
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
                <option value="ENVIADO_PARA_EVALUACION">Enviado a evaluación</option>
                <option value="OBSERVADO">Observado</option>
                <option value="ADJUDICADO">Adjudicado</option>
                <option value="EN_EVALUACION">En evaluación</option>
                <option value="CONVENIO_FORMALIZADO">Convenio formalizado</option>
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
            <div className="md:col-span-4 rounded-2xl border border-black/10 bg-white/55 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold">Consolidado Excel (flujo del diagrama)</div>
                  <div className="mt-1 text-xs text-black/60">
                    1) Generar · 2) Descargar · Reintentos si falla (E3/E4).
                  </div>
                  {exportError ? (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-900">
                      {exportError}
                    </div>
                  ) : null}
                  {generatedAtIso ? (
                    <div className="mt-2 text-xs text-black/50">
                      Último generado: {new Date(generatedAtIso).toLocaleString()} · {generatedFilename}
                    </div>
                  ) : null}
                  {lastDownloadAtIso ? (
                    <div className="mt-1 text-xs text-black/50">
                      Última descarga: {new Date(lastDownloadAtIso).toLocaleString()}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-black/60">
                    <input type="checkbox" checked={forceGenFailOnce} onChange={(e) => setForceGenFailOnce(e.target.checked)} />
                    Forzar fallo al generar (1 vez)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-black/60">
                    <input type="checkbox" checked={forceDlFailOnce} onChange={(e) => setForceDlFailOnce(e.target.checked)} />
                    Forzar fallo al descargar (1 vez)
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <Button variant="secondary" onClick={onGenerateExcel}>
                  Generar Excel consolidado
                </Button>
                <Button onClick={() => void onDownloadExcel()} disabled={!workbookBlob || !generatedFilename}>
                  Descargar Excel
                </Button>
                <Button variant="ghost" onClick={onExportOneClick}>
                  Generar y descargar
                </Button>
              </div>
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
              <div className="font-semibold">E1 · Sin postulaciones</div>
              <div className="mt-1">
                No existen postulaciones registradas con los filtros actuales; no se muestra contenido para el
                seguimiento.
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/40 shadow-sm backdrop-blur">
                <div className="max-h-[60vh] overflow-auto overscroll-contain">
                  <table className="min-w-[1100px] w-full table-auto text-left text-[13px] leading-snug">
                    <thead className="sticky top-0 z-10 bg-black/3 text-[11px] font-semibold uppercase tracking-wide text-black/45 backdrop-blur">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">Código</th>
                        <th className="min-w-[320px] px-4 py-3">Proyecto</th>
                        <th className="min-w-[160px] px-4 py-3">Facultad</th>
                        <th className="min-w-[220px] px-4 py-3">Fondo</th>
                        <th className="min-w-[150px] px-4 py-3">Estado registro</th>
                        <th className="min-w-[140px] px-4 py-3">Estado</th>
                        <th className="min-w-[150px] px-4 py-3">Fecha registro</th>
                        <th className="min-w-[150px] px-4 py-3">Fichas</th>
                        <th className="min-w-[150px] px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => {
                        const s = simFor(p.id)
                        const general = estadoGeneralRegistro(p, s)
                        const fp = estadoFichaPostulacion(p, s)
                        const fa = estadoFichaAsociacion(p, s)
                        const fj = estadoFichaAdjudicacion(p, s)
                        const open = !!expanded[p.id]
                        const estadoUi = uiEstadoPostulacion(p.estado)
                        return (
                          <Fragment key={p.id}>
                            <tr className="border-t border-black/10 align-top hover:bg-black/2">
                              <td className="px-4 py-4 align-top">
                                <div className="whitespace-nowrap font-semibold tracking-[-0.02em] text-black">
                                  {p.codigo}
                                </div>
                                <div className="mt-1 text-[11px] text-black/45">v{p.versionActual}</div>
                              </td>
                              <td className="px-4 py-4 align-top">
                                <div className="line-clamp-2 wrap-break-word font-medium text-black/85">{p.proyectoNombre}</div>
                                <div className="mt-1 wrap-break-word text-[11px] text-black/45">{p.concurso}</div>
                              </td>
                              <td className="px-4 py-4 align-top wrap-break-word text-black/75">{p.facultad}</td>
                              <td className="px-4 py-4 align-top">
                                <div className="line-clamp-2 wrap-break-word text-black/75">{p.fondo}</div>
                              </td>
                              <td className="px-4 py-4">
                                <Badge className="px-3 py-1" variant={general.variant}>
                                  {general.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-4">
                                <Badge className="px-3 py-1" variant={estadoUi.variant} title={estadoUi.label}>
                                  {estadoUi.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-[12px] font-medium text-black/70">
                                  {format(new Date(p.fechaRegistroIso), 'dd MMM yyyy')}
                                </div>
                                <div className="mt-1 text-[11px] text-black/45">
                                  {format(new Date(p.fechaRegistroIso), 'HH:mm')}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <FichaIndicators postulacion={fp} asociacion={fa} adjudicacion={fj} />
                                <div className="mt-2 text-[11px] text-black/45">
                                  Postulación · Asociación · Adjudicación
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="rounded-xl"
                                  onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {open ? (
                                      <>
                                        Ocultar
                                        <ChevronUp size={16} />
                                      </>
                                    ) : (
                                      <>
                                        Detalle
                                        <ChevronDown size={16} />
                                      </>
                                    )}
                                  </span>
                                </Button>
                              </td>
                            </tr>
                            {open ? (
                              <tr className="border-t border-black/10 bg-black/2">
                                <td colSpan={9} className="px-4 py-4">
                                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-black/10 bg-white/60 p-3">
                                      <div className="text-xs font-semibold text-black/60">Identificación</div>
                                      <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                                        <div>
                                          <span className="text-black/50">Código:</span> {p.codigo}
                                        </div>
                                        <div>
                                          <span className="text-black/50">Versión vigente:</span> v{p.versionActual}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-black/10 bg-white/60 p-3">
                                      <div className="text-xs font-semibold text-black/60">Información general</div>
                                      <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                                        <div>
                                          <span className="text-black/50">Proyecto:</span> {p.proyectoNombre || '—'}
                                        </div>
                                        <div>
                                          <span className="text-black/50">Concurso:</span> {p.concurso || '—'}
                                        </div>
                                        <div>
                                          <span className="text-black/50">Objetivo:</span>{' '}
                                          {p.objetivo?.trim() ? p.objetivo : '—'}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-black/10 bg-white/60 p-3 lg:col-span-2">
                                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div className="text-xs font-semibold text-black/60">
                                          Simulación (sin DB) — repercute en esta vista y en el Excel
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            size="sm"
                                            variant={s.registroIncompleto ? 'primary' : 'secondary'}
                                            onClick={() => setSim(p.id, { registroIncompleto: !s.registroIncompleto })}
                                          >
                                            Toggle registro incompleto
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={s.fichaPostulacionNoDisponible ? 'primary' : 'secondary'}
                                            onClick={() =>
                                              setSim(p.id, {
                                                fichaPostulacionNoDisponible: !s.fichaPostulacionNoDisponible,
                                              })
                                            }
                                          >
                                            Toggle ficha postulación no disponible
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={s.fichaAsociacionNoDisponible ? 'primary' : 'secondary'}
                                            onClick={() =>
                                              setSim(p.id, { fichaAsociacionNoDisponible: !s.fichaAsociacionNoDisponible })
                                            }
                                          >
                                            Toggle ficha asociación no disponible
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={s.fichaAdjudicacionNoDisponible ? 'primary' : 'secondary'}
                                            onClick={() =>
                                              setSim(p.id, {
                                                fichaAdjudicacionNoDisponible: !s.fichaAdjudicacionNoDisponible,
                                              })
                                            }
                                          >
                                            Toggle ficha adjudicación no disponible
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="rounded-xl border border-black/10 bg-white/60 p-3">
                                          <div className="text-sm font-semibold">Ficha de postulación</div>
                                          <div className="mt-2">
                                            <Badge {...badgeForDocEstado(fp)}>{fp}</Badge>
                                          </div>
                                          <div className="mt-2 text-xs text-black/60">
                                            Documentación requerida (resumen): {estadoDocumentacionPostulacion(p)}
                                          </div>
                                        </div>
                                        <div className="rounded-xl border border-black/10 bg-white/60 p-3">
                                          <div className="text-sm font-semibold">Ficha para asociación</div>
                                          <div className="mt-2">
                                            <Badge {...badgeForDocEstado(fa)}>{fa}</Badge>
                                          </div>
                                          <div className="mt-2 text-xs text-black/60">
                                            Aplica si el proyecto es asociado o tiene entidad asociada.
                                          </div>
                                        </div>
                                        <div className="rounded-xl border border-black/10 bg-white/60 p-3 md:col-span-2">
                                          <div className="text-sm font-semibold">Ficha para adjudicación</div>
                                          <div className="mt-2">
                                            <Badge {...badgeForDocEstado(fj)}>{fj}</Badge>
                                          </div>
                                          <div className="mt-2 text-xs text-black/60">
                                            Aplica si el proyecto está adjudicado.
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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

