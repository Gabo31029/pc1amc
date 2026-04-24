import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FieldError, Input, Label, Textarea } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { etiquetaEstadoPostulacion, etiquetaTipoParticipacion } from '../app/postulacionPresentacion'
import { getPostulacion, upsertPostulacion } from '../app/storage'
import { type DocumentoAdjunto, type Postulacion } from '../app/types'

const MAX_TITULO = 119
const MAX_DURACION = 8
const MAX_OBJETIVO = 127
const MAX_BENEFICIOS = 76
const MAX_INFORME_BYTES = 5 * 1024 * 1024

const OBJETIVOS_ESTRATEGICOS = [
  { id: 'i_d', label: 'Investigación e innovación' },
  { id: 'vinculacion', label: 'Vinculación con la sociedad' },
  { id: 'sostenibilidad', label: 'Sostenibilidad ambiental' },
  { id: 'interculturalidad', label: 'Interculturalidad' },
  { id: 'docencia', label: 'Innovación y calidad docente' },
] as const

function genId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function makeDoc(tipo: DocumentoAdjunto['tipo'], f: File): DocumentoAdjunto {
  return {
    id: genId(),
    tipo,
    nombre: f.name,
    mime: f.type || 'application/octet-stream',
    size: f.size,
    uploadedAtIso: new Date().toISOString(),
  }
}

function isWithinAdjudicacionDeadline(iso?: string): boolean {
  if (!iso) return true
  const lim = new Date(iso)
  const now = new Date()
  const limDay = new Date(lim.getFullYear(), lim.getMonth(), lim.getDate()).getTime()
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return nowDay <= limDay
}

function isPdfOrDocx(f: File): boolean {
  const n = f.name.toLowerCase()
  const okExt = n.endsWith('.pdf') || n.endsWith('.docx') || n.endsWith('.doc')
  const okMime =
    f.type === 'application/pdf' ||
    f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    f.type === 'application/msword' ||
    f.type === ''
  return okExt && okMime
}

function isPdf(f: File): boolean {
  return f.name.toLowerCase().endsWith('.pdf') && (f.type === 'application/pdf' || f.type === '')
}

function financiamientoConsistente(monetario: number, noMonetario: number, totalGeneral: number): boolean {
  const a = Number(monetario) || 0
  const b = Number(noMonetario) || 0
  const t = Number(totalGeneral) || 0
  return Math.abs(a + b - t) < 0.005
}

export function ActualizarAdjudicacionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { toast } = useToast()
  const [refresh, setRefresh] = useState(0)
  const [modo, setModo] = useState<'lectura' | 'edicion'>('lectura')

  const p = id ? getPostulacion(id) : null

  const [proyectoNombre, setProyectoNombre] = useState('')
  const [duracion, setDuracion] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState('')
  const [beneficiosProyecto, setBeneficiosProyecto] = useState('')
  const [objetivosIds, setObjetivosIds] = useState<string[]>([])

  const [montoMonetario, setMontoMonetario] = useState(0)
  const [montoNoMonetario, setMontoNoMonetario] = useState(0)
  const [totalGeneral, setTotalGeneral] = useState(0)

  const [docInforme, setDocInforme] = useState<DocumentoAdjunto | null>(null)
  const [docAdjudicacion, setDocAdjudicacion] = useState<DocumentoAdjunto | null>(null)
  const [convenio, setConvenio] = useState<DocumentoAdjunto | null>(null)
  const [docLegal, setDocLegal] = useState<DocumentoAdjunto | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const informeFileRef = useRef<HTMLInputElement>(null)
  const adjudicacionFileRef = useRef<HTMLInputElement>(null)
  const convenioFileRef = useRef<HTMLInputElement>(null)
  const legalFileRef = useRef<HTMLInputElement>(null)

  const syncFromPostulacion = useCallback((post: Postulacion) => {
    setProyectoNombre(post.proyectoNombre ?? '')
    setDuracion(post.duracion ?? '')
    setObjetivo(post.objetivo ?? '')
    setCriteriosEvaluacion(post.criteriosEvaluacion ?? '')
    setBeneficiosProyecto(post.beneficiosProyecto ?? '')
    setObjetivosIds(post.objetivosEstrategicosIds ?? [])
    setMontoMonetario(post.financiamiento.montoSolicitado ?? 0)
    setMontoNoMonetario(post.financiamiento.cofinanciamiento ?? 0)
    setTotalGeneral(post.financiamiento.total ?? 0)
    setDocInforme(post.adjuntos.find((d) => d.tipo === 'INFORME_TECNICO_ACTUALIZACION_ADJ') ?? null)
    setDocAdjudicacion(post.adjuntos.find((d) => d.tipo === 'DOCUMENTO_ADJUDICACION') ?? null)
    setConvenio(post.adjuntos.find((d) => d.tipo === 'CONVENIO_ASOCIACION') ?? null)
    setDocLegal(post.adjuntos.find((d) => d.tipo === 'DOCUMENTO_LEGAL') ?? null)
  }, [])

  useEffect(() => {
    setModo('lectura')
  }, [id])

  useEffect(() => {
    if (!id) return
    const cur = getPostulacion(id)
    if (!cur) return
    syncFromPostulacion(cur)
    setErrors({})
  }, [id, refresh, syncFromPostulacion])

  const convenioFirmadoBloquea = useMemo(() => {
    if (!p) return true
    return p.convenioFormalizado || p.estado === 'CONVENIO_FORMALIZADO'
  }, [p])

  const plazoPermiteEdicion = useMemo(() => (p ? isWithinAdjudicacionDeadline(p.fechaLimiteActualizacionAdjudicacionIso) : false), [p])

  const esAdjudicadoVigente = useMemo(() => {
    if (!p) return false
    return p.estado === 'ADJUDICADO' && (p.adjudicado !== false)
  }, [p])

  const fichaYaEnviada = p?.estado === 'EN_EVALUACION' || p?.fichaAdjudicacionEstado === 'FINAL'

  const borradorGuardado = p?.fichaAdjudicacionEstado === 'BORRADOR'

  const puedeEntrarEdicion = esAdjudicadoVigente && !convenioFirmadoBloquea && plazoPermiteEdicion && !fichaYaEnviada

  const formularioEditable = modo === 'edicion' && puedeEntrarEdicion

  const requiresAsociado = !!p?.tieneEntidadAsociada || p?.tipoParticipacion === 'ASOCIADO'

  const restrictions = useMemo(() => {
    if (!p) return { ok: false, reasons: ['Proyecto no encontrado'] }
    if (fichaYaEnviada) return { ok: true, reasons: [] as string[] }
    const reasons: string[] = []
    if (!esAdjudicadoVigente) reasons.push('Solo aplica a proyectos en estado ADJUDICADO.')
    if (convenioFirmadoBloquea) reasons.push('Convenio formalizado (equivalente a CONVENIO_FIRMADO): edición no permitida.')
    if (esAdjudicadoVigente && !plazoPermiteEdicion)
      reasons.push('Fuera del plazo (fecha actual > fecha límite): edición no permitida.')
    return { ok: reasons.length === 0, reasons }
  }, [p, esAdjudicadoVigente, fichaYaEnviada, convenioFirmadoBloquea, plazoPermiteEdicion])

  function attachInforme(files: FileList | null) {
    if (!files?.length) return
    const f = files[0]
    if (!isPdfOrDocx(f)) {
      toast({ title: 'Archivo no válido', message: 'Use PDF o DOCX.', variant: 'danger' })
      return
    }
    if (f.size > MAX_INFORME_BYTES) {
      toast({ title: 'Tamaño excedido', message: 'Máximo 5 MB.', variant: 'danger' })
      return
    }
    setDocInforme(makeDoc('INFORME_TECNICO_ACTUALIZACION_ADJ', f))
    toast({ title: 'Informe adjuntado', message: f.name, variant: 'success' })
  }

  function attachPdf(setter: (d: DocumentoAdjunto | null) => void, tipo: DocumentoAdjunto['tipo']) {
    return (files: FileList | null) => {
      if (!files?.length) return
      const f = files[0]
      if (!isPdf(f)) {
        toast({ title: 'Archivo no válido', message: 'Solo PDF.', variant: 'danger' })
        return
      }
      setter(makeDoc(tipo, f))
      toast({ title: 'Documento adjuntado', message: f.name, variant: 'success' })
    }
  }

  function validateParcial(): Record<string, string> {
    const err: Record<string, string> = {}
    const tit = proyectoNombre.trim()
    if (!tit) err.proyectoNombre = 'Título obligatorio'
    else if (tit.length > MAX_TITULO) err.proyectoNombre = `Máximo ${MAX_TITULO} caracteres`
    const du = duracion.trim()
    if (!du) err.duracion = 'Duración obligatoria'
    else if (du.length > MAX_DURACION) err.duracion = `Máximo ${MAX_DURACION} caracteres`
    const obj = objetivo.trim()
    if (!obj) err.objetivo = 'Objetivo obligatorio'
    else if (obj.length > MAX_OBJETIVO) err.objetivo = `Máximo ${MAX_OBJETIVO} caracteres`
    const crit = criteriosEvaluacion.trim()
    if (!crit) err.criterios = 'Criterios obligatorios'
    if (!financiamientoConsistente(montoMonetario, montoNoMonetario, totalGeneral))
      err.fin = 'Aporte monetario + aporte no monetario debe igualar el total general.'
    return err
  }

  function validateEnvio(): Record<string, string> {
    const err = { ...validateParcial() }
    if (objetivosIds.length === 0) err.objetivos = 'Seleccione al menos un objetivo estratégico.'
    const ben = beneficiosProyecto.trim()
    if (!ben) err.beneficios = 'Beneficios obligatorios'
    else if (ben.length > MAX_BENEFICIOS) err.beneficios = `Máximo ${MAX_BENEFICIOS} caracteres`
    if (!docInforme) err.informe = 'Adjunte informe técnico (PDF o DOCX, máx. 5 MB)'
    if (!docAdjudicacion) err.adj = 'Adjunte documento de adjudicación (PDF)'
    if (requiresAsociado) {
      if (!convenio) err.conv = 'Adjunte convenio de asociación (PDF)'
      if (!docLegal) err.legal = 'Adjunte documentos legales — RUC, SUNAT — (PDF consolidado)'
    }
    return err
  }

  function buildAdjuntosList(): DocumentoAdjunto[] {
    if (!p) return []
    const strip = new Set<DocumentoAdjunto['tipo']>([
      'INFORME_TECNICO_ACTUALIZACION_ADJ',
      'DOCUMENTO_ADJUDICACION',
      'CONVENIO_ASOCIACION',
      'DOCUMENTO_LEGAL',
    ])
    const base = p.adjuntos.filter((d) => !strip.has(d.tipo))
    const out = [...base]
    if (docInforme) out.push(docInforme)
    if (docAdjudicacion) out.push(docAdjudicacion)
    if (requiresAsociado && convenio) out.push(convenio)
    if (requiresAsociado && docLegal) out.push(docLegal)
    return out
  }

  function patchPostulacionBase(): Postulacion {
    if (!p) throw new Error('missing')
    return {
      ...p,
      proyectoNombre: proyectoNombre.trim(),
      duracion: duracion.trim(),
      objetivo: objetivo.trim(),
      criteriosEvaluacion: criteriosEvaluacion.trim(),
      beneficiosProyecto: beneficiosProyecto.trim(),
      objetivosEstrategicosIds: [...objetivosIds],
      financiamiento: {
        montoSolicitado: Number(montoMonetario) || 0,
        cofinanciamiento: Number(montoNoMonetario) || 0,
        total: Number(totalGeneral) || 0,
      },
      adjuntos: buildAdjuntosList(),
    }
  }

  function onGuardar() {
    if (!p || !formularioEditable) return
    const err = validateParcial()
    if (Object.keys(err).length > 0) {
      setErrors(err)
      toast({ title: 'Correcciones', message: 'Revise longitudes, obligatorios y consistencia financiera.', variant: 'danger' })
      return
    }
    setErrors({})
    const next: Postulacion = { ...patchPostulacionBase(), fichaAdjudicacionEstado: 'BORRADOR' }
    upsertPostulacion(next)
    setRefresh((x) => x + 1)
    toast({ title: 'Guardado', message: 'Borrador actualizado en almacenamiento local.', variant: 'success' })
  }

  function onEnviarFicha() {
    if (!p || !formularioEditable) return
    if (p.fichaAdjudicacionEstado !== 'BORRADOR') {
      toast({
        title: 'Orden del flujo',
        message: 'Debe usar «Guardar» y luego «Enviar ficha».',
        variant: 'danger',
      })
      return
    }
    const err = validateEnvio()
    if (Object.keys(err).length > 0) {
      setErrors(err)
      toast({ title: 'No se puede enviar', message: 'Corrija errores e inconsistencias indicados.', variant: 'danger' })
      return
    }
    setErrors({})
    const nextVersion = p.versionActual + 1
    const next: Postulacion = {
      ...patchPostulacionBase(),
      versionActual: nextVersion,
      estado: 'EN_EVALUACION',
      fichaAdjudicacionEstado: 'FINAL',
      historial: [
        {
          version: nextVersion,
          createdAtIso: new Date().toISOString(),
          createdBy: 'Representante Facultad',
          changesSummary:
            'Ficha de adjudicación en estado FINAL; proyecto EN_EVALUACION; remisión al Comité de Evaluación (auditoría y notificación).',
        },
        ...p.historial,
      ],
    }
    upsertPostulacion(next)
    toast({
      title: 'Ficha enviada',
      message: 'Ficha definitiva (FINAL), expediente al Comité de Evaluación.',
      variant: 'success',
    })
    nav('/')
  }

  function toggleObjetivo(id: string) {
    setObjetivosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  if (!p) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actualizar ficha para adjudicación</CardTitle>
          <CardDescription>No se encontró el proyecto.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={() => nav('/')}>
            Volver
          </Button>
        </CardContent>
      </Card>
    )
  }

  const limTxt = p.fechaLimiteActualizacionAdjudicacionIso
    ? new Date(p.fechaLimiteActualizacionAdjudicacionIso).toLocaleDateString()
    : 'Sin fecha límite configurada'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Actualizar ficha para adjudicación</h1>
          <p className="mt-1 text-sm text-black/60">
            {p.codigo} · Versión {p.versionActual} · Estado {etiquetaEstadoPostulacion(p.estado)} · Participación{' '}
            {etiquetaTipoParticipacion(p.tipoParticipacion)}
          </p>
          <p className="mt-1 text-xs text-black/50">Plazo de edición (inclusive): {limTxt}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {fichaYaEnviada ? (
            <Badge variant="info">Enviada — solo consulta</Badge>
          ) : puedeEntrarEdicion ? (
            modo === 'edicion' ? (
              <Badge variant="success">Edición habilitada</Badge>
            ) : (
              <Badge variant="warning">Modo lectura</Badge>
            )
          ) : (
            <Badge variant="danger">Edición no permitida</Badge>
          )}
        </div>
      </div>

      {!restrictions.ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Restricciones</div>
          <ul className="mt-1 list-disc pl-5">
            {restrictions.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {modo === 'lectura' && !fichaYaEnviada ? (
        <Card>
          <CardHeader>
            <CardTitle>Ficha de postulación (solo lectura)</CardTitle>
            <CardDescription>Datos recuperados de la versión actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-black/50">Título</div>
                <div className="mt-1 text-black/85">{p.proyectoNombre}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-black/50">Duración</div>
                <div className="mt-1 text-black/85">{p.duracion ?? '—'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-black/50">Objetivo</div>
                <div className="mt-1 text-black/85">{p.objetivo}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-black/50">Resumen / alcance</div>
                <div className="mt-1 text-black/85">{p.resumen}</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => nav('/')}>
                Volver al listado
              </Button>
              <Button disabled={!puedeEntrarEdicion} onClick={() => setModo('edicion')}>
                Actualizar ficha para adjudicación
              </Button>
            </div>
            {!puedeEntrarEdicion && esAdjudicadoVigente ? (
              <p className="text-xs text-black/50">
                El sistema valida estado distinto de convenio firmado y que la fecha actual sea menor o igual al plazo
                configurado.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {(modo === 'edicion' || fichaYaEnviada) && (
        <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Datos generales y criterios</CardTitle>
                <CardDescription>Límites: título {MAX_TITULO}, duración {MAX_DURACION}, objetivo {MAX_OBJETIVO}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título del proyecto *</Label>
                  <Input
                    value={proyectoNombre}
                    onChange={(e) => setProyectoNombre(e.target.value.slice(0, MAX_TITULO))}
                    disabled={!formularioEditable}
                    maxLength={MAX_TITULO}
                  />
                  <div className="mt-0.5 text-xs text-black/45">
                    {proyectoNombre.length}/{MAX_TITULO}
                  </div>
                  <FieldError message={errors.proyectoNombre} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Duración *</Label>
                    <Input
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value.slice(0, MAX_DURACION))}
                      disabled={!formularioEditable}
                      maxLength={MAX_DURACION}
                    />
                    <FieldError message={errors.duracion} />
                  </div>
                  <div>
                    <Label>Facultad</Label>
                    <Input value={p.facultad} readOnly />
                  </div>
                </div>
                <div>
                  <Label>Objetivo *</Label>
                  <Textarea
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value.slice(0, MAX_OBJETIVO))}
                    disabled={!formularioEditable}
                    maxLength={MAX_OBJETIVO}
                  />
                  <div className="mt-0.5 text-xs text-black/45">
                    {objetivo.length}/{MAX_OBJETIVO}
                  </div>
                  <FieldError message={errors.objetivo} />
                </div>
                <div>
                  <Label>Criterios de evaluación *</Label>
                  <Textarea
                    value={criteriosEvaluacion}
                    onChange={(e) => setCriteriosEvaluacion(e.target.value)}
                    disabled={!formularioEditable}
                  />
                  <FieldError message={errors.criterios} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financiamiento</CardTitle>
                <CardDescription>Debe cumplirse: aporte monetario + aporte no monetario = total general.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label>Aporte monetario</Label>
                    <Input
                      type="number"
                      value={montoMonetario}
                      onChange={(e) => setMontoMonetario(Number(e.target.value))}
                      disabled={!formularioEditable}
                    />
                  </div>
                  <div>
                    <Label>Aporte no monetario</Label>
                    <Input
                      type="number"
                      value={montoNoMonetario}
                      onChange={(e) => setMontoNoMonetario(Number(e.target.value))}
                      disabled={!formularioEditable}
                    />
                  </div>
                  <div>
                    <Label>Total general</Label>
                    <Input
                      type="number"
                      value={totalGeneral}
                      onChange={(e) => setTotalGeneral(Number(e.target.value))}
                      disabled={!formularioEditable}
                    />
                  </div>
                </div>
                <FieldError message={errors.fin} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Objetivos estratégicos y beneficios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Objetivos estratégicos *</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {OBJETIVOS_ESTRATEGICOS.map((o) => (
                      <label
                        key={o.id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                          objetivosIds.includes(o.id) ? 'border-black/25 bg-black/5' : 'border-black/10 bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={objetivosIds.includes(o.id)}
                          disabled={!formularioEditable}
                          onChange={() => toggleObjetivo(o.id)}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <FieldError message={errors.objetivos} />
                </div>
                <div>
                  <Label>Beneficios (máx. {MAX_BENEFICIOS}) *</Label>
                  <Textarea
                    value={beneficiosProyecto}
                    onChange={(e) => setBeneficiosProyecto(e.target.value.slice(0, MAX_BENEFICIOS))}
                    disabled={!formularioEditable}
                    maxLength={MAX_BENEFICIOS}
                  />
                  <div className="mt-0.5 text-xs text-black/45">
                    {beneficiosProyecto.length}/{MAX_BENEFICIOS}
                  </div>
                  <FieldError message={errors.beneficios} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informe técnico y documento de adjudicación</CardTitle>
                <CardDescription>Informe: PDF o DOCX, máximo 5 MB. Adjudicación: PDF.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Informe técnico *</div>
                    {docInforme ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-black/50">{docInforme ? docInforme.nombre : 'No adjuntado'}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <input
                      ref={informeFileRef}
                      type="file"
                      className="hidden"
                      tabIndex={-1}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      disabled={!formularioEditable}
                      onChange={(e) => {
                        attachInforme(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!formularioEditable}
                      onClick={() => informeFileRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!formularioEditable || !docInforme}
                      onClick={() => setDocInforme(null)}
                    >
                      Quitar
                    </Button>
                  </div>
                  <FieldError message={errors.informe} />
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Documento de adjudicación (PDF) *</div>
                    {docAdjudicacion ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-black/50">{docAdjudicacion ? docAdjudicacion.nombre : 'No adjuntado'}</div>
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                    <input
                      ref={adjudicacionFileRef}
                      type="file"
                      className="hidden"
                      tabIndex={-1}
                      accept="application/pdf"
                      disabled={!formularioEditable}
                      onChange={(e) => {
                        attachPdf(setDocAdjudicacion, 'DOCUMENTO_ADJUDICACION')(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!formularioEditable}
                      onClick={() => adjudicacionFileRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!formularioEditable || !docAdjudicacion}
                      onClick={() => setDocAdjudicacion(null)}
                    >
                      Quitar
                    </Button>
                  </div>
                  <FieldError message={errors.adj} />
                </div>
              </CardContent>
            </Card>

            {requiresAsociado ? (
              <Card>
                <CardHeader>
                  <CardTitle>Entidad asociada — convenio y legales</CardTitle>
                  <CardDescription>RUC y SUNAT en un único PDF de documentos legales.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Convenio de asociación (PDF) *</div>
                      {convenio ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-black/50">{convenio ? convenio.nombre : 'No adjuntado'}</div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <input
                        ref={convenioFileRef}
                        type="file"
                        className="hidden"
                        tabIndex={-1}
                        accept="application/pdf"
                        disabled={!formularioEditable}
                        onChange={(e) => {
                          attachPdf(setConvenio, 'CONVENIO_ASOCIACION')(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!formularioEditable}
                        onClick={() => convenioFileRef.current?.click()}
                      >
                        Seleccionar archivo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!formularioEditable || !convenio}
                        onClick={() => setConvenio(null)}
                      >
                        Quitar
                      </Button>
                    </div>
                    <FieldError message={errors.conv} />
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Documentos legales (PDF) *</div>
                      {docLegal ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-black/50">{docLegal ? docLegal.nombre : 'No adjuntado'}</div>
                    <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                      <input
                        ref={legalFileRef}
                        type="file"
                        className="hidden"
                        tabIndex={-1}
                        accept="application/pdf"
                        disabled={!formularioEditable}
                        onChange={(e) => {
                          attachPdf(setDocLegal, 'DOCUMENTO_LEGAL')(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!formularioEditable}
                        onClick={() => legalFileRef.current?.click()}
                      >
                        Seleccionar archivo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!formularioEditable || !docLegal}
                        onClick={() => setDocLegal(null)}
                      >
                        Quitar
                      </Button>
                    </div>
                    <FieldError message={errors.legal} />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!fichaYaEnviada ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => nav('/')}>
                    Cancelar
                  </Button>
                  <Button variant="secondary" disabled={!formularioEditable} onClick={onGuardar}>
                    Guardar
                  </Button>
                  <Button disabled={!formularioEditable || !borradorGuardado} onClick={onEnviarFicha}>
                    Enviar ficha
                  </Button>
                </div>
                {formularioEditable && !borradorGuardado ? (
                  <p className="text-right text-xs text-black/50">
                    Debe ejecutar <span className="font-medium">Guardar</span> antes de <span className="font-medium">Enviar ficha</span>.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => nav('/')}>
                  Volver al listado
                </Button>
              </div>
            )}
        </div>
      )}

      {fichaYaEnviada ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          Esta ficha consta como definitiva (<span className="font-semibold">FINAL</span>) y el proyecto pasó a estado{' '}
          <span className="font-semibold">EN_EVALUACION</span>. La edición quedó bloqueada.
        </div>
      ) : null}
    </div>
  )
}
