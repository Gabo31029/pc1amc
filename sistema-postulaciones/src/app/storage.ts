import { type Postulacion, type PostulacionEstado } from './types'

const KEY = 'amc.postulaciones.v1'

type Db = {
  postulaciones: Postulacion[]
}

function safeParse(json: string | null): Db | null {
  if (!json) return null
  try {
    return JSON.parse(json) as Db
  } catch {
    return null
  }
}

function nowIso() {
  return new Date().toISOString()
}

function genId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

function genCodigo(n: number) {
  const year = new Date().getFullYear()
  return `AMC-${year}-${String(n).padStart(4, '0')}`
}

function seedIfEmpty(db: Db): Db {
  if (db.postulaciones.length > 0) return db

  const base = (overrides: Partial<Postulacion> = {}): Postulacion => {
    const id = genId()
    const versionActual = 1
    const codigo = genCodigo(db.postulaciones.length + 1)
    return {
      id,
      codigo,
      proyectoNombre: 'Plataforma de Monitoreo Ambiental',
      facultad: 'Ingeniería',
      fondo: 'Fondo Concursable 2026',
      concurso: 'Concurso I+D 2026',
      fechaRegistroIso: nowIso(),
      estado: 'ENVIADO_PARA_EVALUACION',
      tipoParticipacion: 'INDIVIDUAL',
      tieneEntidadAsociada: false,
      incluyeInfraestructura: false,
      incluyeIDiTT: true,
      objetivo: 'Desarrollar un sistema de monitoreo ambiental con analítica predictiva.',
      resumen: 'Proyecto de investigación aplicada con transferencia tecnológica.',
      cronograma: [
        {
          actividad: 'Levantamiento de requerimientos',
          inicioIso: nowIso(),
          finIso: nowIso(),
        },
      ],
      financiamiento: { montoSolicitado: 50000, cofinanciamiento: 10000, total: 60000 },
      entidadAsociada: undefined,
      adjuntos: [],
      contratoFirmado: false,
      convenioFormalizado: false,
      adjudicado: false,
      versionActual,
      historial: [
        {
          version: 1,
          createdAtIso: nowIso(),
          createdBy: 'Representante Facultad',
          changesSummary: 'Creación de ficha base',
        },
      ],
      ...overrides,
    }
  }

  db.postulaciones.push(
    base({
      proyectoNombre: 'Laboratorio de Prototipado Rápido',
      facultad: 'Arquitectura',
      incluyeInfraestructura: true,
      incluyeIDiTT: false,
      estado: 'BORRADOR',
    }),
    base({
      proyectoNombre: 'Red de Innovación con Empresa Asociada',
      facultad: 'Economía',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'ENVIADO_PARA_EVALUACION',
    }),
    base({
      proyectoNombre: 'Centro de Datos Verde',
      facultad: 'Ingeniería',
      adjudicado: true,
      estado: 'ADJUDICADO',
    }),
    base({
      proyectoNombre: 'Consorcio de Investigación Formalizado',
      facultad: 'Ciencias',
      adjudicado: true,
      convenioFormalizado: true,
      estado: 'CONVENIO_FORMALIZADO',
    }),
  )

  return db
}

export function dbRead(): Db {
  const parsed = safeParse(window.localStorage.getItem(KEY))
  const db: Db = parsed ?? { postulaciones: [] }
  const seeded = seedIfEmpty(db)
  if (seeded !== db || parsed === null) dbWrite(seeded)
  return seeded
}

export function dbWrite(db: Db) {
  window.localStorage.setItem(KEY, JSON.stringify(db))
}

export function listPostulaciones() {
  return dbRead().postulaciones
}

export function getPostulacion(id: string) {
  return listPostulaciones().find((p) => p.id === id) ?? null
}

export function upsertPostulacion(p: Postulacion) {
  const db = dbRead()
  const idx = db.postulaciones.findIndex((x) => x.id === p.id)
  if (idx >= 0) db.postulaciones[idx] = p
  else db.postulaciones.unshift(p)
  dbWrite(db)
  return p
}

export function createPostulacion(
  input: Omit<Postulacion, 'id' | 'codigo' | 'fechaRegistroIso' | 'versionActual' | 'historial'> & {
    createdBy: string
  },
) {
  const db = dbRead()
  const id = genId()
  const codigo = genCodigo(db.postulaciones.length + 1)
  const createdAtIso = nowIso()
  const versionActual = 1
  const p: Postulacion = {
    ...input,
    id,
    codigo,
    fechaRegistroIso: createdAtIso,
    versionActual,
    historial: [
      {
        version: 1,
        createdAtIso,
        createdBy: input.createdBy,
        changesSummary: 'Creación de ficha',
      },
    ],
  }
  db.postulaciones.unshift(p)
  dbWrite(db)
  return p
}

export function transitionEstado(p: Postulacion, estado: PostulacionEstado) {
  return upsertPostulacion({ ...p, estado })
}

