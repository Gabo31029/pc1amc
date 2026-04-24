export type PostulacionEstado =
  | 'BORRADOR'
  | 'ENVIADO_PARA_EVALUACION'
  | 'OBSERVADO'
  | 'ADJUDICADO'
  | 'CONVENIO_FORMALIZADO'

export type TipoParticipacion = 'INDIVIDUAL' | 'ASOCIADO'

export type DocumentoTipo =
  | 'CARTA_PRESENTACION'
  | 'CARTA_COMPROMISO_FACULTAD'
  | 'INFORME_TECNICO_POSTULACION'
  | 'INFORME_TECNICO_GRUPO_TECNICO'
  | 'VALIDACION_GRUPO_INVESTIGACION'
  | 'FICHA_ASOCIACION'
  | 'DOCUMENTO_ADJUDICACION'
  | 'CONVENIO_ASOCIACION'
  | 'DOCUMENTO_LEGAL'

export type DocumentoAdjunto = {
  id: string
  tipo: DocumentoTipo
  nombre: string
  mime: string
  size: number
  uploadedAtIso: string
}

export type EntidadAsociada = {
  razonSocial: string
  ruc: string
  representante: string
  correo: string
}

export type CronogramaItem = {
  actividad: string
  inicioIso: string
  finIso: string
}

export type Financiamiento = {
  montoSolicitado: number
  cofinanciamiento: number
  total: number
}

export type PostulacionVersion = {
  version: number
  createdAtIso: string
  createdBy: string
  changesSummary: string
}

export type Postulacion = {
  id: string
  codigo: string
  proyectoNombre: string
  facultad: string
  fondo: string
  concurso: string
  fechaCierreConcursoIso?: string
  fechaRegistroIso: string
  estado: PostulacionEstado
  tipoParticipacion: TipoParticipacion

  // Flags de negocio
  tieneEntidadAsociada: boolean
  incluyeInfraestructura: boolean
  incluyeIDiTT: boolean
  confirmaVersionFinal?: boolean

  // Datos
  duracion?: string
  objetivo: string
  resumen: string
  coordinadorGeneralNombre?: string
  coordinadorGeneralEntidad?: string
  coordinadorUniNombre?: string
  cronograma: CronogramaItem[]
  financiamiento: Financiamiento

  entidadAsociada?: EntidadAsociada
  adjuntos: DocumentoAdjunto[]

  contratoFirmado: boolean
  convenioFormalizado: boolean
  adjudicado: boolean

  versionActual: number
  historial: PostulacionVersion[]
}

