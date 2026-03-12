/**
 * ============================================================================
 * GENERADORES - ID, Date, and Coordinate Generation Utilities
 * ============================================================================
 * 
 * This module provides pure functions for generating common values used
 * throughout the risk mapping application:
 * - Unique IDs with prefixes
 * - ISO timestamps
 * - Random coordinates for plant diagram positioning
 * - Risk calculations (RPN, risk levels)
 * 
 * All functions are pure (no side effects) and deterministic given the same inputs.
 * 
 * @module models/utils/generadores
 */

import type { AnalisisOrigen } from '../analisis/types';
import type { Hallazgo } from '../hallazgo/types';
import type { Sesion } from '../sesion/types';

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generates a unique ID with prefix, timestamp, and random suffix.
 * 
 * Format: "{prefix}-{timestamp}-{random}"
 * Example: "analisis-1710345678-a1b2c3"
 * 
 * @param prefix - String prefix to identify the entity type
 * @returns Unique ID string
 * 
 * @example
 * // Generate analysis ID
 * const analisisId = generarIdUnico('analisis');
 * // Result: "analisis-1710345678-a1b2c3"
 * 
 * @example
 * // Generate hallazgo ID
 * const hallazgoId = generarIdUnico('peligro');
 * // Result: "peligro-1710345678-x9y8z7"
 */
export function generarIdUnico(prefix: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(36).substring(2, 8); // 6 char random
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a session ID with date format.
 * 
 * Format: "sesion-YYYYMMDD-NNN"
 * Example: "sesion-20240312-001"
 * 
 * @returns Session ID string
 * 
 * @example
 * const sessionId = generarIdSesion();
 * // Result: "sesion-20240312-042" (random last 3 digits)
 */
export function generarIdSesion(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `sesion-${year}${month}${day}-${random}`;
}

/**
 * Generates a unique ID for an analysis based on its type.
 * 
 * @param tipoAnalisis - Type of analysis (HAZOP, FMEA, LOPA, OCA, Intuicion)
 * @returns Unique analysis ID
 * 
 * @example
 * const hazopId = generarIdAnalisis('HAZOP');
 * // Result: "hazop-1710345678-a1b2c3"
 */
export function generarIdAnalisis(tipoAnalisis: string): string {
  const prefix = tipoAnalisis.toLowerCase();
  return generarIdUnico(prefix);
}

/**
 * Generates a unique ID for a hallazgo based on its type.
 * 
 * @param tipoHallazgo - Type of finding (Peligro, Barrera, POE, SOL)
 * @returns Unique hallazgo ID
 * 
 * @example
 * const peligroId = generarIdHallazgo('Peligro');
 * // Result: "peligro-1710345678-x9y8z7"
 */
export function generarIdHallazgo(tipoHallazgo: string): string {
  const prefix = tipoHallazgo.toLowerCase();
  return generarIdUnico(prefix);
}

// ============================================================================
// DATE/TIME GENERATION
// ============================================================================

/**
 * Generates current ISO 8601 timestamp.
 * 
 * @returns ISO timestamp string
 * 
 * @example
 * const fecha = generarFechaISO();
 * // Result: "2024-03-12T15:30:45.123Z"
 */
export function generarFechaISO(): string {
  return new Date().toISOString();
}

/**
 * Generates a formatted date string for display.
 * 
 * @param date - Optional date (defaults to now)
 * @param locale - Locale for formatting (default: 'es-ES' for Spanish)
 * @returns Formatted date string
 * 
 * @example
 * const fechaFormateada = generarFechaFormateada();
 * // Result: "12/3/2024" (Spanish format)
 * 
 * @example
 * const fechaUS = generarFechaFormateada(new Date(), 'en-US');
 * // Result: "3/12/2024" (US format)
 */
export function generarFechaFormateada(date?: Date, locale: string = 'es-ES'): string {
  const dateToUse = date || new Date();
  return dateToUse.toLocaleDateString(locale);
}

/**
 * Generates a formatted datetime string for display.
 * 
 * @param date - Optional date (defaults to now)
 * @param locale - Locale for formatting (default: 'es-ES')
 * @returns Formatted datetime string
 * 
 * @example
 * const dateTime = generarDateTimeFormateado();
 * // Result: "12/3/2024, 15:30:45"
 */
export function generarDateTimeFormateado(date?: Date, locale: string = 'es-ES'): string {
  const dateToUse = date || new Date();
  return dateToUse.toLocaleString(locale);
}

// ============================================================================
// COORDINATE GENERATION
// ============================================================================

/**
 * Generates random coordinates for plant diagram positioning.
 * 
 * @returns Object with x and y values (both 0-100)
 * 
 * @example
 * const coords = generarCoordenadaAleatoria();
 * // Result: { x: 45, y: 67 }
 */
export function generarCoordenadaAleatoria(): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * 101), // 0-100 inclusive
    y: Math.floor(Math.random() * 101),
  };
}

/**
 * Generates random coordinates with optional constraints.
 * 
 * @param minX - Minimum x value (default: 0)
 * @param maxX - Maximum x value (default: 100)
 * @param minY - Minimum y value (default: 0)
 * @param maxY - Maximum y value (default: 100)
 * @returns Object with x and y values within constraints
 * 
 * @example
 * // Generate coordinates in top-left quadrant
 * const coords = generarCoordenadaAleatoriaConRango(0, 50, 0, 50);
 * // Result: { x: 23, y: 41 }
 */
export function generarCoordenadaAleatoriaConRango(
  minX: number = 0,
  maxX: number = 100,
  minY: number = 0,
  maxY: number = 100
): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * (maxX - minX + 1)) + minX,
    y: Math.floor(Math.random() * (maxY - minY + 1)) + minY,
  };
}

/**
 * Validates if coordinates are within the valid range (0-100).
 * 
 * @param x - Horizontal coordinate
 * @param y - Vertical coordinate
 * @returns True if both coordinates are valid (0-100)
 * 
 * @example
 * validarCoordenadaEnRango(50, 30); // true
 * validarCoordenadaEnRango(150, 30); // false
 * validarCoordenadaEnRango(50, -10); // false
 */
export function validarCoordenadaEnRango(x: number, y: number): boolean {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

/**
 * Validates and corrects coordinates to be within range.
 * If out of range, clamps to nearest valid value.
 * 
 * @param x - Horizontal coordinate
 * @param y - Vertical coordinate
 * @returns Corrected coordinates (always 0-100)
 * 
 * @example
 * corregirCoordenada(150, -10); // { x: 100, y: 0 }
 */
export function corregirCoordenada(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
}

// ============================================================================
// NUMERIC VALUE GENERATION
// ============================================================================

/**
 * Calculates Risk Priority Number (RPN) from S, O, D ratings.
 * 
 * Formula: RPN = Severity × Occurrence × Detection
 * Range: 1-1000
 * 
 * @param severidad - Severity rating (1-10)
 * @param ocurrencia - Occurrence rating (1-10)
 * @param deteccion - Detection rating (1-10)
 * @returns RPN value (1-1000)
 * 
 * @example
 * const rpn = generarRPN(7, 4, 3);
 * // Result: 84 (7 × 4 × 3)
 */
export function generarRPN(severidad: number, ocurrencia: number, deteccion: number): number {
  return severidad * ocurrencia * deteccion;
}

/**
 * Determines risk level based on RPN value.
 * 
 * Thresholds:
 * - Bajo (Low): RPN 1-100
 * - Medio (Medium): RPN 101-400
 * - Alto (High): RPN 401-1000
 * 
 * @param rpn - Risk Priority Number (1-1000)
 * @returns Risk level: 'Bajo' | 'Medio' | 'Alto'
 * 
 * @example
 * generarNivelRiesgo(50);   // 'Bajo'
 * generarNivelRiesgo(200);  // 'Medio'
 * generarNivelRiesgo(600);  // 'Alto'
 */
export function generarNivelRiesgo(rpn: number): 'Bajo' | 'Medio' | 'Alto' {
  if (rpn <= 100) {
    return 'Bajo';
  } else if (rpn <= 400) {
    return 'Medio';
  } else {
    return 'Alto';
  }
}

/**
 * Generates a severity rating (1-5) based on consequence description length.
 * This is a heuristic helper for quick assessments.
 * 
 * @param consecuencia - Consequence description
 * @returns Estimated severity (1-5)
 * 
 * @example
 * // Long, detailed consequence suggests high severity
 * generarSeveridadEstimada("Ruptura del reactor con liberación de material tóxico...");
 * // Result: 5
 */
export function generarSeveridadEstimada(consecuencia: string): number {
  const length = consecuencia.length;
  if (length < 30) return 2;
  if (length < 60) return 3;
  if (length < 100) return 4;
  return 5;
}

/**
 * Generates an effectiveness rating (1-5) based on barrier type.
 * This is a heuristic helper for initial estimates.
 * 
 * @param tipoBarrera - Type of barrier
 * @returns Estimated effectiveness (1-5)
 * 
 * @example
 * generarEfectividadEstimada('Fisica'); // 4 (physical barriers are reliable)
 * generarEfectividadEstimada('Humana'); // 2 (human actions less reliable)
 */
export function generarEfectividadEstimada(tipoBarrera: string): number {
  switch (tipoBarrera.toLowerCase()) {
    case 'fisica':
      return 4; // Physical barriers are generally reliable
    case 'administrativa':
      return 3; // Administrative controls vary in effectiveness
    case 'humana':
      return 2; // Human actions are least reliable
    default:
      return 3; // Default medium estimate
  }
}

// ============================================================================
// SESSION GENERATION
// ============================================================================

/**
 * Creates an empty session with default values.
 * 
 * @param imagenInicial - Optional initial plant diagram path
 * @returns Empty session object
 * 
 * @example
 * const sesion = crearSesionVacia();
 * // Result: { id: "sesion-20240312-042", analisis: [], hallazgos: [], ... }
 * 
 * @example
 * const sesionConImagen = crearSesionVacia('/diagrams/planta-01.png');
 */
export function crearSesionVacia(imagenInicial?: string): Sesion {
  return {
    id: generarIdSesion(),
    analisis: [],
    hallazgos: [],
    relaciones: [],
    imagenActual: imagenInicial ?? '/diagrams/default-plant.png',
    filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
    vistaActiva: 'mapa',
  };
}

/**
 * Creates a session with sample data for testing/demo purposes.
 * 
 * @returns Session with sample analysis and findings
 * 
 * @example
 * const sesionDemo = crearSesionDemo();
 */
export function crearSesionDemo(): Sesion {
  const fechaISO = generarFechaISO();
  const analisisId = generarIdAnalisis('HAZOP');
  const peligroId = generarIdHallazgo('Peligro');
  const barreraId = generarIdHallazgo('Barrera');
  
  return {
    id: generarIdSesion(),
    analisis: [
      {
        base: {
          id: analisisId,
          tipo: 'HAZOP',
          fechaCreacion: fechaISO,
          estado: 'completado',
          analisisRelacionadosIds: [],
        },
        datos: {
          nodo: 'Reactor R-101',
          parametro: 'Presión',
          palabraGuia: 'Más de',
          causa: 'Falla en válvula de control',
          consecuencia: 'Sobrepresión en el reactor',
          salvaguardasExistentes: ['PSV-101'],
          recomendaciones: ['Instalar manómetro'],
        },
      },
    ],
    hallazgos: [
      {
        id: peligroId,
        tipo: 'Peligro',
        titulo: 'Sobrepresión en Reactor',
        descripcion: 'Riesgo de sobrepresión durante operación',
        ubicacion: { x: 45, y: 30 },
        fechaCreacion: fechaISO,
        analisisOrigenIds: [analisisId],
        hallazgosRelacionadosIds: [barreraId],
        consecuencia: 'Ruptura del reactor',
        severidad: 5,
        causaRaiz: 'Diseño inadecuado',
      },
      {
        id: barreraId,
        tipo: 'Barrera',
        titulo: 'Válvula de Alivio PSV-101',
        descripcion: 'Alivia presión cuando excede setpoint',
        ubicacion: { x: 47, y: 32 },
        fechaCreacion: fechaISO,
        analisisOrigenIds: [analisisId],
        hallazgosRelacionadosIds: [peligroId],
        tipoBarrera: 'Fisica',
        efectividadEstimada: 4,
        elementoProtegido: 'Reactor R-101',
      },
    ],
    relaciones: [],
    imagenActual: '/diagrams/default-plant.png',
    filtrosActivos: ['Peligro', 'Barrera', 'POE', 'SOL'],
    vistaActiva: 'mapa',
  };
}
