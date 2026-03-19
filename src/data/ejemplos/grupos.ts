/**
 * ============================================================================
 * EXAMPLE DATA - Protection Groups (Grupos de Protección)
 * ============================================================================
 *
 * This module contains example protection group data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * NOTE: Empty for this simple test
 *
 * @module data/ejemplos/grupos
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EjemploGrupo {
  /** Group name */
  nombre: string;
  /** Group description */
  descripcion: string;
  /** Group color for visualization */
  color: string;
  /** Titles of peligros (hazards) in this group */
  peligrosTitulos: string[];
  /** Titles of protectores (barriers, POEs, SOLs) in this group */
  protectoresTitulos: string[];
}

// ============================================================================
// NO GROUPS - Simple test
// ============================================================================

export const ejemplosGrupos: EjemploGrupo[] = [];

// ============================================================================
// NOTES
// ============================================================================

/**
 * This file is intentionally empty for this simple test.
 * 
 * We're testing with just 1 Registro Directo creating 1 Peligro.
 * Groups will be added later once we verify the basic flow works.
 */
