import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FieldError, Input, Label, Select, Textarea } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { createPostulacion, transitionEstado } from '../app/storage'
import { type DocumentoAdjunto, type DocumentoTipo, type Postulacion } from '../app/types'

const schema = z.object({
  proyectoNombre: z.string().min(3, 'Ingrese el nombre del proyecto'),
  facultad: z.string().min(2, 'Seleccione una facultad'),
  fondo: z.string().min(2, 'Ingrese el fondo concursable'),
  concurso: z.string().min(2, 'Ingrese el concurso'),
  tipoParticipacion: z.enum(['INDIVIDUAL', 'ASOCIADO']),
  objetivo: z.string().min(10, 'Ingrese un objetivo más detallado'),
  resumen: z.string().min(10, 'Ingrese un resumen más detallado'),
  incluyeInfraestructura: z.boolean(),
  incluyeIDiTT: z.boolean(),
  tieneEntidadAsociada: z.boolean(),
  // entidad asociada (condicional)
  entidadRazonSocial: z.string().optional(),
  entidadRuc: z.string().optional(),
  entidadRepresentante: z.string().optional(),
  entidadCorreo: z.string().email('Correo inválido').optional().or(z.literal('')),
  // financiamiento
  montoSolicitado: z
    .preprocess((v) => Number(v), z.number().min(0))
    .default(0),
  cofinanciamiento: z
    .preprocess((v) => Number(v), z.number().min(0))
    .default(0),
})

type FormValues = z.infer<typeof schema>

function genId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function makeAdjunto(tipo: DocumentoTipo, f: File): DocumentoAdjunto {
  return {
    id: genId(),
    tipo,
    nombre: f.name,
    mime: f.type || 'application/octet-stream',
    size: f.size,
    uploadedAtIso: new Date().toISOString(),
  }
}

const facultades = ['Ingeniería', 'Economía', 'Arquitectura', 'Ciencias', 'Derecho']

export function RegistrarFichaPage() {
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      tipoParticipacion: 'INDIVIDUAL',
      incluyeInfraestructura: false,
      incluyeIDiTT: false,
      tieneEntidadAsociada: false,
      montoSolicitado: 0,
      cofinanciamiento: 0,
    },
    mode: 'onBlur',
  })

  const w = form.watch()
  const total = useMemo(() => (w.montoSolicitado ?? 0) + (w.cofinanciamiento ?? 0), [w])
  const [currentDocs, setCurrentDocs] = useState<DocumentoAdjunto[]>([])

  const requiredDocs = useMemo(() => {
    const req: { tipo: DocumentoTipo; label: string; enabled: boolean }[] = [
      { tipo: 'OBLIGATORIO', label: 'Documentos obligatorios (PDF)', enabled: true },
      {
        tipo: 'INFORME_TECNICO_GRUPO_TECNICO',
        label: 'Informe técnico del Grupo Técnico (si infraestructura/equipamiento)',
        enabled: !!w.incluyeInfraestructura,
      },
      {
        tipo: 'VALIDACION_GRUPO_INVESTIGACION',
        label: 'Validación del Grupo de Investigación (si I+D+i+TT)',
        enabled: !!w.incluyeIDiTT,
      },
      {
        tipo: 'DOCUMENTO_ASOCIACION',
        label: 'Documento de asociación (si entidad asociada)',
        enabled: !!w.tieneEntidadAsociada,
      },
    ]
    return req.filter((x) => x.enabled)
  }, [w.incluyeIDiTT, w.incluyeInfraestructura, w.tieneEntidadAsociada])

  const missingDocs = requiredDocs.filter(
    (r) => !currentDocs.some((d) => d.tipo === r.tipo),
  )

  const canSubmit =
    form.formState.isValid &&
    missingDocs.length === 0 &&
    (!w.tieneEntidadAsociada ||
      (!!w.entidadRazonSocial &&
        !!w.entidadRuc &&
        !!w.entidadRepresentante &&
        !!w.entidadCorreo))

  function onAttach(tipo: DocumentoTipo, files: FileList | null) {
    if (!files || files.length === 0) return
    const f = files[0]
    const next = currentDocs.filter((d) => d.tipo !== tipo).concat(makeAdjunto(tipo, f))
    setCurrentDocs(next)
    toast({ title: 'Documento adjuntado', message: `${f.name}`, variant: 'success' })
  }

  function removeDoc(tipo: DocumentoTipo) {
    const next = currentDocs.filter((d) => d.tipo !== tipo)
    setCurrentDocs(next)
  }

  const saveDraft = form.handleSubmit((values) => {
    const p = createPostulacion({
      createdBy: 'Representante Facultad',
      proyectoNombre: values.proyectoNombre,
      facultad: values.facultad,
      fondo: values.fondo,
      concurso: values.concurso,
      estado: 'BORRADOR',
      tipoParticipacion: values.tipoParticipacion,
      tieneEntidadAsociada: values.tieneEntidadAsociada,
      incluyeInfraestructura: values.incluyeInfraestructura,
      incluyeIDiTT: values.incluyeIDiTT,
      objetivo: values.objetivo,
      resumen: values.resumen,
      cronograma: [],
      financiamiento: {
        montoSolicitado: values.montoSolicitado,
        cofinanciamiento: values.cofinanciamiento,
        total,
      },
      entidadAsociada: values.tieneEntidadAsociada
        ? {
            razonSocial: values.entidadRazonSocial ?? '',
            ruc: values.entidadRuc ?? '',
            representante: values.entidadRepresentante ?? '',
            correo: values.entidadCorreo ?? '',
          }
        : undefined,
      adjuntos: currentDocs,
      contratoFirmado: false,
      convenioFormalizado: false,
      adjudicado: false,
    } satisfies Omit<Postulacion, 'id' | 'codigo' | 'fechaRegistroIso' | 'versionActual' | 'historial'> & {
      createdBy: string
    })

    toast({
      title: 'Borrador guardado',
      message: `Se registró ${p.codigo} como BORRADOR`,
      variant: 'success',
    })
    form.reset()
    setCurrentDocs([])
  })

  const send = form.handleSubmit((values) => {
    if (!canSubmit) {
      toast({
        title: 'No se puede enviar',
        message: 'Complete campos obligatorios y documentos requeridos.',
        variant: 'danger',
      })
      return
    }

    const p = createPostulacion({
      createdBy: 'Representante Facultad',
      proyectoNombre: values.proyectoNombre,
      facultad: values.facultad,
      fondo: values.fondo,
      concurso: values.concurso,
      estado: 'ENVIADO_PARA_EVALUACION',
      tipoParticipacion: values.tipoParticipacion,
      tieneEntidadAsociada: values.tieneEntidadAsociada,
      incluyeInfraestructura: values.incluyeInfraestructura,
      incluyeIDiTT: values.incluyeIDiTT,
      objetivo: values.objetivo,
      resumen: values.resumen,
      cronograma: [],
      financiamiento: {
        montoSolicitado: values.montoSolicitado,
        cofinanciamiento: values.cofinanciamiento,
        total,
      },
      entidadAsociada: values.tieneEntidadAsociada
        ? {
            razonSocial: values.entidadRazonSocial ?? '',
            ruc: values.entidadRuc ?? '',
            representante: values.entidadRepresentante ?? '',
            correo: values.entidadCorreo ?? '',
          }
        : undefined,
      adjuntos: currentDocs,
      contratoFirmado: false,
      convenioFormalizado: false,
      adjudicado: false,
    } satisfies Omit<Postulacion, 'id' | 'codigo' | 'fechaRegistroIso' | 'versionActual' | 'historial'> & {
      createdBy: string
    })

    transitionEstado(p, 'ENVIADO_PARA_EVALUACION')

    toast({
      title: 'Ficha enviada',
      message: `Se envió ${p.codigo} para evaluación.`,
      variant: 'success',
    })
    form.reset()
    setCurrentDocs([])
  })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Nueva ficha de postulación</h1>
          <p className="mt-1 text-sm text-black/60">
            Complete el formulario y adjunte documentos antes de enviar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canSubmit ? 'success' : 'warning'}>
            {canSubmit ? 'Lista para enviar' : 'Requiere validación'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Datos generales del proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input {...form.register('proyectoNombre')} placeholder="Ej. Centro de datos verde" />
                  <FieldError message={form.formState.errors.proyectoNombre?.message} />
                </div>
                <div>
                  <Label>Facultad proponente *</Label>
                  <Select {...form.register('facultad')}>
                    <option value="">Seleccione...</option>
                    {facultades.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={form.formState.errors.facultad?.message} />
                </div>
                <div>
                  <Label>Tipo de participación *</Label>
                  <Select {...form.register('tipoParticipacion')}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="ASOCIADO">Asociado</option>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Objetivo *</Label>
                  <Textarea {...form.register('objetivo')} placeholder="Objetivo principal del proyecto..." />
                  <FieldError message={form.formState.errors.objetivo?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label>Resumen *</Label>
                  <Textarea {...form.register('resumen')} placeholder="Resumen ejecutivo..." />
                  <FieldError message={form.formState.errors.resumen?.message} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm">
                  <input type="checkbox" {...form.register('tieneEntidadAsociada')} />
                  Tiene entidad asociada
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm">
                  <input type="checkbox" {...form.register('incluyeInfraestructura')} />
                  Infraestructura / equipamiento
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm">
                  <input type="checkbox" {...form.register('incluyeIDiTT')} />
                  I+D+i+TT
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fondo concursable y concurso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Fondo concursable *</Label>
                  <Input {...form.register('fondo')} placeholder="Ej. Fondo Concursable 2026" />
                  <FieldError message={form.formState.errors.fondo?.message} />
                </div>
                <div>
                  <Label>Concurso *</Label>
                  <Input {...form.register('concurso')} placeholder="Ej. Concurso I+D 2026" />
                  <FieldError message={form.formState.errors.concurso?.message} />
                </div>
              </div>
            </CardContent>
          </Card>

          {w.tieneEntidadAsociada ? (
            <Card>
              <CardHeader>
                <CardTitle>Entidad externa asociada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Razón social *</Label>
                    <Input {...form.register('entidadRazonSocial')} />
                  </div>
                  <div>
                    <Label>RUC *</Label>
                    <Input {...form.register('entidadRuc')} />
                  </div>
                  <div>
                    <Label>Representante *</Label>
                    <Input {...form.register('entidadRepresentante')} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Correo *</Label>
                    <Input type="email" {...form.register('entidadCorreo')} />
                    <FieldError message={form.formState.errors.entidadCorreo?.message as string | undefined} />
                  </div>
                </div>
                <div className="mt-3 text-xs text-black/50">
                  Nota: si el contrato ya fue firmado, este flujo se bloqueará en la pantalla de actualización de asociación.
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Financiamiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Monto solicitado</Label>
                  <Input type="number" inputMode="numeric" {...form.register('montoSolicitado')} />
                </div>
                <div>
                  <Label>Cofinanciamiento</Label>
                  <Input type="number" inputMode="numeric" {...form.register('cofinanciamiento')} />
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
              <CardTitle>Documentos obligatorios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requiredDocs.map((r) => {
                  const doc = currentDocs.find((d) => d.tipo === r.tipo)
                  return (
                    <div
                      key={r.tipo}
                      className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-white/50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{r.label}</div>
                          <div className="text-xs text-black/50">
                            {doc ? `Adjunto: ${doc.nombre}` : 'No adjuntado'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc ? (
                            <>
                              <Badge variant="success">OK</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDoc(r.tipo)}
                              >
                                Quitar
                              </Button>
                            </>
                          ) : (
                            <Badge variant="warning">Falta</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => onAttach(r.tipo, e.target.files)}
                        />
                        <span className="text-xs text-black/40">PDF</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {missingDocs.length > 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Faltan documentos requeridos para el envío: {missingDocs.map((m) => m.label).join(' · ')}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={saveDraft}>
              Guardar borrador
            </Button>
            <Button type="button" disabled={!canSubmit} onClick={send}>
              Enviar ficha
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Estado del formulario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Validez</span>
                  <Badge variant={form.formState.isValid ? 'success' : 'warning'}>
                    {form.formState.isValid ? 'Campos OK' : 'Campos incompletos'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Documentos</span>
                  <Badge variant={missingDocs.length === 0 ? 'success' : 'warning'}>
                    {missingDocs.length === 0 ? 'Completos' : `Faltan ${missingDocs.length}`}
                  </Badge>
                </div>
                <div className="rounded-xl bg-black/5 p-3 text-xs text-black/60">
                  El sistema bloqueará el envío si faltan campos obligatorios o documentos requeridos.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validaciones dinámicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-black/60">
                <li>- Si hay entidad asociada: se habilita sección y documento de asociación.</li>
                <li>- Si hay infraestructura/equipamiento: se exige informe técnico del Grupo Técnico.</li>
                <li>- Si hay I+D+i+TT: se exige validación del Grupo de Investigación.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

