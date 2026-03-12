/**
 * ============================================================================
 * MODELS UTILITIES - Barrel Export
 * ============================================================================
 * 
 * This module exports all utility functions for the models layer.
 * 
 * @module models/utils
 */

// Generadores - ID, Date, Coordinate generation
export {
  generarIdUnico,
  generarIdSesion,
  generarIdAnalisis,
  generarIdHallazgo,
  generarFechaISO,
  generarFechaFormateada,
  generarDateTimeFormateado,
  generarCoordenadaAleatoria,
  generarCoordenadaAleatoriaConRango,
  validarCoordenadaEnRango,
  corregirCoordenada,
  generarRPN,
  generarNivelRiesgo,
  generarSeveridadEstimada,
  generarEfectividadEstimada,
  crearSesionVacia,
  crearSesionDemo,
} from './generadores';

// Transformadores - Data structure transformations
export {
  analisisHAZOPtoHallazgos,
  analisisFMEAtoHallazgos,
  analisisLOPAtoHallazgos,
  analisisOCAtoHallazgos,
  analisisIntuiciontoHallazgos,
  analisisToHallazgos,
  hallazgosToTablaData,
  clonarSesion,
  actualizarSesion,
  agregarHallazgoASesion,
  eliminarHallazgoDeSesion,
  actualizarHallazgoEnSesion,
} from './transformadores';

// Re-export types
export type {
  TransformResult,
  HallazgoTablaRow,
} from './transformadores';
