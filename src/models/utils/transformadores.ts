/**
 * ============================================================================
 * TRANSFORMADORES - Data Structure Transformation Utilities
 * ============================================================================
 * 
 * This module provides pure functions for transforming data between
 * different structures:
 * - Analysis → Hallazgos (extracting findings from analysis methodologies)
 * - Hallazgos → Table data (formatting for display)
 * - Session cloning (for undo/redo functionality)
 * 
 * All functions integrate with validators to ensure data integrity before
 * transformation.
 * 
 * @module models/utils/transformadores
 */

import type {
  AnalisisOrigen,
  AnalisisHAZOP,
  AnalisisFMEA,
  AnalisisLOPA,
  AnalisisOCA,
  AnalisisIntuicion,
} from '../analisis/types';

import type {
  Hallazgo,
  Peligro,
  Barrera,
  POE,
  SOL,
  Ubicacion,
} from '../hallazgo/types';

import type { Sesion } from '../sesion/types';

// Import validators for data integrity
import {
  validarAnalisisHAZOP,
  validarAnalisisFMEA,
  validarAnalisisLOPA,
  validarAnalisisOCA,
  validarAnalisisIntuicion,
} from '../analisis/validators';

import { generarIdHallazgo, generarFechaISO, generarCoordenadaAleatoria } from './generadores';

// ============================================================================
// TRANSFORMATION RESULT TYPE
// ============================================================================

/**
 * Result of a transformation operation.
 */
export interface TransformResult<T> {
  /** Transformed data (empty array if validation failed) */
  datos: T[];

  /** Whether the transformation succeeded */
  exito: boolean;

  /** Validation errors (if any) */
  errores: string[];
}

// ============================================================================
// ANALYSIS → HALLAZGOS TRANSFORMERS
// ============================================================================

/**
 * Extracts hallazgos (findings) from a HAZOP analysis.
 * 
 * HAZOP produces:
 * - 1+ Peligro (from causa → consecuencia)
 * - Barreras (from salvaguardasExistentes)
 * - POE (from recomendaciones that are procedural)
 * 
 * @param analisis - HAZOP analysis data
 * @returns Transformation result with hallazgos
 * 
 * @example
 * const result = analisisHAZOPtoHallazgos({
 *   nodo: 'Reactor R-101',
 *   parametro: 'Presión',
 *   palabraGuia: 'Más de',
 *   causa: 'Falla en válvula',
 *   consecuencia: 'Sobrepresión',
 *   salvaguardasExistentes: ['PSV-101'],
 *   recomendaciones: ['Instalar manómetro']
 * });
 * 
 * if (result.exito) {
 *   console.log('Hallazgos:', result.datos);
 * }
 */
export function analisisHAZOPtoHallazgos(analisis: AnalisisHAZOP): TransformResult<Hallazgo> {
  // Validate HAZOP data first
  const validacion = validarAnalisisHAZOP(analisis);
  
  if (!validacion.valido) {
    return {
      datos: [],
      exito: false,
      errores: validacion.errores,
    };
  }

  const hallazgos: Hallazgo[] = [];
  const fechaISO = generarFechaISO();
  const ubicacionBase = generarCoordenadaAleatoria();

  // Create Peligro from HAZOP deviation
  const peligro: Peligro = {
    id: generarIdHallazgo('Peligro'),
    tipo: 'Peligro',
    titulo: `${analisis.parametro} - ${analisis.palabraGuia}`,
    descripcion: `${analisis.causa} → ${analisis.consecuencia}`,
    ubicacion: { ...ubicacionBase },
    fechaCreacion: fechaISO,
    analisisOrigenIds: [], // Will be populated by caller
    hallazgosRelacionadosIds: [],
    consecuencia: analisis.consecuencia,
    severidad: 4, // Default high for HAZOP deviations
    causaRaiz: analisis.causa,
  };
  hallazgos.push(peligro);

  // Create Barrera from existing safeguards
  for (const salvaguarda of analisis.salvaguardasExistentes) {
    const barrera: Barrera = {
      id: generarIdHallazgo('Barrera'),
      tipo: 'Barrera',
      titulo: salvaguarda,
      descripcion: `Salvaguarda existente para ${analisis.parametro}`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [peligro.id],
      tipoBarrera: 'Fisica', // Default assumption
      efectividadEstimada: 4,
      elementoProtegido: analisis.nodo,
    };
    hallazgos.push(barrera);
  }

  // Create POE from procedural recommendations
  for (const recomendacion of analisis.recomendaciones) {
    if (recomendacion.toLowerCase().includes('procedim') || 
        recomendacion.toLowerCase().includes('oper') ||
        recomendacion.toLowerCase().includes('instrucc')) {
      const poe: POE = {
        id: generarIdHallazgo('POE'),
        tipo: 'POE',
        titulo: recomendacion,
        descripcion: `Procedimiento recomendado para ${analisis.nodo}`,
        ubicacion: generarCoordenadaAleatoria(),
        fechaCreacion: fechaISO,
        analisisOrigenIds: [],
        hallazgosRelacionadosIds: [peligro.id],
        procedimientoReferencia: `POE-${analisis.nodo.replace(/\s/g, '-')}`,
        frecuenciaAplicacion: 'Según corresponda',
        responsable: 'Operador',
      };
      hallazgos.push(poe);
    }
  }

  return {
    datos: hallazgos,
    exito: true,
    errores: [],
  };
}

/**
 * Extracts hallazgos from a FMEA analysis.
 * 
 * FMEA produces:
 * - Peligro (from modoFalla → efecto)
 * - Barrera (from controlesActuales)
 * 
 * @param analisis - FMEA analysis data
 * @returns Transformation result with hallazgos
 */
export function analisisFMEAtoHallazgos(analisis: AnalisisFMEA): TransformResult<Hallazgo> {
  // Validate FMEA data first
  const validacion = validarAnalisisFMEA(analisis);
  
  if (!validacion.valido) {
    return {
      datos: [],
      exito: false,
      errores: validacion.errores,
    };
  }

  const hallazgos: Hallazgo[] = [];
  const fechaISO = generarFechaISO();

  // Create Peligro from failure mode
  const peligro: Peligro = {
    id: generarIdHallazgo('Peligro'),
    tipo: 'Peligro',
    titulo: `Falla: ${analisis.modoFalla}`,
    descripcion: `${analisis.causa} → ${analisis.efecto}`,
    ubicacion: generarCoordenadaAleatoria(),
    fechaCreacion: fechaISO,
    analisisOrigenIds: [],
    hallazgosRelacionadosIds: [],
    consecuencia: analisis.efecto,
    severidad: analisis.S as any, // FMEA S is 1-10, Peligro severidad is 1-5
    causaRaiz: analisis.causa,
  };
  hallazgos.push(peligro);

  // Create Barrera from current controls
  for (const control of analisis.controlesActuales) {
    const barrera: Barrera = {
      id: generarIdHallazgo('Barrera'),
      tipo: 'Barrera',
      titulo: control,
      descripcion: `Control actual para ${analisis.componente}`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [peligro.id],
      tipoBarrera: 'Administrativa', // Default assumption
      efectividadEstimada: 3,
      elementoProtegido: analisis.componente,
    };
    hallazgos.push(barrera);
  }

  return {
    datos: hallazgos,
    exito: true,
    errores: [],
  };
}

/**
 * Extracts hallazgos from a LOPA analysis.
 * 
 * LOPA produces:
 * - Peligro (from escenario → consecuencia)
 * - SOL (from capasIPL - Independent Protection Layers)
 * 
 * @param analisis - LOPA analysis data
 * @returns Transformation result with hallazgos
 */
export function analisisLOPAtoHallazgos(analisis: AnalisisLOPA): TransformResult<Hallazgo> {
  // Validate LOPA data first
  const validacion = validarAnalisisLOPA(analisis);
  
  if (!validacion.valido) {
    return {
      datos: [],
      exito: false,
      errores: validacion.errores,
    };
  }

  const hallazgos: Hallazgo[] = [];
  const fechaISO = generarFechaISO();

  // Create Peligro from LOPA scenario
  const peligro: Peligro = {
    id: generarIdHallazgo('Peligro'),
    tipo: 'Peligro',
    titulo: `Escenario: ${analisis.escenario.substring(0, 50)}...`,
    descripcion: `${analisis.escenario} → ${analisis.consecuencia}`,
    ubicacion: generarCoordenadaAleatoria(),
    fechaCreacion: fechaISO,
    analisisOrigenIds: [],
    hallazgosRelacionadosIds: [],
    consecuencia: analisis.consecuencia,
    severidad: 5, // LOPA typically analyzes high-consequence scenarios
    causaRaiz: analisis.escenario,
  };
  hallazgos.push(peligro);

  // Create SOL from IPL layers
  analisis.capasIPL.forEach((capa, index) => {
    const sol: SOL = {
      id: generarIdHallazgo('SOL'),
      tipo: 'SOL',
      titulo: capa.nombre,
      descripcion: `Capa de protección independiente ${index + 1}`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [peligro.id],
      capaNumero: index + 1,
      independiente: true, // By definition, IPLs are independent
      tipoTecnologia: capa.pfd < 0.01 ? 'SIS' : 'BPCS',
    };
    hallazgos.push(sol);
  });

  return {
    datos: hallazgos,
    exito: true,
    errores: [],
  };
}

/**
 * Extracts hallazgos from an OCA analysis.
 * 
 * OCA produces:
 * - Peligro (from eventoIniciador → consecuencia)
 * - Barrera (from barrerasExistentes)
 * - POE (from recomendaciones)
 * - SOL (if gaps indicate need for independent layers)
 * 
 * @param analisis - OCA analysis data
 * @returns Transformation result with hallazgos
 */
export function analisisOCAtoHallazgos(analisis: AnalisisOCA): TransformResult<Hallazgo> {
  // Validate OCA data first
  const validacion = validarAnalisisOCA(analisis);
  
  if (!validacion.valido) {
    return {
      datos: [],
      exito: false,
      errores: validacion.errores,
    };
  }

  const hallazgos: Hallazgo[] = [];
  const fechaISO = generarFechaISO();

  // Create Peligro from initiating event
  const peligro: Peligro = {
    id: generarIdHallazgo('Peligro'),
    tipo: 'Peligro',
    titulo: `Evento: ${analisis.eventoIniciador.substring(0, 50)}...`,
    descripcion: `${analisis.eventoIniciador} → ${analisis.consecuencia}`,
    ubicacion: generarCoordenadaAleatoria(),
    fechaCreacion: fechaISO,
    analisisOrigenIds: [],
    hallazgosRelacionadosIds: [],
    consecuencia: analisis.consecuencia,
    severidad: 4,
    causaRaiz: analisis.eventoIniciador,
  };
  hallazgos.push(peligro);

  // Create Barrera from existing barriers
  for (const barreraStr of analisis.barrerasExistentes) {
    const barrera: Barrera = {
      id: generarIdHallazgo('Barrera'),
      tipo: 'Barrera',
      titulo: barreraStr,
      descripcion: `Barrera existente para ${analisis.eventoIniciador}`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [peligro.id],
      tipoBarrera: 'Fisica',
      efectividadEstimada: 3,
      elementoProtegido: analisis.consecuencia,
    };
    hallazgos.push(barrera);
  }

  // Create POE from recommendations
  for (const recomendacion of analisis.recomendaciones) {
    const poe: POE = {
      id: generarIdHallazgo('POE'),
      tipo: 'POE',
      titulo: recomendacion,
      descripcion: `Recomendación OCA: abordar gap`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [peligro.id],
      procedimientoReferencia: `POE-OCA-${Date.now()}`,
      frecuenciaAplicacion: 'Según corresponda',
      responsable: 'A definir',
    };
    hallazgos.push(poe);
  }

  return {
    datos: hallazgos,
    exito: true,
    errores: [],
  };
}

/**
 * Extracts hallazgos from an Intuicion analysis.
 * 
 * Intuicion produces:
 * - Peligro (from observaciones)
 * 
 * @param analisis - Intuicion analysis data
 * @returns Transformation result with hallazgos
 */
export function analisisIntuiciontoHallazgos(analisis: AnalisisIntuicion): TransformResult<Hallazgo> {
  // Validate Intuicion data first
  const validacion = validarAnalisisIntuicion(analisis);
  
  if (!validacion.valido) {
    return {
      datos: [],
      exito: false,
      errores: validacion.errores,
    };
  }

  const hallazgos: Hallazgo[] = [];
  const fechaISO = generarFechaISO();

  // Create Peligro from observations
  for (const observacion of analisis.observaciones) {
    const peligro: Peligro = {
      id: generarIdHallazgo('Peligro'),
      tipo: 'Peligro',
      titulo: `${analisis.titulo} - Observación`,
      descripcion: `${analisis.descripcion}\n\nObservación: ${observacion}`,
      ubicacion: generarCoordenadaAleatoria(),
      fechaCreacion: fechaISO,
      analisisOrigenIds: [],
      hallazgosRelacionadosIds: [],
      consecuencia: 'Por evaluar',
      severidad: 3, // Default medium for intuitive findings
      causaRaiz: observacion,
    };
    hallazgos.push(peligro);
  }

  return {
    datos: hallazgos,
    exito: true,
    errores: [],
  };
}

// ============================================================================
// GENERIC ANALYSIS → HALLAZGOS DISPATCHER
// ============================================================================

/**
 * Extracts hallazgos from any analysis type by dispatching to specific transformer.
 * 
 * @param analisis - Complete analysis with base and datos
 * @returns Transformation result with hallazgos
 * 
 * @example
 * const result = analisisToHallazgos({
 *   base: { id: 'hazop-001', tipo: 'HAZOP', ... },
 *   datos: { nodo: 'R-101', parametro: 'Presión', ... }
 * });
 * 
 * if (result.exito) {
 *   console.log('Hallazgos extraídos:', result.datos.length);
 * }
 */
export function analisisToHallazgos(analisis: AnalisisOrigen): TransformResult<Hallazgo> {
  switch (analisis.base.tipo) {
    case 'HAZOP':
      return analisisHAZOPtoHallazgos(analisis.datos as AnalisisHAZOP);
    case 'FMEA':
      return analisisFMEAtoHallazgos(analisis.datos as AnalisisFMEA);
    case 'LOPA':
      return analisisLOPAtoHallazgos(analisis.datos as AnalisisLOPA);
    case 'OCA':
      return analisisOCAtoHallazgos(analisis.datos as AnalisisOCA);
    case 'Intuicion':
      return analisisIntuiciontoHallazgos(analisis.datos as AnalisisIntuicion);
    default:
      return {
        datos: [],
        exito: false,
        errores: [`Tipo de análisis no soportado: ${analisis.base.tipo}`],
      };
  }
}

// ============================================================================
// HALLAZGOS → TABLE DATA TRANSFORMER
// ============================================================================

/**
 * Table row structure for hallazgo display.
 */
export interface HallazgoTablaRow {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  ubicacion: string; // Formatted as "x, y"
  fechaCreacion: string;
  analisisOrigenCount: number;
  hallazgosRelacionadosCount: number;
  // Type-specific fields
  consecuencia?: string;
  severidad?: number;
  tipoBarrera?: string;
  efectividadEstimada?: number;
  procedimientoReferencia?: string;
  capaNumero?: number;
  independiente?: boolean;
}

/**
 * Formats hallazgos for table display.
 * 
 * @param hallazgos - Array of hallazgos to format
 * @returns Array of table rows
 * 
 * @example
 * const tableData = hallazgosToTablaData([peligro, barrera, poe]);
 * // Result: [{ id: 'peligro-001', tipo: 'Peligro', titulo: '...', ... }, ...]
 */
export function hallazgosToTablaData(hallazgos: Hallazgo[]): HallazgoTablaRow[] {
  return hallazgos.map((h) => {
    const baseRow: HallazgoTablaRow = {
      id: h.id,
      tipo: h.tipo,
      titulo: h.titulo,
      descripcion: h.descripcion,
      ubicacion: `${h.ubicacion.x}, ${h.ubicacion.y}`,
      fechaCreacion: h.fechaCreacion,
      analisisOrigenCount: h.analisisOrigenIds.length,
      hallazgosRelacionadosCount: h.hallazgosRelacionadosIds.length,
    };

    // Add type-specific fields
    if (h.tipo === 'Peligro') {
      const peligro = h as Peligro;
      baseRow.consecuencia = peligro.consecuencia;
      baseRow.severidad = peligro.severidad;
    } else if (h.tipo === 'Barrera') {
      const barrera = h as Barrera;
      baseRow.tipoBarrera = barrera.tipoBarrera;
      baseRow.efectividadEstimada = barrera.efectividadEstimada;
    } else if (h.tipo === 'POE') {
      const poe = h as POE;
      baseRow.procedimientoReferencia = poe.procedimientoReferencia;
    } else if (h.tipo === 'SOL') {
      const sol = h as SOL;
      baseRow.capaNumero = sol.capaNumero;
      baseRow.independiente = sol.independiente;
    }

    return baseRow;
  });
}

// ============================================================================
// SESSION HELPERS
// ============================================================================

/**
 * Deep clones a session for undo/redo functionality.
 * 
 * @param sesion - Session to clone
 * @returns Deep copy of the session
 * 
 * @example
 * // Save state before modification
 * const sesionAnterior = clonarSesion(sesionActual);
 * 
 * // ... make modifications ...
 * 
 * // Restore if needed
 * sesion = sesionAnterior;
 */
export function clonarSesion(sesion: Sesion): Sesion {
  return JSON.parse(JSON.stringify(sesion)) as Sesion;
}

/**
 * Creates a shallow copy of session with specific fields updated.
 * Useful for immutable state updates in React.
 * 
 * @param sesion - Original session
 * @param updates - Fields to update
 * @returns New session with updates applied
 * 
 * @example
 * const nuevaSesion = actualizarSesion(sesion, {
 *   vistaActiva: 'tabla'
 * });
 */
export function actualizarSesion(
  sesion: Sesion,
  updates: Partial<Sesion>
): Sesion {
  return {
    ...sesion,
    ...updates,
  };
}

/**
 * Adds a hallazgo to session immutably.
 * 
 * @param sesion - Original session
 * @param hallazgo - Hallazgo to add
 * @returns New session with hallazgo added
 */
export function agregarHallazgoASesion(sesion: Sesion, hallazgo: Hallazgo): Sesion {
  return {
    ...sesion,
    hallazgos: [...sesion.hallazgos, hallazgo],
  };
}

/**
 * Removes a hallazgo from session immutably.
 * 
 * @param sesion - Original session
 * @param hallazgoId - ID of hallazgo to remove
 * @returns New session with hallazgo removed
 */
export function eliminarHallazgoDeSesion(sesion: Sesion, hallazgoId: string): Sesion {
  return {
    ...sesion,
    hallazgos: sesion.hallazgos.filter(h => h.id !== hallazgoId),
  };
}

/**
 * Updates a hallazgo in session immutably.
 * 
 * @param sesion - Original session
 * @param hallazgoId - ID of hallazgo to update
 * @param updates - Fields to update
 * @returns New session with hallazgo updated
 */
export function actualizarHallazgoEnSesion(
  sesion: Sesion,
  hallazgoId: string,
  updates: Partial<Hallazgo>
): Sesion {
  return {
    ...sesion,
    hallazgos: sesion.hallazgos.map((h): Hallazgo =>
      h.id === hallazgoId ? { ...h, ...updates } as Hallazgo : h
    ),
  };
}
