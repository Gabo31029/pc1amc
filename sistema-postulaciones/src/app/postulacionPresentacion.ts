import type { PostulacionEstado, TipoParticipacion } from './types'

export type EstadoPostulacionVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

/** Etiqueta legible para el usuario (nunca códigos con guion bajo). */
export function etiquetaEstadoPostulacion(estado: PostulacionEstado): string {
  switch (estado) {
    case 'BORRADOR':
      return 'Borrador'
    case 'ENVIADO_PARA_EVALUACION':
      return 'Enviado a evaluación'
    case 'OBSERVADO':
      return 'Observado'
    case 'ADJUDICADO':
      return 'Adjudicado'
    case 'EN_EVALUACION':
      return 'En evaluación'
    case 'CONVENIO_FORMALIZADO':
      return 'Convenio formalizado'
    default:
      return String(estado)
  }
}

export function uiEstadoPostulacion(estado: PostulacionEstado): {
  label: string
  variant: EstadoPostulacionVariant
} {
  switch (estado) {
    case 'BORRADOR':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'default' }
    case 'ENVIADO_PARA_EVALUACION':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'info' }
    case 'OBSERVADO':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'warning' }
    case 'ADJUDICADO':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'success' }
    case 'EN_EVALUACION':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'info' }
    case 'CONVENIO_FORMALIZADO':
      return { label: etiquetaEstadoPostulacion(estado), variant: 'default' }
  }
}

export function etiquetaTipoParticipacion(tipo: TipoParticipacion): string {
  switch (tipo) {
    case 'INDIVIDUAL':
      return 'Individual'
    case 'ASOCIADO':
      return 'Con entidad asociada'
    default:
      return String(tipo)
  }
}
