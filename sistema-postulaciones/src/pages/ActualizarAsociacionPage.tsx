import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FieldError, Input, Label, Textarea } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { getPostulacion, upsertPostulacion } from '../app/storage'
import { etiquetaEstadoPostulacion } from '../app/postulacionPresentacion'
import { useAuth } from '../app/auth'
import { type DocumentoAdjunto, type Postulacion } from '../app/types'

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

function isPdf(f: File): boolean {
  return f.name.toLowerCase().endsWith('.pdf') && (f.type === 'application/pdf' || f.type === '')
}

function estadoEditableParaAsociacion(post: Postulacion): boolean {
  return (
    post.estado === 'BORRADOR' ||
    post.estado === 'ENVIADO_PARA_EVALUACION' ||
    post.estado === 'OBSERVADO' ||
    post.estado === 'ADJUDICADO'
  )
}

function soloConsultaBloqueo(post: Postulacion) {
  return post.contratoFirmado || post.convenioFormalizado
}

function adjuntoEsPdf(d: DocumentoAdjunto) {
  return d.nombre.toLowerCase().endsWith('.pdf')
}

export function ActualizarAsociacionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { toast } = useToast()
  const { session } = useAuth()
  const [refresh, setRefresh] = useState(0)

  const p = id ? getPostulacion(id) : null

  const [vista, setVista] = useState<'ficha_vigente' | 'edicion' | 'solo_consulta'>('ficha_vigente')
  const [fatal, setFatal] = useState<string | null>(null)

  const [proyectoNombre, setProyectoNombre] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [descripcionParticipacion, setDescripcionParticipacion] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [ruc, setRuc] = useState('')
  const [representante, setRepresentante] = useState('')
  const [correo, setCorreo] = useState('')
  const [docAsociacion, setDocAsociacion] = useState<DocumentoAdjunto | null>(null)
  const [aplicaComplementaria, setAplicaComplementaria] = useState(false)
  const [docComplementario, setDocComplementario] = useState<DocumentoAdjunto | null>(null)
  const [vigenciaDocIso, setVigenciaDocIso] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const refPrincipal = useRef<HTMLInputElement>(null)
  const refComplemento = useRef<HTMLInputElement>(null)

  const syncFrom = useCallback((post: Postulacion) => {
    setProyectoNombre(post.proyectoNombre ?? '')
    setObjetivo(post.objetivo ?? '')
    setDescripcionParticipacion(post.descripcionParticipacionAsociada ?? '')
    setRazonSocial(post.entidadAsociada?.razonSocial ?? '')
    setRuc(post.entidadAsociada?.ruc ?? '')
    setRepresentante(post.entidadAsociada?.representante ?? '')
    setCorreo(post.entidadAsociada?.correo ?? '')
    setDocAsociacion(post.adjuntos.find((d) => d.tipo === 'FICHA_ASOCIACION') ?? null)
    setDocComplementario(post.adjuntos.find((d) => d.tipo === 'SUSTENTO_ASOCIACION_COMPLEMENTARIO') ?? null)
    setAplicaComplementaria(!!post.adjuntos.find((d) => d.tipo === 'SUSTENTO_ASOCIACION_COMPLEMENTARIO'))
    setVigenciaDocIso('')
  }, [])

  useEffect(() => {
    if (!id) return
    const cur = getPostulacion(id)
    if (!cur) return
    syncFrom(cur)
    setVista('ficha_vigente')
    setFatal(null)
    setErrors({})
  }, [id, refresh, syncFrom])

  const perteneceFacultad = useMemo(() => {
    if (!p) return false
    return p.facultad === session.facultad
  }, [p, session])

  const aplicaAsociacion = useMemo(() => !!p && (p.tieneEntidadAsociada || p.tipoParticipacion === 'ASOCIADO'), [p])

  const fichaEnEstadoEditable = useMemo(() => (p ? estadoEditableParaAsociacion(p) : false), [p])

  const convenioOContratoFormalizado = useMemo(
    () => !!p && (p.contratoFirmado || p.convenioFormalizado),
    [p],
  )

  function onIntentarActualizar() {
    if (!p) {
      setFatal('Ficha inexistente o no disponible.')
      return
    }
    if (!perteneceFacultad) {
      setFatal('La ficha no existe o no pertenece a su Facultad.')
      return
    }
    if (!aplicaAsociacion) {
      setFatal('Esta operacion no aplica: el proyecto no contempla participacion con entidad externa asociada.')
      return
    }
    if (!fichaEnEstadoEditable) {
      setFatal('La ficha no se encuentra en estado editable. Actualizacion bloqueada.')
      return
    }
    if (convenioOContratoFormalizado) {
      setVista('solo_consulta')
      setFatal(null)
      toast({
        title: 'Solo consulta',
        message: 'El contrato o convenio final ya fue formalizado. No se permite la edicion.',
        variant: 'default',
      })
      return
    }
    setFatal(null)
    setVista('edicion')
  }

  function validateGuardar(): Record<string, string> {
    const err: Record<string, string> = {}
    if (!proyectoNombre.trim()) err.proyectoNombre = 'Dato obligatorio.'
    if (!objetivo.trim()) err.objetivo = 'Dato obligatorio.'
    if (!descripcionParticipacion.trim()) err.participacion = 'Describa la participacion vinculada a la asociacion.'
    if (!razonSocial.trim()) err.razonSocial = 'Razon social obligatoria.'
    if (!ruc.trim()) err.ruc = 'RUC obligatorio.'
    if (!representante.trim()) err.representante = 'Representante obligatorio.'
    if (!correo.trim() || !correo.includes('@')) err.correo = 'Correo invalido.'
    if (!docAsociacion) err.doc = 'Debe adjuntar el documento de asociacion (PDF).'
    else if (!adjuntoEsPdf(docAsociacion)) err.doc = 'El documento de asociacion debe ser PDF.'
    if (vigenciaDocIso) {
      const v = new Date(vigenciaDocIso)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      if (v < hoy) err.vigencia = 'La vigencia indicada no puede estar vencida.'
    }
    if (aplicaComplementaria) {
      if (!docComplementario) err.complemento = 'Adjunte la documentacion complementaria de sustento (PDF).'
      else if (!adjuntoEsPdf(docComplementario)) err.complemento = 'La documentacion complementaria debe ser PDF.'
    }
    return err
  }

  function consistenciaInfo(): string | null {
    if (ruc.trim().length < 8) return 'RUC inconsistente (longitud minima esperada).'
    return null
  }

  function onGuardarActualizacion() {
    if (!p || vista !== 'edicion') return
    const err = validateGuardar()
    const inc = consistenciaInfo()
    if (inc) err.consistencia = inc
    if (Object.keys(err).length > 0) {
      setErrors(err)
      toast({
        title: 'Observaciones',
        message: 'Existen faltantes o inconsistencias. Corrija e intente Guardar actualizacion nuevamente.',
        variant: 'danger',
      })
      return
    }
    setErrors({})

    const prevV = p.versionActual
    const nextV = prevV + 1
    const adjuntosBase = p.adjuntos.filter(
      (d) => d.tipo !== 'FICHA_ASOCIACION' && d.tipo !== 'SUSTENTO_ASOCIACION_COMPLEMENTARIO',
    )
    const adjuntos: DocumentoAdjunto[] = [...adjuntosBase, docAsociacion!]
    if (aplicaComplementaria && docComplementario) adjuntos.push(docComplementario)

    const next: Postulacion = {
      ...p,
      proyectoNombre: proyectoNombre.trim(),
      objetivo: objetivo.trim(),
      descripcionParticipacionAsociada: descripcionParticipacion.trim(),
      entidadAsociada: {
        razonSocial: razonSocial.trim(),
        ruc: ruc.trim(),
        representante: representante.trim(),
        correo: correo.trim(),
      },
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      adjuntos,
      versionActual: nextV,
      historial: [
        {
          version: nextV,
          createdAtIso: new Date().toISOString(),
          createdBy: 'Representante Facultad',
          changesSummary: `Version anterior inactivada (v${prevV}). Nueva version v${nextV}. Actualizacion ficha para asociacion.`,
        },
        ...p.historial,
      ],
    }

    upsertPostulacion(next)
    setRefresh((x) => x + 1)
    setVista('ficha_vigente')
    toast({
      title: 'Confirmacion',
      message: 'Actualizacion guardada. Se genero nueva version de la ficha y se registro el historial de cambios.',
      variant: 'success',
    })
  }

  function attachPrincipal(files: FileList | null) {
    if (!files?.length) return
    const f = files[0]
    if (!isPdf(f)) {
      toast({ title: 'Formato', message: 'Solo se admite PDF.', variant: 'danger' })
      return
    }
    setDocAsociacion(makeDoc('FICHA_ASOCIACION', f))
    toast({ title: 'Documento', message: `${f.name} registrado.`, variant: 'success' })
  }

  function attachComplementario(files: FileList | null) {
    if (!files?.length) return
    const f = files[0]
    if (!isPdf(f)) {
      toast({ title: 'Formato', message: 'Solo se admite PDF.', variant: 'danger' })
      return
    }
    setDocComplementario(makeDoc('SUSTENTO_ASOCIACION_COMPLEMENTARIO', f))
    toast({ title: 'Documento', message: `${f.name} registrado.`, variant: 'success' })
  }

  if (!p) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actualizar ficha para asociacion</CardTitle>
          <CardDescription>Ficha inexistente o no disponible.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" onClick={() => nav('/')}>
            Volver al listado
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (fatal) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Actualizar ficha para asociacion</h1>
        <Card>
          <CardHeader>
            <CardTitle>Operacion no permitida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-black/80">{fatal}</p>
            <Button variant="secondary" onClick={() => nav('/')}>
              Volver al listado
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lectura = vista === 'ficha_vigente' || vista === 'solo_consulta'
  const bloqueoPrevio = soloConsultaBloqueo(p)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Actualizar ficha para asociacion</h1>
          <p className="mt-1 text-sm text-black/60">
            {p.codigo} - Version vigente {p.versionActual} - Estado {etiquetaEstadoPostulacion(p.estado)}
          </p>
        </div>
        <Badge variant={vista === 'edicion' ? 'success' : vista === 'solo_consulta' ? 'warning' : 'default'}>
          {vista === 'edicion' ? 'Edicion habilitada' : vista === 'solo_consulta' ? 'Solo consulta' : 'Ficha base'}
        </Badge>
      </div>

      {lectura ? (
        <Card>
          <CardHeader>
            <CardTitle>Ficha de postulacion base</CardTitle>
            <CardDescription>Version vigente cargada desde el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-black/50">Codigo</div>
                <div className="mt-1">{p.codigo}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-black/50">Facultad</div>
                <div className="mt-1">{p.facultad}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-black/50">Proyecto</div>
                <div className="mt-1">{p.proyectoNombre}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-black/50">Objetivo</div>
                <div className="mt-1">{p.objetivo}</div>
              </div>
              {p.descripcionParticipacionAsociada ? (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-black/50">Participacion asociada</div>
                  <div className="mt-1">{p.descripcionParticipacionAsociada}</div>
                </div>
              ) : null}
            </div>
            {vista === 'solo_consulta' ? (
              <p className="border-t border-black/10 pt-4 text-sm text-black/70">
                El contrato o convenio final ya fue formalizado. La ficha permanece en modo solo consulta.
              </p>
            ) : null}
            {vista === 'ficha_vigente' && bloqueoPrevio ? (
              <p className="border-t border-black/10 pt-4 text-sm text-amber-900">
                No es posible actualizar: el contrato o convenio ya consta como formalizado.
              </p>
            ) : null}
            {vista === 'ficha_vigente' && !bloqueoPrevio ? (
              <div className="flex flex-wrap justify-end gap-2 border-t border-black/10 pt-4">
                <Button variant="secondary" onClick={() => nav('/')}>
                  Volver al listado
                </Button>
                <Button onClick={onIntentarActualizar}>Actualizar ficha para asociacion</Button>
              </div>
            ) : (
              <div className="flex justify-end border-t border-black/10 pt-4">
                <Button variant="secondary" onClick={() => nav('/')}>
                  Volver al listado
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {vista === 'edicion' ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Representante de la Facultad Proponente</CardTitle>
                <CardDescription>
                  Revise y actualice los datos generales del proyecto vinculados a la asociacion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre del proyecto *</Label>
                  <Input value={proyectoNombre} onChange={(e) => setProyectoNombre(e.target.value)} />
                  <FieldError message={errors.proyectoNombre} />
                </div>
                <div>
                  <Label>Objetivo *</Label>
                  <Textarea value={objetivo} onChange={(e) => setObjetivo(e.target.value)} rows={3} />
                  <FieldError message={errors.objetivo} />
                </div>
                <div>
                  <Label>Descripcion de la participacion / vinculo con la entidad asociada *</Label>
                  <Textarea
                    value={descripcionParticipacion}
                    onChange={(e) => setDescripcionParticipacion(e.target.value)}
                    rows={4}
                  />
                  <FieldError message={errors.participacion} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black/20">
              <CardHeader>
                <CardTitle>Entidad externa asociada</CardTitle>
                <CardDescription>
                  La entidad proporciona informacion de participacion y el documento de asociacion; el representante
                  registra esos datos en el sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Razon social *</Label>
                  <Input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
                  <FieldError message={errors.razonSocial} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>RUC *</Label>
                    <Input value={ruc} onChange={(e) => setRuc(e.target.value)} />
                    <FieldError message={errors.ruc} />
                  </div>
                  <div>
                    <Label>Representante *</Label>
                    <Input value={representante} onChange={(e) => setRepresentante(e.target.value)} />
                    <FieldError message={errors.representante} />
                  </div>
                </div>
                <div>
                  <Label>Correo de contacto *</Label>
                  <Input value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  <FieldError message={errors.correo} />
                </div>
                <div>
                  <Label>Vigencia del documento de asociacion (opcional)</Label>
                  <Input type="date" value={vigenciaDocIso} onChange={(e) => setVigenciaDocIso(e.target.value)} />
                  <FieldError message={errors.vigencia} />
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                  <div className="text-sm font-medium">Documento de asociacion (PDF) *</div>
                  <div className="mt-1 text-xs text-black/50">{docAsociacion ? docAsociacion.nombre : 'No adjuntado'}</div>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <input
                      ref={refPrincipal}
                      type="file"
                      className="hidden"
                      tabIndex={-1}
                      accept="application/pdf"
                      onChange={(e) => {
                        attachPrincipal(e.target.files)
                        e.target.value = ''
                      }}
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={() => refPrincipal.current?.click()}>
                      Seleccionar archivo
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={!docAsociacion} onClick={() => setDocAsociacion(null)}>
                      Quitar
                    </Button>
                  </div>
                  <FieldError message={errors.doc} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documentacion complementaria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={aplicaComplementaria} onChange={(e) => setAplicaComplementaria(e.target.checked)} />
                  Aplica documentacion complementaria de sustento
                </label>
                {aplicaComplementaria ? (
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                    <div className="text-sm font-medium">Sustento complementario (PDF)</div>
                    <div className="mt-1 text-xs text-black/50">
                      {docComplementario ? docComplementario.nombre : 'No adjuntado'}
                    </div>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <input
                        ref={refComplemento}
                        type="file"
                        className="hidden"
                        tabIndex={-1}
                        accept="application/pdf"
                        onChange={(e) => {
                          attachComplementario(e.target.files)
                          e.target.value = ''
                        }}
                      />
                      <Button type="button" variant="secondary" size="sm" onClick={() => refComplemento.current?.click()}>
                        Seleccionar archivo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!docComplementario}
                        onClick={() => setDocComplementario(null)}
                      >
                        Quitar
                      </Button>
                    </div>
                    <FieldError message={errors.complemento} />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <FieldError message={errors.consistencia} />

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => nav('/')}>
                Cancelar
              </Button>
              <Button onClick={onGuardarActualizacion}>Guardar actualizacion</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historial de versiones</CardTitle>
              <CardDescription>La version anterior queda inactiva al generar la nueva.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {p.historial.slice(0, 8).map((h) => (
                  <div key={h.version + h.createdAtIso} className="rounded-xl border border-black/10 bg-white/60 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">v{h.version}</span>
                      <span className="text-black/50">{new Date(h.createdAtIso).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-black/60">{h.changesSummary}</div>
                    <div className="mt-1 text-black/40">Por: {h.createdBy}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
