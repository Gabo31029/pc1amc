import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { FieldError, Input, Label } from '../components/ui/Field'
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

export function ActualizarAsociacionPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { toast } = useToast()

  const p = id ? getPostulacion(id) : null
  const [razonSocial, setRazonSocial] = useState(p?.entidadAsociada?.razonSocial ?? '')
  const [ruc, setRuc] = useState(p?.entidadAsociada?.ruc ?? '')
  const [representante, setRepresentante] = useState(p?.entidadAsociada?.representante ?? '')
  const [correo, setCorreo] = useState(p?.entidadAsociada?.correo ?? '')
  const [docAsociacion, setDocAsociacion] = useState<DocumentoAdjunto | null>(() => {
    return p?.adjuntos.find((d) => d.tipo === 'DOCUMENTO_ASOCIACION') ?? null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editable = useMemo(() => {
    if (!p) return false
    if (p.contratoFirmado) return false
    if (p.convenioFormalizado) return false
    return true
  }, [p])

  const requires = useMemo(() => {
    if (!p) return { ok: false, reasons: ['Ficha no encontrada'] }
    const reasons: string[] = []
    if (!p.tieneEntidadAsociada) reasons.push('La ficha no contempla entidad externa asociada.')
    if (p.contratoFirmado) reasons.push('Contrato ya firmado: ficha bloqueada.')
    if (p.convenioFormalizado) reasons.push('Convenio formalizado: ficha bloqueada.')
    return { ok: reasons.length === 0, reasons }
  }, [p])

  function validate(): Record<string, string> {
    const err: Record<string, string> = {}
    if (!razonSocial.trim()) err.razonSocial = 'Razón social es obligatoria'
    if (!ruc.trim()) err.ruc = 'RUC es obligatorio'
    if (!representante.trim()) err.representante = 'Representante es obligatorio'
    if (!correo.trim() || !correo.includes('@')) err.correo = 'Correo inválido'
    if (!docAsociacion) err.doc = 'Debe adjuntar el documento de asociación (PDF)'
    return err
  }

  function onAttach(files: FileList | null) {
    if (!files || files.length === 0) return
    const f = files[0]
    setDocAsociacion(makeDoc('DOCUMENTO_ASOCIACION', f))
    toast({ title: 'Documento adjuntado', message: f.name, variant: 'success' })
  }

  function onSave() {
    if (!p) return
    if (!editable) return
    const err = validate()
    if (Object.keys(err).length > 0) {
      setErrors(err)
      toast({ title: 'Validación', message: 'Corrija campos y documento.', variant: 'danger' })
      return
    }
    setErrors({})

    const nextVersion = p.versionActual + 1
    const next: Postulacion = {
      ...p,
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      entidadAsociada: { razonSocial, ruc, representante, correo },
      adjuntos: [...p.adjuntos.filter((d) => d.tipo !== 'DOCUMENTO_ASOCIACION'), docAsociacion!],
      versionActual: nextVersion,
      historial: [
        {
          version: nextVersion,
          createdAtIso: new Date().toISOString(),
          createdBy: 'Representante Facultad',
          changesSummary: 'Actualización para asociación (nueva versión)',
        },
        ...p.historial,
      ],
    }

    upsertPostulacion(next)
    toast({
      title: 'Actualización guardada',
      message: `Se generó la versión ${nextVersion}.`,
      variant: 'success',
    })
    nav('/')
  }

  if (!p) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actualizar ficha para asociación</CardTitle>
          <CardDescription>No se encontró la ficha solicitada.</CardDescription>
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
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Actualizar ficha para asociación</h1>
          <p className="mt-1 text-sm text-black/60">
            Ficha base {p.codigo} · Versión actual {p.versionActual} · Estado {p.estado}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editable ? <Badge variant="info">Editable</Badge> : <Badge variant="danger">Bloqueada</Badge>}
        </div>
      </div>

      {!requires.ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold">Restricciones</div>
          <ul className="mt-1 list-disc pl-5">
            {requires.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cabecera</CardTitle>
              <CardDescription>Código, versión y estado de la ficha base.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>Código</Label>
                  <Input value={p.codigo} readOnly />
                </div>
                <div>
                  <Label>Versión vigente</Label>
                  <Input value={p.versionActual} readOnly />
                </div>
                <div className="md:col-span-2">
                  <Label>Estado</Label>
                  <Input value={p.estado} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entidad externa asociada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Razón social *</Label>
                  <Input
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    disabled={!editable}
                  />
                  <FieldError message={errors.razonSocial} />
                </div>
                <div>
                  <Label>RUC *</Label>
                  <Input value={ruc} onChange={(e) => setRuc(e.target.value)} disabled={!editable} />
                  <FieldError message={errors.ruc} />
                </div>
                <div>
                  <Label>Representante *</Label>
                  <Input
                    value={representante}
                    onChange={(e) => setRepresentante(e.target.value)}
                    disabled={!editable}
                  />
                  <FieldError message={errors.representante} />
                </div>
                <div className="md:col-span-2">
                  <Label>Correo *</Label>
                  <Input value={correo} onChange={(e) => setCorreo(e.target.value)} disabled={!editable} />
                  <FieldError message={errors.correo} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documento de asociación</CardTitle>
              <CardDescription>Al guardar se genera una nueva versión.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Documento de asociación (PDF) *</div>
                    <div className="text-xs text-black/50">
                      {docAsociacion ? `Adjunto: ${docAsociacion.nombre}` : 'No adjuntado'}
                    </div>
                  </div>
                  {docAsociacion ? <Badge variant="success">OK</Badge> : <Badge variant="warning">Falta</Badge>}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={!editable}
                    onChange={(e) => onAttach(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={!editable || !docAsociacion}
                    onClick={() => setDocAsociacion(null)}
                  >
                    Quitar
                  </Button>
                </div>
                <FieldError message={errors.doc} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => nav('/')}>
              Cancelar
            </Button>
            <Button disabled={!editable || !requires.ok} onClick={onSave}>
              Guardar actualización
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Historial de versiones</CardTitle>
              <CardDescription>La versión anterior se inactiva lógicamente al crear la nueva.</CardDescription>
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
                  Si el contrato ya fue firmado o el convenio formalizado, la ficha queda bloqueada.
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

