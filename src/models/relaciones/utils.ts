/**
 * ============================================================================
 * RELACIONES UTILS - Utility Functions for Relationship Validation
 * ============================================================================
 * 
 * This module provides validation and utility functions for relationships
 * between hallazgos and between analyses. Validates that referenced IDs
 * exist in the session and that relationship rules are followed.
 * 
 * Validation Rules:
 * - Referenced IDs must exist in the session
 * - Relationship types must match the entity types
 * - Circular relationships should be detected
 * - Orphan entities should be identified
 * 
 * @module models/relaciones/utils
 */

import type {
  Relacion,
  RelacionHallazgo,
  RelacionAnalisis,
  TipoRelacionHallazgo,
} from './types';

import type { Sesion } from '../sesion/types';
import type { Hallazgo, TipoHallazgo } from '../hallazgo/types';
import type { TipoAnalisis } from '../analisis/types';

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
// HALLAZGO RELATIONSHIP VALIDATORS
// ============================================================================

/**
 * Validates a RelacionHallazgo by checking that both IDs exist in the session.
 * 
 * @param relacion - Relationship to validate
 * @param sesion - Current session with all hallazgos
 * @returns Validation result
 * 
 * @example
 * const result = validarRelacionHallazgo(
 *   {
 *     id: 'rel-001',
 *     tipo: 'mitiga',
 *     origenId: 'barrera-001',
 *     destinoId: 'peligro-001',
 *     fechaCreacion: '2024-01-01T00:00:00Z'
 *   },
 *   session
 * );
 * 
 * if (!result.valido) {
 *   console.error('Errores:', result.errores);
 * }
 */
export function validarRelacionHallazgo(relacion: RelacionHallazgo, sesion: Sesion): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate origenId exists
  const origenExists = sesion.hallazgos.some(h => h.id === relacion.origenId);
  if (!origenExists) {
    errores.push(`origenId '${relacion.origenId}' no existe en la sesión`);
  }

  // Validate destinoId exists
  const destinoExists = sesion.hallazgos.some(h => h.id === relacion.destinoId);
  if (!destinoExists) {
    errores.push(`destinoId '${relacion.destinoId}' no existe en la sesión`);
  }

  // Validate origen and destino are not the same
  if (relacion.origenId === relacion.destinoId) {
    errores.push('origenId y destinoId no pueden ser el mismo hallazgo');
  }

  // Validate relationship type matches entity types
  if (origenExists && destinoExists) {
    const origen = sesion.hallazgos.find(h => h.id === relacion.origenId);
    const destino = sesion.hallazgos.find(h => h.id === relacion.destinoId);

    if (origen && destino) {
      const tipoMatch = validarTipoRelacionHallazgo(relacion.tipo, origen.tipo, destino.tipo);
      if (!tipoMatch.valido) {
        advertencias.push(tipoMatch.mensaje);
      }
    }
  }

  // Check for duplicate relationships
  const duplicates = sesion.relaciones.filter(r => 
    r !== relacion &&
    'origenId' in r &&
    r.origenId === relacion.origenId &&
    r.destinoId === relacion.destinoId &&
    r.tipo === relacion.tipo
  );

  if (duplicates.length > 0) {
    advertencias.push(`Relación duplicada: ya existe ${duplicates.length} relación(es) similar(es)`);
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Validates that a relationship type is appropriate for the entity types.
 * 
 * Valid combinations:
 * - 'mitiga': Barrera → Peligro
 * - 'controla': POE → Peligro
 * - 'protege': Barrera → Barrera (or other element)
 * - 'requiere': Peligro → Barrera
 */
function validarTipoRelacionHallazgo(
  tipo: TipoRelacionHallazgo,
  origenTipo: TipoHallazgo,
  destinoTipo: TipoHallazgo
): { valido: boolean; mensaje: string } {
  const combinacionesValidas: Record<TipoRelacionHallazgo, { origen: TipoHallazgo; destino: TipoHallazgo }[]> = {
    'mitiga': [{ origen: 'Barrera', destino: 'Peligro' }],
    'controla': [{ origen: 'POE', destino: 'Peligro' }],
    'protege': [{ origen: 'Barrera', destino: 'Barrera' }, { origen: 'Barrera', destino: 'SOL' }],
    'requiere': [{ origen: 'Peligro', destino: 'Barrera' }],
  };

  const combinaciones = combinacionesValidas[tipo];
  const esValida = combinaciones.some(
    c => c.origen === origenTipo && c.destino === destinoTipo
  );

  if (!esValida) {
    return {
      valido: false,
      mensaje: `Relación '${tipo}' inusual: ${origenTipo} → ${destinoTipo}. ` +
        `Combinaciones típicas: ${combinaciones.map(c => `${c.origen} → ${c.destino}`).join(', ')}`,
    };
  }

  return { valido: true, mensaje: '' };
}

// ============================================================================
// ANALYSIS RELATIONSHIP VALIDATORS
// ============================================================================

/**
 * Validates a RelacionAnalisis by checking that both IDs exist in the session.
 * 
 * @param relacion - Relationship to validate
 * @param sesion - Current session with all analyses
 * @returns Validation result
 * 
 * @example
 * const result = validarRelacionAnalisis(
 *   {
 *     id: 'rel-analysis-001',
 *     tipo: 'sustenta',
 *     analisisSustentoId: 'fmea-001',
 *     analisisSustentadoId: 'hazop-001',
 *     descripcion: 'FMEA informa HAZOP',
 *     fechaCreacion: '2024-01-01T00:00:00Z'
 *   },
 *   session
 * );
 */
export function validarRelacionAnalisis(relacion: RelacionAnalisis, sesion: Sesion): ValidationResult {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Validate analisisSustentoId exists
  const sustentoExists = sesion.analisis.some(a => a.base.id === relacion.analisisSustentoId);
  if (!sustentoExists) {
    errores.push(`analisisSustentoId '${relacion.analisisSustentoId}' no existe en la sesión`);
  }

  // Validate analisisSustentadoId exists
  const sustentadoExists = sesion.analisis.some(a => a.base.id === relacion.analisisSustentadoId);
  if (!sustentadoExists) {
    errores.push(`analisisSustentadoId '${relacion.analisisSustentadoId}' no existe en la sesión`);
  }

  // Validate IDs are not the same
  if (relacion.analisisSustentoId === relacion.analisisSustentadoId) {
    errores.push('analisisSustentoId y analisisSustentadoId no pueden ser el mismo análisis');
  }

  // Validate relationship type makes sense
  if (sustentoExists && sustentadoExists) {
    const sustento = sesion.analisis.find(a => a.base.id === relacion.analisisSustentoId);
    const sustentado = sesion.analisis.find(a => a.base.id === relacion.analisisSustentadoId);

    if (sustento && sustentado) {
      // Check for circular relationships
      const circular = existeRelacionCircular(relacion, sesion);
      if (circular) {
        advertencias.push('Advertencia: Posible relación circular detectada');
      }

      // Warn if same analysis type
      if (sustento.base.tipo === sustentado.base.tipo) {
        advertencias.push(
          `Ambos análisis son del mismo tipo (${sustento.base.tipo}). ` +
          'Verificar que la relación tenga sentido.'
        );
      }
    }
  }

  // Check for duplicate relationships
  const duplicates = sesion.relaciones.filter(r => 
    r !== relacion &&
    'analisisSustentoId' in r &&
    r.analisisSustentoId === relacion.analisisSustentoId &&
    r.analisisSustentadoId === relacion.analisisSustentadoId &&
    r.tipo === relacion.tipo
  );

  if (duplicates.length > 0) {
    advertencias.push(`Relación duplicada: ya existe ${duplicates.length} relación(es) similar(es)`);
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Detects circular relationships in analysis chains.
 * 
 * @param relacion - New relationship being added
 * @param sesion - Current session
 * @returns True if circular relationship detected
 */
function existeRelacionCircular(relacion: RelacionAnalisis, sesion: Sesion): boolean {
  const { analisisSustentoId, analisisSustentadoId } = relacion;

  // Build adjacency list for existing relationships
  const grafo = new Map<string, string[]>();

  for (const r of sesion.relaciones) {
    if ('analisisSustentoId' in r) {
      const rel = r as RelacionAnalisis;
      if (!grafo.has(rel.analisisSustentadoId)) {
        grafo.set(rel.analisisSustentadoId, []);
      }
      grafo.get(rel.analisisSustentadoId)!.push(rel.analisisSustentoId);
    }
  }

  // DFS to check if we can reach analisisSustentadoId from analisisSustentoId
  const visitados = new Set<string>();
  const pila = [analisisSustentoId];

  while (pila.length > 0) {
    const actual = pila.pop()!;

    if (actual === analisisSustentadoId) {
      return true; // Circular relationship found
    }

    if (!visitados.has(actual)) {
      visitados.add(actual);
      const vecinos = grafo.get(actual) || [];
      pila.push(...vecinos);
    }
  }

  return false;
}

// ============================================================================
// GENERIC RELATIONSHIP VALIDATOR
// ============================================================================

/**
 * Validates any relationship type by dispatching to the specific validator.
 * 
 * @param relacion - Relationship to validate
 * @param sesion - Current session
 * @returns Validation result
 * 
 * @example
 * // Validate a hallazgo relationship
 * const result = validarRelacion(relacionHallazgo, sesion);
 * 
 * // Validate an analysis relationship
 * const analysisResult = validarRelacion(relacionAnalisis, sesion);
 */
export function validarRelacion(relacion: Relacion, sesion: Sesion): ValidationResult {
  if ('origenId' in relacion && 'destinoId' in relacion) {
    return validarRelacionHallazgo(relacion as RelacionHallazgo, sesion);
  } else if ('analisisSustentoId' in relacion && 'analisisSustentadoId' in relacion) {
    return validarRelacionAnalisis(relacion as RelacionAnalisis, sesion);
  } else {
    return {
      valido: false,
      errores: ['Relación de tipo desconocido'],
    };
  }
}

// ============================================================================
// ORPHAN DETECTION
// ============================================================================

/**
 * Finds hallazgos that have no relationships (orphans).
 * 
 * @param sesion - Current session
 * @returns Array of orphan hallazgo IDs
 * 
 * @example
 * const huerfanos = encontrarHallazgosHuerfanos(sesion);
 * if (huerfanos.length > 0) {
 *   console.warn('Hallazgos sin relaciones:', huerfanos);
 * }
 */
export function encontrarHallazgosHuerfanos(sesion: Sesion): string[] {
  const hallazgosConRelaciones = new Set<string>();

  // Collect all hallazgo IDs that appear in relationships
  for (const relacion of sesion.relaciones) {
    if ('origenId' in relacion) {
      hallazgosConRelaciones.add(relacion.origenId);
      hallazgosConRelaciones.add(relacion.destinoId);
    }
  }

  // Find hallazgos not in the set
  return sesion.hallazgos
    .filter(h => !hallazgosConRelaciones.has(h.id))
    .map(h => h.id);
}

/**
 * Finds analyses that have no relationships (orphans).
 * 
 * @param sesion - Current session
 * @returns Array of orphan analysis IDs
 */
export function encontrarAnalisisHuerfanos(sesion: Sesion): string[] {
  const analisisConRelaciones = new Set<string>();

  // Collect all analysis IDs that appear in relationships
  for (const relacion of sesion.relaciones) {
    if ('analisisSustentoId' in relacion) {
      analisisConRelaciones.add(relacion.analisisSustentoId);
      analisisConRelaciones.add(relacion.analisisSustentadoId);
    }
  }

  // Also check analisisRelacionadosIds in base
  for (const analisis of sesion.analisis) {
    if (analisis.base.analisisRelacionadosIds.length > 0) {
      analisisConRelaciones.add(analisis.base.id);
      analisis.base.analisisRelacionadosIds.forEach(id => analisisConRelaciones.add(id));
    }
  }

  // Find analyses not in the set
  return sesion.analisis
    .filter(a => !analisisConRelaciones.has(a.base.id))
    .map(a => a.base.id);
}

// ============================================================================
// GRAPH UTILITIES
// ============================================================================

/**
 * Gets all relationships for a specific hallazgo.
 * 
 * @param sesion - Current session
 * @param hallazgoId - Hallazgo ID to find relationships for
 * @returns Array of relationships involving this hallazgo
 */
export function obtenerRelacionesDeHallazgo(sesion: Sesion, hallazgoId: string): RelacionHallazgo[] {
  return sesion.relaciones.filter(
    r => 'origenId' in r && (r.origenId === hallazgoId || r.destinoId === hallazgoId)
  ) as RelacionHallazgo[];
}

/**
 * Gets all relationships for a specific analysis.
 * 
 * @param sesion - Current session
 * @param analisisId - Analysis ID to find relationships for
 * @returns Array of relationships involving this analysis
 */
export function obtenerRelacionesDeAnalisis(sesion: Sesion, analisisId: string): RelacionAnalisis[] {
  return sesion.relaciones.filter(
    r => 'analisisSustentoId' in r && (r.analisisSustentoId === analisisId || r.analisisSustentadoId === analisisId)
  ) as RelacionAnalisis[];
}

/**
 * Gets hallazgos connected to a specific hallazgo.
 * 
 * @param sesion - Current session
 * @param hallazgoId - Hallazgo ID to find connections for
 * @returns Array of connected hallazgos with relationship info
 */
export function obtenerHallazgosConectados(
  sesion: Sesion,
  hallazgoId: string
): Array<{ hallazgo: Hallazgo; relacion: RelacionHallazgo; direccion: 'origen' | 'destino' }> {
  const resultados: Array<{ hallazgo: Hallazgo; relacion: RelacionHallazgo; direccion: 'origen' | 'destino' }> = [];

  for (const relacion of sesion.relaciones) {
    if ('origenId' in relacion) {
      const rel = relacion as RelacionHallazgo;
      
      if (rel.origenId === hallazgoId) {
        const destino = sesion.hallazgos.find(h => h.id === rel.destinoId);
        if (destino) {
          resultados.push({ hallazgo: destino, relacion: rel, direccion: 'destino' });
        }
      } else if (rel.destinoId === hallazgoId) {
        const origen = sesion.hallazgos.find(h => h.id === rel.origenId);
        if (origen) {
          resultados.push({ hallazgo: origen, relacion: rel, direccion: 'origen' });
        }
      }
    }
  }

  return resultados;
}

/**
 * Calculates the connectivity score for each hallazgo.
 * 
 * @param sesion - Current session
 * @returns Map of hallazgo ID to connection count
 */
export function calcularConectividadHallazgos(sesion: Sesion): Map<string, number> {
  const conectividad = new Map<string, number>();

  // Initialize all hallazgos with 0
  for (const hallazgo of sesion.hallazgos) {
    conectividad.set(hallazgo.id, 0);
  }

  // Count connections
  for (const relacion of sesion.relaciones) {
    if ('origenId' in relacion) {
      const currentOrigen = conectividad.get(relacion.origenId) || 0;
      conectividad.set(relacion.origenId, currentOrigen + 1);

      const currentDestino = conectividad.get(relacion.destinoId) || 0;
      conectividad.set(relacion.destinoId, currentDestino + 1);
    }
  }

  return conectividad;
}

// ============================================================================
// BATCH VALIDATION
// ============================================================================

/**
 * Validates all relationships in a session.
 * 
 * @param sesion - Current session
 * @returns Validation results for all relationships
 * 
 * @example
 * const results = validarTodasLasRelaciones(sesion);
 * 
 * if (!results.todosValidos) {
 *   console.error('Relaciones inválidas:', results.resultados.filter(r => !r.valido));
 * }
 */
export function validarTodasLasRelaciones(sesion: Sesion): {
  todosValidos: boolean;
  resultados: Array<{ relacion: Relacion; resultado: ValidationResult }>;
  huerfanos: { hallazgos: string[]; analisis: string[] };
} {
  const resultados: Array<{ relacion: Relacion; resultado: ValidationResult }> = [];
  let todosValidos = true;

  for (const relacion of sesion.relaciones) {
    const resultado = validarRelacion(relacion, sesion);
    resultados.push({ relacion, resultado });

    if (!resultado.valido) {
      todosValidos = false;
    }
  }

  return {
    todosValidos,
    resultados,
    huerfanos: {
      hallazgos: encontrarHallazgosHuerfanos(sesion),
      analisis: encontrarAnalisisHuerfanos(sesion),
    },
  };
}
