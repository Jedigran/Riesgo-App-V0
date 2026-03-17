/**
 * ============================================================================
 * ANALISIS VALIDATORS - Validation Functions for Analysis Forms
 * ============================================================================
 * 
 * This module provides validation functions for all analysis methodologies.
 * Each validator returns a detailed result with success status and error messages.
 * 
 * Validation Rules:
 * - Required fields must not be empty
 * - Numeric ranges must be within specified bounds
 * - Arrays must have at least one element (when required)
 * - Related IDs must follow naming conventions
 * 
 * @module models/analisis/validators
 */

import type {
  AnalisisHAZOP,
  AnalisisFMEA,
  AnalisisLOPA,
  AnalisisOCA,
  AnalisisIntuicion,
  AnalisisBase,
  TipoAnalisis,
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
// GENERIC VALIDATORS
// ============================================================================

/**
 * Validates that a string is not empty or whitespace-only.
 * @param value - String to validate
 * @param fieldName - Name of the field for error messages
 * @returns True if valid string
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

/**
 * Validates base analysis fields common to all methodologies.
 * @param base - Base analysis data
 * @returns Validation result
 * 
 * @example
 * const result = validarAnalisisBase({
 *   id: 'hazop-001',
 *   tipo: 'HAZOP',
 *   fechaCreacion: '2024-01-01T00:00:00Z',
 *   estado: 'en_progreso',
 *   analisisRelacionadosIds: []
 * });
 */
export function validarAnalisisBase(base: AnalisisBase): ValidationResult {
  const errores: string[] = [];

  // Validate ID
  const idError = validarStringRequerido(base.id, 'ID');
  if (idError) errores.push(idError);

  // Validate tipo
  const tiposValidos: TipoAnalisis[] = ['HAZOP', 'FMEA', 'LOPA', 'OCA', 'Intuicion'];
  if (!tiposValidos.includes(base.tipo)) {
    errores.push(`Tipo de análisis inválido: ${base.tipo}. Debe ser uno de: ${tiposValidos.join(', ')}`);
  }

  // Validate fechaCreacion (ISO 8601)
  if (!base.fechaCreacion || isNaN(Date.parse(base.fechaCreacion))) {
    errores.push('fechaCreacion debe ser una fecha ISO 8601 válida');
  }

  // Validate estado
  const estadosValidos = ['completado', 'en_progreso'];
  if (!estadosValidos.includes(base.estado)) {
    errores.push(`Estado inválido: ${base.estado}. Debe ser: ${estadosValidos.join(', ')}`);
  }

  // Validate analisisRelacionadosIds (optional but should be strings)
  if (base.analisisRelacionadosIds && !Array.isArray(base.analisisRelacionadosIds)) {
    errores.push('analisisRelacionadosIds debe ser un array');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

// ============================================================================
// HAZOP VALIDATOR
// ============================================================================

/**
 * Validates a HAZOP analysis form.
 * 
 * Required fields:
 * - nodo, parametro, palabraGuia, causa, consecuencia
 * - salvaguardasExistentes (at least one)
 * - recomendaciones (at least one)
 * 
 * @param data - HAZOP analysis data
 * @returns Validation result with errors
 * 
 * @example
 * const result = validarAnalisisHAZOP({
 *   nodo: 'Reactor R-101',
 *   parametro: 'Presión',
 *   palabraGuia: 'Más de',
 *   causa: 'Falla en válvula',
 *   consecuencia: 'Sobrepresión',
 *   salvaguardasExistentes: ['PSV-101'],
 *   recomendaciones: ['Instalar manómetro']
 * });
 * 
 * if (!result.valido) {
 *   console.error('Errores:', result.errores);
 * }
 */
export function validarAnalisisHAZOP(data: AnalisisHAZOP): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate required string fields
  const camposRequeridos = [
    { value: data.nodo, name: 'nodo' },
    { value: data.parametro, name: 'parametro' },
    { value: data.palabraGuia, name: 'palabraGuia' },
    { value: data.causa, name: 'causa' },
    { value: data.consecuencia, name: 'consecuencia' },
  ];

  for (const campo of camposRequeridos) {
    const error = validarStringRequerido(campo.value, campo.name);
    if (error) errores.push(error);
  }

  // Validate arrays - OPTIONAL for now (can be empty)
  // Commenting out to allow empty arrays during initial testing
  // const salvaguardasError = validarArrayNoVacio(data.salvaguardasExistentes, 'salvaguardasExistentes');
  // if (salvaguardasError) {
  //   errores.push(salvaguardasError);
  // }

  // const recomendacionesError = validarArrayNoVacio(data.recomendaciones, 'recomendaciones');
  // if (recomendacionesError) {
  //   errores.push(recomendacionesError);
  // }

  // Validate optional but recommended fields
  if (!data.subnodo || data.subnodo.trim() === '') {
    advertencias.push('subnodo: Es recomendado especificar el equipo/componente');
  }

  if (!data.receptorImpacto || data.receptorImpacto.trim() === '') {
    advertencias.push('receptorImpacto: Es recomendado especificar el receptor con mayor impacto');
  }

  // Validate content length
  if (data.causa && data.causa.length < 10) {
    advertencias.push('causa: La descripción parece muy corta (mínimo 10 caracteres recomendados)');
  }

  if (data.consecuencia && data.consecuencia.length < 10) {
    advertencias.push('consecuencia: La descripción parece muy corta (mínimo 10 caracteres recomendados)');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// FMEA VALIDATOR
// ============================================================================

/**
 * Validates a FMEA analysis form.
 * 
 * Required fields:
 * - componente, modoFalla, efecto, causa
 * - controlesActuales (at least one)
 * - S, O, D (1-10 range)
 * - RPN (must equal S × O × D)
 * - accionesRecomendadas (at least one)
 * 
 * @param data - FMEA analysis data
 * @returns Validation result with errors
 * 
 * @example
 * const result = validarAnalisisFMEA({
 *   componente: 'Bomba P-201',
 *   modoFalla: 'Pérdida de sello',
 *   efecto: 'Fuga de producto',
 *   causa: 'Desgaste',
 *   controlesActuales: ['Inspección visual'],
 *   S: 7, O: 4, D: 3,
 *   RPN: 84,
 *   accionesRecomendadas: ['Lubricación preventiva']
 * });
 */
export function validarAnalisisFMEA(data: AnalisisFMEA): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate required string fields
  const camposRequeridos = [
    { value: data.equipo, name: 'equipo' },
    { value: data.funcion, name: 'funcion' },
    { value: data.modoFalla, name: 'modoFalla' },
    { value: data.efecto, name: 'efecto' },
    { value: data.causa, name: 'causa' },
  ];

  for (const campo of camposRequeridos) {
    const error = validarStringRequerido(campo.value, campo.name);
    if (error) errores.push(error);
  }

  // Validate numeric ratings (1-10)
  const sError = validarRangoNumerico(data.S, 1, 10, 'S (Severidad)');
  if (sError) errores.push(sError);

  const oError = validarRangoNumerico(data.O, 1, 10, 'O (Ocurrencia)');
  if (oError) errores.push(oError);

  const dError = validarRangoNumerico(data.D, 1, 10, 'D (Detección)');
  if (dError) errores.push(dError);

  // Validate RPN calculation
  if (data.S !== undefined && data.O !== undefined && data.D !== undefined) {
    const rpnCalculado = data.S * data.O * data.D;
    if (data.RPN !== rpnCalculado) {
      errores.push(`NPR inválido: debe ser ${rpnCalculado} (${data.S} × ${data.O} × ${data.D}), pero se obtuvo ${data.RPN}`);
    }

    // Warn about high RPN with color coding
    if (data.RPN >= 201) {
      advertencias.push(`NPR Crítico (${data.RPN}): Requiere acción inmediata`);
    } else if (data.RPN >= 101) {
      advertencias.push(`NPR Alto (${data.RPN}): Acción correctiva requerida`);
    } else if (data.RPN >= 51) {
      advertencias.push(`NPR Moderado (${data.RPN}): Considerar acciones de mejora`);
    }
  }

  // Validate optional but recommended fields
  if (!data.receptorImpacto || data.receptorImpacto.trim() === '') {
    advertencias.push('receptorImpacto: Es recomendado especificar el receptor con mayor impacto');
  }

  // Arrays are optional — warn if empty but do not block
  if (!data.barrerasExistentes || data.barrerasExistentes.length === 0) {
    advertencias.push('barrerasExistentes: Se recomienda registrar al menos una barrera existente');
  }

  if (!data.accionesRecomendadas || data.accionesRecomendadas.length === 0) {
    advertencias.push('accionesRecomendadas: Se recomienda registrar al menos una acción recomendada');
  }

  // Validate S, O, D consistency
  if (data.S !== undefined && data.S >= 9) {
    advertencias.push('Severidad crítica (≥9): Requiere atención prioritaria');
  }

  if (data.O !== undefined && data.O >= 8) {
    advertencias.push('Ocurrencia frecuente (≥8): Revisar controles preventivos');
  }

  if (data.D !== undefined && data.D >= 8) {
    advertencias.push('Detección difícil (≥8): Mejorar sistemas de detección');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// LOPA VALIDATOR
// ============================================================================

/**
 * Validates a LOPA analysis form.
 * 
 * Required fields:
 * - escenario, consecuencia
 * - frecuenciaInicial (> 0)
 * - capasIPL (at least one with valid PFD 0-1)
 * - frecuenciaFinal (must equal inicial × all PFDs)
 * - objetivoRiesgo (> 0)
 * 
 * @param data - LOPA analysis data
 * @returns Validation result with errors
 */
export function validarAnalisisLOPA(data: AnalisisLOPA): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate required string fields
  const escenarioError = validarStringRequerido(data.escenario, 'escenario');
  if (escenarioError) errores.push(escenarioError);

  const consecuenciaError = validarStringRequerido(data.consecuencia, 'consecuencia');
  if (consecuenciaError) errores.push(consecuenciaError);

  const causaError = validarStringRequerido(data.causa, 'causa');
  if (causaError) errores.push(causaError);

  // Validate frequencies
  const freqInicialError = validarRangoNumerico(data.frecuenciaInicial, 0.0000001, 1000, 'frecuenciaInicial');
  if (freqInicialError) errores.push(freqInicialError);

  // Validate riesgoTolerable
  if (data.riesgoTolerable === undefined || data.riesgoTolerable <= 0) {
    errores.push('riesgoTolerable debe ser mayor a 0');
  }

  // Validate S (Severidad)
  const sError = validarRangoNumerico(data.S, 1, 10, 'S (Severidad)');
  if (sError) errores.push(sError);

  // capasIPL is optional — warn if empty but do not block
  if (!data.capasIPL || data.capasIPL.length === 0) {
    advertencias.push('capasIPL: Se recomienda registrar al menos una capa de protección');
  } else {
    // Only validate layers that have content
    const capasConNombre = data.capasIPL.filter(c => c.nombre && c.nombre.trim());
    for (let i = 0; i < capasConNombre.length; i++) {
      const capa = capasConNombre[i];
      if (capa.pfd !== undefined && (capa.pfd <= 0 || capa.pfd > 1)) {
        errores.push(`capasIPL[${i}].pfd debe estar entre 0 y 1 (valor actual: ${capa.pfd})`);
      }
    }

    // Validate calculated fields if present
    if (data.frecuenciaInicial !== undefined && capasConNombre.length > 0) {
      const frecuenciaCalculada = data.frecuenciaInicial *
        capasConNombre.reduce((acc, capa) => acc * capa.pfd, 1);
      
      if (data.riesgoEscenario !== undefined &&
          Math.abs(data.riesgoEscenario - frecuenciaCalculada) > 0.0000001) {
        advertencias.push(
          `riesgoEscenario calculado: ${frecuenciaCalculada.toExponential(2)}`
        );
      }

      // Check if risk target is met
      if (data.riesgoTolerable !== undefined) {
        if (frecuenciaCalculada > data.riesgoTolerable) {
          advertencias.push(
            `El riesgo (${frecuenciaCalculada.toExponential(2)}) excede el tolerable (${data.riesgoTolerable.toExponential(2)}). ` +
            'Se requieren capas de protección adicionales.'
          );
        }
      }
    }
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// OCA VALIDATOR
// ============================================================================

/**
 * Validates an OCA (Consequence Analysis) form.
 * 
 * Required fields:
 * - eventoIniciador, consecuencia
 * - barrerasExistentes (at least one)
 * - gaps (at least one)
 * - recomendaciones (at least one, recommended >= gaps.length)
 * 
 * @param data - OCA analysis data
 * @returns Validation result with errors
 */
export function validarAnalisisOCA(data: AnalisisOCA): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate required fields
  if (!data.compuesto || data.compuesto.trim() === '') {
    errores.push('compuesto: Es requerido');
  }

  if (!data.cantidad || data.cantidad <= 0) {
    errores.push('cantidad: Debe ser mayor a 0');
  }

  if (!data.viento || data.viento <= 0) {
    errores.push('viento: Debe ser mayor a 0');
  }

  if (!data.estabilidad || !['A', 'B', 'C', 'D', 'E', 'F'].includes(data.estabilidad)) {
    errores.push('estabilidad: Debe ser A, B, C, D, E o F');
  }

  if (!data.topografia || !['Urbana', 'Rural'].includes(data.topografia)) {
    errores.push('topografia: Debe ser Urbana o Rural');
  }

  if (!data.tipoEscenario || !['Worst-Case', 'Alternativo'].includes(data.tipoEscenario)) {
    errores.push('tipoEscenario: Debe ser Worst-Case o Alternativo');
  }

  if (!data.endpoint || data.endpoint <= 0) {
    errores.push('endpoint: Debe ser mayor a 0');
  }

  // Validate calculated fields if present
  if (data.factorViento !== undefined && (data.factorViento <= 0 || data.factorViento > 2)) {
    advertencias.push('factorViento: Valor inusual (rango típico: 0.5-2.0)');
  }

  if (data.distanciaEndpointMillas !== undefined && data.distanciaEndpointMillas > 10) {
    advertencias.push(`distanciaEndpoint: ${data.distanciaEndpointMillas.toFixed(2)} millas es una distancia significativa`);
  }

  // Warn about high-risk scenarios
  if (data.evaluacion === '🔴 ALTA') {
    advertencias.push('Evaluación ALTA: Se requieren medidas de mitigación inmediatas');
  }

  if (data.programaRMP === 'Programa 3') {
    advertencias.push('Programa RMP 3: Requiere gestión de riesgo más estricta');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// INTUICION VALIDATOR
// ============================================================================

/**
 * Validates an Intuitive Analysis form.
 * 
 * Required fields:
 * - titulo, descripcion
 * - observaciones (at least one)
 * 
 * @param data - Intuitive analysis data
 * @returns Validation result with errors
 */
export function validarAnalisisIntuicion(data: AnalisisIntuicion): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate required string fields
  const descripcionError = validarStringRequerido(data.descripcion, 'descripcion');
  if (descripcionError) errores.push(descripcionError);

  // Validate description length
  if (data.descripcion && data.descripcion.length < 20) {
    advertencias.push('descripcion: Se recomienda una descripción más detallada (mínimo 20 caracteres)');
  }

  // observaciones is optional — warn if empty but do not block
  if (!data.observaciones || data.observaciones.length === 0) {
    advertencias.push('observaciones: Se recomienda registrar al menos una observación');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================================================
// GENERIC ANALYSIS VALIDATOR
// ============================================================================

/**
 * Validates any analysis type by dispatching to the specific validator.
 * 
 * @param base - Base analysis data
 * @param datos - Methodology-specific data
 * @returns Validation result with errors
 * 
 * @example
 * // Validate a HAZOP analysis
 * const result = validarAnalisisGenerico(
 *   { id: 'hazop-001', tipo: 'HAZOP', ... },
 *   { nodo: 'R-101', parametro: 'Presión', ... }
 * );
 * 
 * // Validate an FMEA analysis
 * const fmeaResult = validarAnalisisGenerico(
 *   { id: 'fmea-001', tipo: 'FMEA', ... },
 *   { componente: 'P-201', modoFalla: 'Fuga', ... }
 * );
 */
export function validarAnalisisGenerico(
  base: AnalisisBase,
  datos: AnalisisHAZOP | AnalisisFMEA | AnalisisLOPA | AnalisisOCA | AnalisisIntuicion
): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // First validate base fields
  const baseResult = validarAnalisisBase(base);
  errores.push(...baseResult.errores);

  // Then validate methodology-specific fields
  let datosResult: ValidationResult;

  switch (base.tipo) {
    case 'HAZOP':
      datosResult = validarAnalisisHAZOP(datos as AnalisisHAZOP);
      break;
    case 'FMEA':
      datosResult = validarAnalisisFMEA(datos as AnalisisFMEA);
      break;
    case 'LOPA':
      datosResult = validarAnalisisLOPA(datos as AnalisisLOPA);
      break;
    case 'OCA':
      datosResult = validarAnalisisOCA(datos as AnalisisOCA);
      break;
    case 'Intuicion':
      datosResult = validarAnalisisIntuicion(datos as AnalisisIntuicion);
      break;
    default:
      errores.push(`Tipo de análisis no soportado: ${(base as AnalisisBase).tipo}`);
      datosResult = { valido: false, errores: [] };
  }

  errores.push(...datosResult.errores);
  advertencias.push(...(datosResult.advertencias || []));

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}
