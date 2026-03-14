/**
 * ============================================================================
 * HALLAZGO VALIDATORS - Validation Functions for Findings
 * ============================================================================
 * 
 * This module provides validation functions for all finding types (Peligro,
 * Barrera, POE, SOL). Validates location coordinates, required fields, and
 * cross-references between findings.
 * 
 * Validation Rules:
 * - Location coordinates must be 0-100 (percentages)
 * - Required fields must not be empty
 * - Numeric ranges must be within specified bounds
 * - Related IDs must reference existing entities
 * 
 * @module models/hallazgo/validators
 */

import type {
  Hallazgo,
  Peligro,
  Barrera,
  POE,
  SOL,
  Ubicacion,
  TipoHallazgo,
  Severidad,
  Efectividad,
} from './types';

// ============================================================================
// VALIDATION RESULT TYPE
// ============================================================================

/**
 * Result of a validation operation.
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valido: boolean;

  /** List of validation errors (empty if valid) */
  errores: string[];

  /** List of validation warnings (non-blocking issues) */
  advertencias?: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates that a string is not empty or whitespace-only.
 * @param value - String to validate
 * @param fieldName - Name of the field for error messages
 * @returns Error message or null if valid
 */
function validarStringRequerido(value: string | undefined | null, fieldName: string): string | null {
  if (!value || value.trim() === '') {
    return `${fieldName} es requerido y no puede estar vacío`;
  }
  return null;
}

/**
 * Validates that a number is within a specified range.
 * @param value - Number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param fieldName - Name of the field for error messages
 * @returns Error message or null if valid
 */
function validarRangoNumerico(
  value: number | undefined | null,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (value === undefined || value === null) {
    return `${fieldName} es requerido`;
  }
  if (typeof value !== 'number' || isNaN(value)) {
    return `${fieldName} debe ser un número válido`;
  }
  if (value < min || value > max) {
    return `${fieldName} debe estar entre ${min} y ${max} (valor actual: ${value})`;
  }
  return null;
}

/**
 * Validates that an array is not empty.
 * @param array - Array to validate
 * @param fieldName - Name of the field for error messages
 * @returns Error message or null if valid
 */
function validarArrayNoVacio(array: unknown[] | undefined, fieldName: string): string | null {
  if (!array || array.length === 0) {
    return `${fieldName} debe tener al menos un elemento`;
  }
  return null;
}

// ============================================================================
// LOCATION VALIDATOR
// ============================================================================

/**
 * Validates location coordinates for plant diagram positioning.
 * 
 * Rules:
 * - Both x and y must be between 0 and 100 (inclusive)
 * - Values represent percentages for responsive positioning
 * 
 * @param x - Horizontal coordinate (0-100)
 * @param y - Vertical coordinate (0-100)
 * @returns Validation result
 * 
 * @example
 * // Valid location
 * const result = validarUbicacion(50, 30);
 * if (result.valido) {
 *   console.log('Ubicación válida en el diagrama');
 * }
 * 
 * @example
 * // Invalid location (out of range)
 * const invalid = validarUbicacion(150, -10);
 * console.log(invalid.errores); // ["x debe estar entre 0 y 100", "y debe estar entre 0 y 100"]
 */
export function validarUbicacion(x: number, y: number): ValidationResult {
  const errores: string[] = [];

  const xError = validarRangoNumerico(x, 0, 100, 'x');
  if (xError) errores.push(xError);

  const yError = validarRangoNumerico(y, 0, 100, 'y');
  if (yError) errores.push(yError);

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validates an Ubicacion object.
 * @param ubicacion - Location object to validate
 * @returns Validation result
 */
export function validarUbicacionObject(ubicacion: Ubicacion): ValidationResult {
  return validarUbicacion(ubicacion.x, ubicacion.y);
}

// ============================================================================
// BASE HALLAZGO VALIDATOR
// ============================================================================

/**
 * Validates base hallazgo fields common to all types.
 * 
 * Required fields:
 * - id, titulo, descripcion
 * - ubicacion (valid coordinates 0-100)
 * - fechaCreacion (valid ISO date)
 * - tipo (valid finding type)
 * 
 * @param hallazgo - Base hallazgo data
 * @returns Validation result
 */
export function validarHallazgoBase(hallazgo: {
  id: string;
  tipo: TipoHallazgo;
  titulo: string;
  descripcion: string;
  ubicacion: Ubicacion;
  fechaCreacion: string;
  analisisOrigenIds: string[];
  hallazgosRelacionadosIds: string[];
}): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate ID
  const idError = validarStringRequerido(hallazgo.id, 'ID');
  if (idError) errores.push(idError);

  // Validate tipo
  const tiposValidos: TipoHallazgo[] = ['Peligro', 'Barrera', 'POE', 'SOL'];
  if (!tiposValidos.includes(hallazgo.tipo)) {
    errores.push(`Tipo de hallazgo inválido: ${hallazgo.tipo}. Debe ser: ${tiposValidos.join(', ')}`);
  }

  // Validate titulo
  const tituloError = validarStringRequerido(hallazgo.titulo, 'titulo');
  if (tituloError) errores.push(tituloError);

  // Validate descripcion
  const descripcionError = validarStringRequerido(hallazgo.descripcion, 'descripcion');
  if (descripcionError) errores.push(descripcionError);

  // Validate ubicacion only when explicitly provided with non-default values
  if (hallazgo.ubicacion && (hallazgo.ubicacion.x !== 0 || hallazgo.ubicacion.y !== 0)) {
    const ubicacionResult = validarUbicacionObject(hallazgo.ubicacion);
    errores.push(...ubicacionResult.errores);
  } else if (!hallazgo.ubicacion) {
    advertencias.push('ubicacion: El hallazgo no tiene posición en el esquemático (se usará posición por defecto)');
  }

  // Validate fechaCreacion
  if (!hallazgo.fechaCreacion || isNaN(Date.parse(hallazgo.fechaCreacion))) {
    errores.push('fechaCreacion debe ser una fecha ISO 8601 válida');
  }

  // Validate analisisOrigenIds (optional but should be array)
  if (!Array.isArray(hallazgo.analisisOrigenIds)) {
    errores.push('analisisOrigenIds debe ser un array');
  } else if (hallazgo.analisisOrigenIds.length === 0) {
    advertencias.push('advertencia: hallazgo sin análisis de origen. Se recomienda vincular a un análisis.');
  }

  // Validate hallazgosRelacionadosIds (optional)
  if (!Array.isArray(hallazgo.hallazgosRelacionadosIds)) {
    errores.push('hallazgosRelacionadosIds debe ser un array');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// PELIGRO (HAZARD) VALIDATOR
// ============================================================================

/**
 * Validates a Peligro (Hazard) finding.
 * 
 * Required fields:
 * - All base fields
 * - consecuencia, causaRaiz
 * - severidad (1-5)
 * 
 * @param peligro - Peligro data
 * @returns Validation result
 * 
 * @example
 * const result = validarPeligro({
 *   id: 'peligro-001',
 *   tipo: 'Peligro',
 *   titulo: 'Sobrepresión',
 *   descripcion: 'Riesgo de sobrepresión',
 *   ubicacion: { x: 45, y: 30 },
 *   fechaCreacion: '2024-01-01T00:00:00Z',
 *   analisisOrigenIds: ['hazop-001'],
 *   hallazgosRelacionadosIds: [],
 *   consecuencia: 'Ruptura del reactor',
 *   severidad: 5,
 *   causaRaiz: 'Diseño inadecuado'
 * });
 */
export function validarPeligro(peligro: Peligro): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate base fields
  const baseResult = validarHallazgoBase(peligro);
  errores.push(...baseResult.errores);
  advertencias.push(...(baseResult.advertencias || []));

  // Validate tipo is correct
  if (peligro.tipo !== 'Peligro') {
    errores.push(`tipo debe ser 'Peligro', pero se obtuvo '${peligro.tipo}'`);
  }

  // Validate consecuencia
  const consecuenciaError = validarStringRequerido(peligro.consecuencia, 'consecuencia');
  if (consecuenciaError) errores.push(consecuenciaError);

  // Validate severidad (1-5)
  const severidadError = validarRangoNumerico(peligro.severidad, 1, 5, 'severidad');
  if (severidadError) errores.push(severidadError);

  // Validate causaRaiz
  const causaRaizError = validarStringRequerido(peligro.causaRaiz, 'causaRaiz');
  if (causaRaizError) errores.push(causaRaizError);

  // Warn about high severity
  if (peligro.severidad !== undefined && peligro.severidad >= 4) {
    advertencias.push(`Severidad alta (${peligro.severidad}/5): Requiere barreras de protección críticas`);
  }

  if (peligro.severidad === 5) {
    advertencias.push('Severidad catastrófica (5): Debe tener múltiples capas de protección');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// BARRERA (BARRIER) VALIDATOR
// ============================================================================

/**
 * Validates a Barrera (Barrier) finding.
 * 
 * Required fields:
 * - All base fields
 * - tipoBarrera ('Fisica' | 'Administrativa' | 'Humana')
 * - efectividadEstimada (1-5)
 * - elementoProtegido
 * 
 * @param barrera - Barrera data
 * @returns Validation result
 */
export function validarBarrera(barrera: Barrera): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate base fields
  const baseResult = validarHallazgoBase(barrera);
  errores.push(...baseResult.errores);
  advertencias.push(...(baseResult.advertencias || []));

  // Validate tipo is correct
  if (barrera.tipo !== 'Barrera') {
    errores.push(`tipo debe ser 'Barrera', pero se obtuvo '${barrera.tipo}'`);
  }

  // Validate tipoBarrera
  const tiposBarreraValidos = ['Fisica', 'Administrativa', 'Humana'];
  if (!tiposBarreraValidos.includes(barrera.tipoBarrera)) {
    errores.push(`tipoBarrera inválido: ${barrera.tipoBarrera}. Debe ser: ${tiposBarreraValidos.join(', ')}`);
  }

  // Validate efectividadEstimada (1-5)
  const efectividadError = validarRangoNumerico(barrera.efectividadEstimada, 1, 5, 'efectividadEstimada');
  if (efectividadError) errores.push(efectividadError);

  // Validate elementoProtegido
  const elementoError = validarStringRequerido(barrera.elementoProtegido, 'elementoProtegido');
  if (elementoError) errores.push(elementoError);

  // Warn about low effectiveness
  if (barrera.efectividadEstimada !== undefined && barrera.efectividadEstimada <= 2) {
    advertencias.push(`Efectividad baja (${barrera.efectividadEstimada}/5): Considerar mejorar o agregar barreras adicionales`);
  }

  // Warn about standalone barriers (no related hazards)
  if (barrera.hallazgosRelacionadosIds.length === 0) {
    advertencias.push('Barrera sin hallazgos relacionados. Se recomienda vincular a un Peligro.');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// POE (SOP) VALIDATOR
// ============================================================================

/**
 * Validates a POE (Standard Operating Procedure) finding.
 * 
 * Required fields:
 * - All base fields
 * - procedimientoReferencia
 * - frecuenciaAplicacion
 * - responsable
 * 
 * @param poe - POE data
 * @returns Validation result
 */
export function validarPOE(poe: POE): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate base fields
  const baseResult = validarHallazgoBase(poe);
  errores.push(...baseResult.errores);
  advertencias.push(...(baseResult.advertencias || []));

  // Validate tipo is correct
  if (poe.tipo !== 'POE') {
    errores.push(`tipo debe ser 'POE', pero se obtuvo '${poe.tipo}'`);
  }

  // Validate procedimientoReferencia
  const procError = validarStringRequerido(poe.procedimientoReferencia, 'procedimientoReferencia');
  if (procError) errores.push(procError);

  // Validate frecuenciaAplicacion
  const freqError = validarStringRequerido(poe.frecuenciaAplicacion, 'frecuenciaAplicacion');
  if (freqError) errores.push(freqError);

  // Validate responsable
  const respError = validarStringRequerido(poe.responsable, 'responsable');
  if (respError) errores.push(respError);

  // Warn about standalone POEs
  if (poe.hallazgosRelacionadosIds.length === 0) {
    advertencias.push('POE sin hallazgos relacionados. Se recomienda vincular a un Peligro que controla.');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// SOL (PROTECTION LAYER) VALIDATOR
// ============================================================================

/**
 * Validates a SOL (Protection Layer) finding.
 * 
 * Required fields:
 * - All base fields
 * - capaNumero (>= 1)
 * - independiente (boolean)
 * - tipoTecnologia
 * 
 * @param sol - SOL data
 * @returns Validation result
 */
export function validarSOL(sol: SOL): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate base fields
  const baseResult = validarHallazgoBase(sol);
  errores.push(...baseResult.errores);
  advertencias.push(...(baseResult.advertencias || []));

  // Validate tipo is correct
  if (sol.tipo !== 'SOL') {
    errores.push(`tipo debe ser 'SOL', pero se obtuvo '${sol.tipo}'`);
  }

  // Validate capaNumero
  if (sol.capaNumero === undefined || sol.capaNumero < 1) {
    errores.push('capaNumero debe ser mayor o igual a 1');
  }

  // Validate independiente is boolean
  if (typeof sol.independiente !== 'boolean') {
    errores.push(`independiente debe ser booleano, pero se obtuvo '${typeof sol.independiente}'`);
  }

  // Validate tipoTecnologia
  const techError = validarStringRequerido(sol.tipoTecnologia, 'tipoTecnologia');
  if (techError) errores.push(techError);

  // Warn about non-independent layers
  if (sol.independiente === false) {
    advertencias.push('Capa de protección NO independiente. Esto reduce su efectividad como IPL.');
  }

  // Warn about first layer
  if (sol.capaNumero === 1) {
    advertencias.push('Primera capa de protección: Debe ser la línea primaria de defensa');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// GENERIC HALLAZGO VALIDATOR
// ============================================================================

/**
 * Validates any hallazgo type by dispatching to the specific validator.
 * 
 * @param hallazgo - Hallazgo data (any type)
 * @returns Validation result
 * 
 * @example
 * // Validate a Peligro
 * const peligroResult = validarHallazgoGenerico({
 *   id: 'peligro-001',
 *   tipo: 'Peligro',
 *   ...
 * });
 * 
 * // Validate a Barrera
 * const barreraResult = validarHallazgoGenerico({
 *   id: 'barrera-001',
 *   tipo: 'Barrera',
 *   ...
 * });
 */
export function validarHallazgoGenerico(hallazgo: Hallazgo): ValidationResult {
  switch (hallazgo.tipo) {
    case 'Peligro':
      return validarPeligro(hallazgo as Peligro);
    case 'Barrera':
      return validarBarrera(hallazgo as Barrera);
    case 'POE':
      return validarPOE(hallazgo as POE);
    case 'SOL':
      return validarSOL(hallazgo as SOL);
    default:
      return {
        valido: false,
        errores: [`Tipo de hallazgo no soportado: ${(hallazgo as Hallazgo).tipo}`],
      };
  }
}

// ============================================================================
// CROSS-REFERENCE VALIDATORS
// ============================================================================

/**
 * Validates that all analisisOrigenIds reference existing analyses.
 * 
 * @param hallazgo - Hallazgo to validate
 * @param analisisIds - List of valid analysis IDs in the session
 * @returns Validation result
 * 
 * @example
 * const validIds = ['hazop-001', 'fmea-001', 'lopa-001'];
 * const result = validarAnalisisOrigenIds(peligro, validIds);
 */
export function validarAnalisisOrigenIds(
  hallazgo: Hallazgo,
  analisisIds: string[]
): ValidationResult {
  const errores: string[] = [];

  for (const analisisId of hallazgo.analisisOrigenIds) {
    if (!analisisIds.includes(analisisId)) {
      errores.push(`analisisOrigenId '${analisisId}' no existe en la sesión`);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validates that all hallazgosRelacionadosIds reference existing findings.
 * 
 * @param hallazgo - Hallazgo to validate
 * @param hallazgoIds - List of valid hallazgo IDs in the session
 * @returns Validation result
 */
export function validarHallazgosRelacionadosIds(
  hallazgo: Hallazgo,
  hallazgoIds: string[]
): ValidationResult {
  const errores: string[] = [];

  for (const relacionadoId of hallazgo.hallazgosRelacionadosIds) {
    if (!hallazgoIds.includes(relacionadoId)) {
      errores.push(`hallazgoRelacionadoId '${relacionadoId}' no existe en la sesión`);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Complete validation of a hallazgo including cross-references.
 * 
 * @param hallazgo - Hallazgo to validate
 * @param analisisIds - List of valid analysis IDs
 * @param hallazgoIds - List of valid hallazgo IDs (excluding self for self-reference check)
 * @returns Combined validation result
 */
export function validarHallazgoCompleto(
  hallazgo: Hallazgo,
  analisisIds: string[],
  hallazgoIds: string[]
): ValidationResult {
  // First validate the hallazgo itself
  const tipoResult = validarHallazgoGenerico(hallazgo);
  const errores: string[] = [...tipoResult.errores];
  const advertencias: string[] = [...(tipoResult.advertencias || [])];

  // Then validate cross-references
  const analisisRefResult = validarAnalisisOrigenIds(hallazgo, analisisIds);
  errores.push(...analisisRefResult.errores);

  const relacionadosRefResult = validarHallazgosRelacionadosIds(hallazgo, hallazgoIds);
  errores.push(...relacionadosRefResult.errores);

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}
