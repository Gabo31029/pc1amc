import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FieldError, Input, Label, Select, Textarea } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { useToast } from '../components/ui/Toast'
import { createPostulacion, transitionEstado } from '../app/storage'
import { clearPendingConcurso, getPendingConcurso } from '../app/auth'
import { type DocumentoAdjunto, type DocumentoTipo, type Postulacion } from '../app/types'
import { type ConcursoSeleccionado } from './ConcursosDisponibles'

function businessDaysUntil(from: Date, to: Date) {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
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

const schema = z.object({
  proyectoNombre: z.string().min(3, 'Ingrese el título del proyecto'),
  facultad: z.string().min(2, 'Seleccione una facultad'),
  fondo: z.string().min(2, 'Ingrese el fondo concursable'),
  concurso: z.string().min(2, 'Ingrese el concurso'),
  tipoParticipacion: z.enum(['INDIVIDUAL', 'ASOCIADO']),
  fechaCierreConcursoIso: z.string().min(10, 'Ingrese la fecha de cierre del concurso'),
  duracion: z.string().min(1, 'Ingrese la duración del proyecto'),
  objetivo: z.string().min(10, 'Ingrese un objetivo más detallado'),
  coordinadorGeneralNombre: z.string().min(5, 'Ingrese el nombre del coordinador general'),
  coordinadorGeneralEntidad: z.string().min(2, 'Ingrese la entidad del coordinador general'),
  coordinadorUniNombre: z.string().min(5, 'Ingrese el nombre del coordinador por parte de la uni'),
  confirmaVersionFinal: z.boolean(),
  incluyeInfraestructura: z.boolean(),
  incluyeIDiTT: z.boolean(),
  entidadAcompananteNombre: z.string().optional(),
})
.superRefine((values, ctx) => {
  if (values.tipoParticipacion === 'ASOCIADO' && !values.entidadAcompananteNombre?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['entidadAcompananteNombre'],
      message: 'Ingrese el nombre de la entidad acompañante',
    })
  }
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
  const navigate = useNavigate()
  const location = useLocation()
  const concursoSeleccionadoFromState = (location.state as { concursoSeleccionado?: ConcursoSeleccionado } | null)
    ?.concursoSeleccionado
  const concursoSeleccionado = concursoSeleccionadoFromState ?? (getPendingConcurso() as ConcursoSeleccionado | null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      tipoParticipacion: 'INDIVIDUAL',
      incluyeInfraestructura: false,
      incluyeIDiTT: false,
      confirmaVersionFinal: false,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!concursoSeleccionado) {
      toast({
        title: 'Seleccione un concurso',
        message: 'Para postular, primero elija un concurso desde la lista de concursos disponibles.',
        variant: 'danger',
      })
      navigate('/concursos', { replace: true })
      return
    }

    // Si venimos desde login (persistencia), limpiamos el pendiente al entrar al formulario.
    clearPendingConcurso()

    form.reset(
      {
        ...form.getValues(),
        fondo: concursoSeleccionado.fondo,
        concurso: concursoSeleccionado.concurso,
        fechaCierreConcursoIso: concursoSeleccionado.fechaLimiteIso,
      },
      { keepDefaultValues: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concursoSeleccionado?.id])

  const w = form.watch()
  const [currentDocs, setCurrentDocs] = useState<DocumentoAdjunto[]>([])

  const hasEntidadAsociada = w.tipoParticipacion === 'ASOCIADO'
  const cierreDate = useMemo(() => {
    const v = w.fechaCierreConcursoIso
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }, [w.fechaCierreConcursoIso])
  const businessDaysToClose = useMemo(() => {
    if (!cierreDate) return null
    return businessDaysUntil(new Date(), cierreDate)
  }, [cierreDate])
  const withinDeadline = businessDaysToClose === null ? false : businessDaysToClose >= 6

  const requiredDocs = useMemo(() => {
    const req: { tipo: DocumentoTipo; label: string; enabled: boolean }[] = [
      { tipo: 'CARTA_PRESENTACION', label: 'Carta de presentación', enabled: true },
      { tipo: 'CARTA_COMPROMISO_FACULTAD', label: 'Carta de compromiso (Facultad proponente)', enabled: true },
      { tipo: 'INFORME_TECNICO_POSTULACION', label: 'Informe Técnico de Postulación', enabled: true },
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
        tipo: 'FICHA_ASOCIACION',
        label: 'Ficha de asociación (si entidad asociada)',
        enabled: hasEntidadAsociada,
      },
    ]
    return req.filter((x) => x.enabled)
  }, [hasEntidadAsociada, w.incluyeIDiTT, w.incluyeInfraestructura])

  const missingDocs = requiredDocs.filter(
    (r) => !currentDocs.some((d) => d.tipo === r.tipo),
  )

  const canSubmit =
    form.formState.isValid &&
    missingDocs.length === 0 &&
    !!w.confirmaVersionFinal &&
    withinDeadline

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
      fechaCierreConcursoIso: values.fechaCierreConcursoIso,
      estado: 'BORRADOR',
      tipoParticipacion: values.tipoParticipacion,
      tieneEntidadAsociada: values.tipoParticipacion === 'ASOCIADO',
      incluyeInfraestructura: values.incluyeInfraestructura,
      incluyeIDiTT: values.incluyeIDiTT,
      objetivo: values.objetivo,
      resumen: '',
      duracion: values.duracion,
      coordinadorGeneralNombre: values.coordinadorGeneralNombre,
      coordinadorGeneralEntidad: values.coordinadorGeneralEntidad,
      coordinadorUniNombre: values.coordinadorUniNombre,
      confirmaVersionFinal: values.confirmaVersionFinal,
      cronograma: [],
      financiamiento: { montoSolicitado: 0, cofinanciamiento: 0, total: 0 },
      entidadAsociada:
        values.tipoParticipacion === 'ASOCIADO'
          ? { razonSocial: values.entidadAcompananteNombre ?? '', ruc: '', representante: '', correo: '' }
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
    if (!withinDeadline) {
      toast({
        title: 'Fuera de plazo',
        message:
          businessDaysToClose === null
            ? 'No se pudo validar la fecha de cierre del concurso.'
            : `No se permite enviar si faltan menos de 6 días hábiles. Días hábiles restantes: ${businessDaysToClose}.`,
        variant: 'danger',
      })
      return
    }

    if (!canSubmit) {
      toast({
        title: 'No se puede enviar',
        message: 'Complete campos obligatorios, confirme versión final y adjunte documentos requeridos.',
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
      fechaCierreConcursoIso: values.fechaCierreConcursoIso,
      estado: 'ENVIADO_PARA_EVALUACION',
      tipoParticipacion: values.tipoParticipacion,
      tieneEntidadAsociada: values.tipoParticipacion === 'ASOCIADO',
      incluyeInfraestructura: values.incluyeInfraestructura,
      incluyeIDiTT: values.incluyeIDiTT,
      objetivo: values.objetivo,
      resumen: '',
      duracion: values.duracion,
      coordinadorGeneralNombre: values.coordinadorGeneralNombre,
      coordinadorGeneralEntidad: values.coordinadorGeneralEntidad,
      coordinadorUniNombre: values.coordinadorUniNombre,
      confirmaVersionFinal: values.confirmaVersionFinal,
      cronograma: [],
      financiamiento: { montoSolicitado: 0, cofinanciamiento: 0, total: 0 },
      entidadAsociada:
        values.tipoParticipacion === 'ASOCIADO'
          ? { razonSocial: values.entidadAcompananteNombre ?? '', ruc: '', representante: '', correo: '' }
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
      <Card>
            <CardHeader>
              <CardTitle>Concurso seleccionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Fondo concursable</Label>
                  <Input value={concursoSeleccionado?.fondo ?? ''} readOnly />
                </div>
                <div>
                  <Label>Concurso</Label>
                  <Input value={concursoSeleccionado?.concurso ?? ''} readOnly />
                </div>
                <div>
                  <Label>Fecha límite</Label>
                  <Input value={concursoSeleccionado?.fechaLimiteIso ?? ''} readOnly />
                </div>
              </div>
              <div className="mt-3 text-xs text-black/55">
                Estos campos se completan automáticamente según el concurso elegido y no son editables.
              </div>
            </CardContent>
          </Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-black/50">Postulaciones</div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Nueva ficha de postulación</h1>
          <p className="mt-1 text-sm text-black/60">
            Complete el formulario y adjunte documentos antes de enviar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={withinDeadline ? 'info' : 'warning'}>
            {businessDaysToClose === null
              ? 'Plazo: sin validar'
              : withinDeadline
                ? `Plazo OK (${businessDaysToClose} días hábiles)`
                : `Fuera de plazo (${businessDaysToClose} días hábiles)`}
          </Badge>
          <Badge variant={canSubmit ? 'success' : 'warning'}>{canSubmit ? 'Lista para enviar' : 'Requiere validación'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Datos del proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Título del proyecto *</Label>
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
                    <option value="INDIVIDUAL">Entidad solicitante</option>
                    <option value="ASOCIADO">Entidad asociada</option>
                  </Select>
                </div>
                <div>
                  <Label>Duración del proyecto *</Label>
                  <Input {...form.register('duracion')} placeholder="Ej. 12 meses" />
                  <FieldError message={form.formState.errors.duracion?.message} />
                </div>
                <div>
                  <Label>Fecha de cierre del concurso *</Label>
                  <Input type="date" {...form.register('fechaCierreConcursoIso')} readOnly />
                  <FieldError message={form.formState.errors.fechaCierreConcursoIso?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label>Objetivo *</Label>
                  <Textarea {...form.register('objetivo')} placeholder="Objetivo principal del proyecto..." />
                  <FieldError message={form.formState.errors.objetivo?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label>Coordinador general (nombre completo) *</Label>
                  <Input {...form.register('coordinadorGeneralNombre')} placeholder="Nombres y apellidos" />
                  <FieldError message={form.formState.errors.coordinadorGeneralNombre?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label>Coordinador general (entidad) *</Label>
                  <Input {...form.register('coordinadorGeneralEntidad')} placeholder="Entidad a la que pertenece" />
                  <FieldError message={form.formState.errors.coordinadorGeneralEntidad?.message} />
                </div>
                <div className="md:col-span-2">
                  <Label>Coordinador por parte de la uni (nombre completo) *</Label>
                  <Input {...form.register('coordinadorUniNombre')} placeholder="Nombres y apellidos" />
                  <FieldError message={form.formState.errors.coordinadorUniNombre?.message} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm">
                  <input type="checkbox" {...form.register('incluyeInfraestructura')} />
                  Infraestructura / equipamiento
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/50 px-3 py-2 text-sm">
                  <input type="checkbox" {...form.register('incluyeIDiTT')} />
                  I+D+i+TT
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm mt-4">
                <input type="checkbox" {...form.register('confirmaVersionFinal')} />
                Cuento con la versión final de la ficha
              </label>
            </CardContent>
          </Card>

          {hasEntidadAsociada ? (
            <Card>
              <CardHeader>
                <CardTitle>Entidad asociada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Label>Nombre de la entidad acompañante *</Label>
                    <Input {...form.register('entidadAcompananteNombre')} placeholder="Entidad acompañante" />
                    <FieldError message={form.formState.errors.entidadAcompananteNombre?.message as string | undefined} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

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
              Remitir a Comité de Evaluación
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
                <li>- Si el tipo de participación es entidad asociada: se habilita nombre de entidad y ficha de asociación.</li>
                <li>- Si hay infraestructura/equipamiento: se exige informe técnico del Grupo Técnico.</li>
                <li>- Si hay I+D+i+TT: se exige validación del Grupo de Investigación.</li>
                <li>- Solo se permite remitir si faltan al menos 6 días hábiles para el cierre del concurso.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

