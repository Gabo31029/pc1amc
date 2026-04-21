import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FieldError, Input, Label, Textarea } from '../components/ui/Field'
import { useToast } from '../components/ui/Toast'
import { getPostulacion, upsertPostulacion } from '../app/storage'
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

export function ActualizarAdjudicacionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { toast } = useToast()

  const p = id ? getPostulacion(id) : null

  const [alcance, setAlcance] = useState(p?.resumen ?? '')
  const [montoSolicitado, setMontoSolicitado] = useState(p?.financiamiento.montoSolicitado ?? 0)
  const [cofinanciamiento, setCofinanciamiento] = useState(p?.financiamiento.cofinanciamiento ?? 0)
  const [docAdjudicacion, setDocAdjudicacion] = useState<DocumentoAdjunto | null>(() => {
    return p?.adjuntos.find((d) => d.tipo === 'DOCUMENTO_ADJUDICACION') ?? null
  })
  const [convenio, setConvenio] = useState<DocumentoAdjunto | null>(() => {
    return p?.adjuntos.find((d) => d.tipo === 'CONVENIO_ASOCIACION') ?? null
  })
  const [docLegal, setDocLegal] = useState<DocumentoAdjunto | null>(() => {
    return p?.adjuntos.find((d) => d.tipo === 'DOCUMENTO_LEGAL') ?? null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editable = useMemo(() => {
    if (!p) return false
    if (!p.adjudicado && p.estado !== 'ADJUDICADO') return false
    if (p.convenioFormalizado || p.estado === 'CONVENIO_FORMALIZADO') return false
    return true
  }, [p])

  const restrictions = useMemo(() => {
    if (!p) return { ok: false, reasons: ['Proyecto no encontrado'] }
    const reasons: string[] = []
    if (!p.adjudicado && p.estado !== 'ADJUDICADO') reasons.push('Solo aplica a proyectos adjudicados.')
    if (p.convenioFormalizado || p.estado === 'CONVENIO_FORMALIZADO')
      reasons.push('Convenio formalizado: ficha bloqueada para edición.')
    return { ok: reasons.length === 0, reasons }
  }, [p])

  const total = (Number(montoSolicitado) || 0) + (Number(cofinanciamiento) || 0)
  const requiresAsociado = !!p?.tieneEntidadAsociada || p?.tipoParticipacion === 'ASOCIADO'

  function validate(): Record<string, string> {
    const err: Record<string, string> = {}
    if (!alcance.trim() || alcance.trim().length < 10) err.alcance = 'Ingrese alcance actualizado (mín. 10 caracteres)'
    if (!docAdjudicacion) err.adj = 'Debe adjuntar el documento de adjudicación (PDF)'
    if (requiresAsociado) {
      if (!convenio) err.conv = 'Debe adjuntar convenio de asociación (PDF)'
      if (!docLegal) err.legal = 'Debe adjuntar documentos legales (PDF)'
    }
    return err
  }

  function attach(setter: (d: DocumentoAdjunto | null) => void, tipo: DocumentoAdjunto['tipo']) {
    return (files: FileList | null) => {
      if (!files || files.length === 0) return
      const f = files[0]
      setter(makeDoc(tipo, f))
      toast({ title: 'Documento adjuntado', message: f.name, variant: 'success' })
    }
  }

  function onSaveSend() {
    if (!p) return
    if (!editable) return
    const err = validate()
    if (Object.keys(err).length > 0) {
      setErrors(err)
      toast({ title: 'Validación', message: 'Corrija campos/documentos.', variant: 'danger' })
      return
    }
    setErrors({})

    const nextVersion = p.versionActual + 1
    const next: Postulacion = {
      ...p,
      resumen: alcance,
      financiamiento: {
        montoSolicitado: Number(montoSolicitado) || 0,
        cofinanciamiento: Number(cofinanciamiento) || 0,
        total,
      },
      adjuntos: [
        ...p.adjuntos.filter(
          (d) =>
            d.tipo !== 'DOCUMENTO_ADJUDICACION' &&
            d.tipo !== 'CONVENIO_ASOCIACION' &&
            d.tipo !== 'DOCUMENTO_LEGAL',
        ),
        docAdjudicacion!,
        ...(requiresAsociado && convenio ? [convenio] : []),
        ...(requiresAsociado && docLegal ? [docLegal] : []),
      ],
      versionActual: nextVersion,
      historial: [
        {
          version: nextVersion,
          createdAtIso: new Date().toISOString(),
          createdBy: 'Representante Facultad',
          changesSummary: 'Actualización para adjudicación (guardar y enviar)',
        },
        ...p.historial,
      ],
      estado: 'ENVIADO_PARA_EVALUACION',
    }

    upsertPostulacion(next)
    toast({
      title: 'Actualización enviada',
      message: `Versión ${nextVersion} remitida al Comité de Evaluación.`,
      variant: 'success',
    })
    nav('/postulaciones/seguimiento')
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Actualizar ficha para adjudicación</h1>
          <p className="mt-1 text-sm text-black/60">
            {p.codigo} · Versión {p.versionActual} · Estado {p.estado} · Participación {p.tipoParticipacion}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editable ? <Badge variant="success">Editable (adjudicado)</Badge> : <Badge variant="danger">Bloqueada</Badge>}
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Datos generales (referencia)</CardTitle>
              <CardDescription>Parte de la ficha base ya registrada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>Proyecto</Label>
                  <Input value={p.proyectoNombre} readOnly />
                </div>
                <div>
                  <Label>Facultad</Label>
                  <Input value={p.facultad} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financiamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Monto solicitado</Label>
                  <Input
                    type="number"
                    value={montoSolicitado}
                    onChange={(e) => setMontoSolicitado(Number(e.target.value))}
                    disabled={!editable}
                  />
                </div>
                <div>
                  <Label>Cofinanciamiento</Label>
                  <Input
                    type="number"
                    value={cofinanciamiento}
                    onChange={(e) => setCofinanciamiento(Number(e.target.value))}
                    disabled={!editable}
                  />
                </div>
                <div>
                  <Label>Total</Label>
                  <Input value={total} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alcance actualizado</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Descripción *</Label>
              <Textarea value={alcance} onChange={(e) => setAlcance(e.target.value)} disabled={!editable} />
              <FieldError message={errors.alcance} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documento de adjudicación</CardTitle>
              <CardDescription>Obligatorio en proyectos adjudicados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Documento de adjudicación (PDF) *</div>
                  {docAdjudicacion ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                </div>
                <div className="mt-1 text-xs text-black/50">
                  {docAdjudicacion ? docAdjudicacion.nombre : 'No adjuntado'}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={!editable}
                    onChange={(e) => attach(setDocAdjudicacion, 'DOCUMENTO_ADJUDICACION')(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!editable || !docAdjudicacion}
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
                <CardTitle>Convenio de asociación y documentos legales</CardTitle>
                <CardDescription>Aplican si existe entidad asociada.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Convenio de asociación (PDF) *</div>
                      {convenio ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-black/50">{convenio ? convenio.nombre : 'No adjuntado'}</div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={!editable}
                        onChange={(e) => attach(setConvenio, 'CONVENIO_ASOCIACION')(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!editable || !convenio}
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
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <input
                        type="file"
                        accept="application/pdf"
                        disabled={!editable}
                        onChange={(e) => attach(setDocLegal, 'DOCUMENTO_LEGAL')(e.target.files)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!editable || !docLegal}
                        onClick={() => setDocLegal(null)}
                      >
                        Quitar
                      </Button>
                    </div>
                    <FieldError message={errors.legal} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => nav('/')}>
              Cancelar
            </Button>
            <Button disabled={!editable || !restrictions.ok} onClick={onSaveSend}>
              Guardar y enviar
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Historial de versiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {p.historial.slice(0, 8).map((h) => (
                  <div key={h.version} className="rounded-xl border border-black/10 bg-white/60 p-3 text-xs">
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

          {!editable ? (
            <Card>
              <CardHeader>
                <CardTitle>Modo solo lectura</CardTitle>
                <CardDescription>
                  Si el convenio ya fue formalizado, la ficha queda bloqueada para edición.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" onClick={() => nav('/')}>
                  Volver
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

