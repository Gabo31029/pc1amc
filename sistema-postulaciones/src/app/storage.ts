import { type Postulacion, type PostulacionEstado } from './types'

/** v3: más fichas Ingeniería con asociación para el listado de facultad. */
const KEY = 'amc.postulaciones.v3'

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

function isoDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/** Fin del día local en ISO (límite inclusive para edición de ficha adjudicación). */
function endOfLocalDayIso(daysFromToday: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
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
      fechaLimiteActualizacionAdjudicacionIso: endOfLocalDayIso(45),
      criteriosEvaluacion: 'Impacto científico, viabilidad técnica, sostenibilidad.',
      beneficiosProyecto: 'Reducción de huella energética en campus.',
      objetivosEstrategicosIds: ['sostenibilidad', 'i_d'],
    }),
    base({
      proyectoNombre: 'Consorcio I+D con entidad asociada (Ingeniería)',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'ENVIADO_PARA_EVALUACION',
      fechaRegistroIso: isoDaysAgo(1),
      entidadAsociada: {
        razonSocial: 'Empresa Asociada Demo S.A.C.',
        ruc: '20987654321',
        representante: 'María Vargas',
        correo: 'contacto@empresa-asociada.demo',
      },
    }),
    base({
      proyectoNombre: 'Hub IoT industrial — asociación (borrador)',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'BORRADOR',
      fechaRegistroIso: isoDaysAgo(2),
      entidadAsociada: {
        razonSocial: 'Industrias Norte S.A.',
        ruc: '20555123456',
        representante: 'Carlos Peña',
        correo: 'cpena@indnorte.demo',
      },
    }),
    base({
      proyectoNombre: 'Energías renovables en campus (observado)',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'OBSERVADO',
      fechaRegistroIso: isoDaysAgo(3),
      entidadAsociada: {
        razonSocial: 'GreenEnergy Perú S.A.C.',
        ruc: '20666777888',
        representante: 'Lucía Ramos',
        correo: 'lramos@greenenergy.demo',
      },
    }),
    base({
      proyectoNombre: 'Materiales compuestos aeroespaciales',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'ENVIADO_PARA_EVALUACION',
      fechaRegistroIso: isoDaysAgo(4),
      entidadAsociada: {
        razonSocial: 'AeroMat Consortium',
        ruc: '20111222333',
        representante: 'Jorge Salas',
        correo: 'jsalas@aeromat.demo',
      },
    }),
    base({
      proyectoNombre: 'Bioseguridad y laboratorio (adjudicado + asociado)',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      adjudicado: true,
      estado: 'ADJUDICADO',
      fechaRegistroIso: isoDaysAgo(5),
      entidadAsociada: {
        razonSocial: 'BioLab Partners S.A.',
        ruc: '20444555666',
        representante: 'Patricia Núñez',
        correo: 'pnunez@biolab.demo',
      },
    }),
    base({
      proyectoNombre: 'Telemetría fluvial con empresa',
      facultad: 'Ingeniería',
      tieneEntidadAsociada: true,
      tipoParticipacion: 'ASOCIADO',
      estado: 'ENVIADO_PARA_EVALUACION',
      fechaRegistroIso: isoDaysAgo(6),
      entidadAsociada: {
        razonSocial: 'HidroSur Medición S.R.L.',
        ruc: '20888999000',
        representante: 'Ricardo Moya',
        correo: 'rmoya@hidrosur.demo',
      },
    }),
    base({
      proyectoNombre: 'Proyecto sin asociación (Ingeniería) — no aplica flujo',
      facultad: 'Ingeniería',
      tipoParticipacion: 'INDIVIDUAL',
      tieneEntidadAsociada: false,
      estado: 'BORRADOR',
      fechaRegistroIso: isoDaysAgo(10),
    }),
    base({
      proyectoNombre: 'Consorcio de Investigación Formalizado',
      facultad: 'Ciencias',
      adjudicado: true,
      convenioFormalizado: true,
      estado: 'CONVENIO_FORMALIZADO',
      fechaLimiteActualizacionAdjudicacionIso: endOfLocalDayIso(-1),
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

