/**
 * ============================================================================
 * GRUPO PROTECCION (PROTECTION GROUP) TYPES
 * ============================================================================
 * 
 * Protection groups relate hazards to their protective measures.
 * This replaces binary relationships for pedagogical clarity.
 * 
 * Mental Model:
 * - Students think in terms of "Protection Systems" not pairwise relationships
 * - One group = One conceptual safety system (e.g., "Pressure Protection")
 * - Multiple hazards can be protected by multiple barriers in one group
 * 
 * @module models/grupos/types
 */

import type { Hallazgo, Peligro, Barrera, POE, SOL, TipoHallazgo } from '../hallazgo/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Hex color string for visual grouping.
 * Format: "#RRGGBB"
 */
export type ColorHex = `#${string}`;

/**
 * Protection group entity.
 * Groups hazards with their protective measures (barriers, POEs, SOLs).
 * 
 * @example
 * // Example: Pressure Relief System
 * const grupo: GrupoProteccion = {
 *   id: 'grp-1710345678-a1b2c3',
 *   nombre: 'Sistema de Alivio de Presión',
 *   descripcion: 'Protección contra sobrepresión en reactor',
 *   color: '#3B82F6',
 *   peligrosIds: ['peligro-001', 'peligro-002'],
 *   protectoresIds: ['barrera-001', 'poe-001', 'sol-001'],
 *   fechaCreacion: '2024-03-12T15:30:00Z',
 * };
 */
export interface GrupoProteccion {
  /** Unique identifier (format: "grp-{timestamp}-{random}") */
  id: string;
  
  /** Group name (e.g., "Pressure Protection System") */
  nombre: string;
  
  /** Optional description */
  descripcion?: string;
  
  /** Visual color for UI grouping */
  color: ColorHex;
  
  /** IDs of Peligro hallazgos in this group */
  peligrosIds: string[];
  
  /** IDs of protector hallazgos (Barrera/POE/SOL) */
  protectoresIds: string[];
  
  /** Creation timestamp in ISO 8601 format */
  fechaCreacion: string;
  
  /** Optional: creator identifier (user/session) */
  creadoPor?: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Creates a new protection group with auto-generated ID and timestamp.
 * 
 * @param data - Group data (excluding id and fechaCreacion)
 * @returns Complete GrupoProteccion object
 * 
 * @example
 * const grupo = crearGrupoProteccion({
 *   nombre: 'Sistema de Alivio de Presión',
 *   color: '#3B82F6',
 *   peligrosIds: ['peligro-001'],
 *   protectoresIds: ['barrera-001', 'poe-001']
 * });
 */
export function crearGrupoProteccion(
  data: Omit<GrupoProteccion, 'id' | 'fechaCreacion'>
): GrupoProteccion {
  const timestamp = Math.floor(Date.now() / 1000);
  const random = Math.random().toString(36).substring(2, 8);
  
  return {
    ...data,
    id: `grp-${timestamp}-${random}`,
    fechaCreacion: new Date().toISOString(),
  };
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validates hex color format.
 * 
 * @param color - Color string to validate
 * @returns True if valid hex color (#RRGGBB)
 * 
 * @example
 * validarColorHex('#3B82F6');  // true
 * validarColorHex('red');      // false
 * validarColorHex('#333');     // false (must be 6 digits)
 */
export function validarColorHex(color: string): color is ColorHex {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates a protection group.
 * 
 * Validation rules:
 * - nombre: required, non-empty
 * - color: required, valid hex format
 * - peligrosIds: at least 1, all must exist and be Peligro type
 * - protectoresIds: at least 1, all must exist and be Barrera/POE/SOL
 * - No overlap between peligrosIds and protectoresIds
 * 
 * @param grupo - Group to validate
 * @param hallazgos - All hallazgos in session (for reference validation)
 * @returns Array of error messages (empty if valid)
 * 
 * @example
 * const errores = validarGrupoProteccion(grupo, todosLosHallazgos);
 * if (errores.length > 0) {
 *   console.error('Validación falló:', errores);
 * }
 */
export function validarGrupoProteccion(
  grupo: GrupoProteccion,
  hallazgos: Hallazgo[]
): string[] {
  const errores: string[] = [];
  
  // Required fields
  if (!grupo.nombre || grupo.nombre.trim() === '') {
    errores.push('Nombre es requerido');
  }
  
  if (!grupo.color) {
    errores.push('Color es requerido');
  } else if (!validarColorHex(grupo.color)) {
    errores.push(`Color inválido: ${grupo.color}. Debe ser formato hexadecimal (#RRGGBB)`);
  }
  
  // Minimum members
  if (grupo.peligrosIds.length === 0) {
    errores.push('Debe seleccionar al menos 1 Peligro');
  }
  
  if (grupo.protectoresIds.length === 0) {
    errores.push('Debe seleccionar al menos 1 elemento protector (Barrera/POE/SOL)');
  }
  
  // Validate peligrosIds references
  for (const id of grupo.peligrosIds) {
    const hallazgo = hallazgos.find(h => h.id === id);
    if (!hallazgo) {
      errores.push(`Peligro con ID '${id}' no existe en la sesión`);
    } else if (hallazgo.tipo !== 'Peligro') {
      errores.push(`Hallazgo '${id}' es de tipo '${hallazgo.tipo}', debe ser 'Peligro'`);
    }
  }
  
  // Validate protectoresIds references
  const tiposProtectores: TipoHallazgo[] = ['Barrera', 'POE', 'SOL'];
  for (const id of grupo.protectoresIds) {
    const hallazgo = hallazgos.find(h => h.id === id);
    if (!hallazgo) {
      errores.push(`Protector con ID '${id}' no existe en la sesión`);
    } else if (!tiposProtectores.includes(hallazgo.tipo)) {
      errores.push(`Hallazgo '${id}' es de tipo '${hallazgo.tipo}', debe ser Barrera/POE/SOL`);
    }
  }
  
  // Check for overlap (same hallazgo can't be both peligro and protector)
  const overlap = grupo.peligrosIds.filter(id => grupo.protectoresIds.includes(id));
  if (overlap.length > 0) {
    errores.push(`Un hallazgo no puede ser peligro y protector simultáneamente: ${overlap.join(', ')}`);
  }
  
  return errores;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Checks if a hallazgo is a Peligro (for TypeScript type narrowing).
 * 
 * @param hallazgo - Hallazgo to check
 * @returns True if hallazgo is Peligro type
 * 
 * @example
 * if (esPeligro(hallazgo)) {
 *   // TypeScript knows hallazgo is Peligro here
 *   console.log(hallazgo.consecuencia);
 * }
 */
export function esPeligro(hallazgo: Hallazgo): hallazgo is Peligro {
  return hallazgo.tipo === 'Peligro';
}

/**
 * Checks if a hallazgo is a protector (Barrera/POE/SOL).
 * 
 * @param hallazgo - Hallazgo to check
 * @returns True if hallazgo is Barrera, POE, or SOL type
 * 
 * @example
 * if (esProtector(hallazgo)) {
 *   // TypeScript knows hallazgo is Barrera | POE | SOL here
 *   console.log(hallazgo.tipoBarrera || hallazgo.procedimientoReferencia);
 * }
 */
export function esProtector(hallazgo: Hallazgo): hallazgo is Barrera | POE | SOL {
  return ['Barrera', 'POE', 'SOL'].includes(hallazgo.tipo);
}
