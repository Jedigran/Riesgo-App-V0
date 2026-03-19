/**
 * ============================================================================
 * EXAMPLE DATA - Protection Groups (Grupos de Protección)
 * ============================================================================
 *
 * This module contains example protection group data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * NOTE: This file is intentionally empty.
 * No groups for the simple HAZOP example.
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
// NO GROUPS
// ============================================================================
//
// No protection groups for this simple HAZOP example.
//
// ============================================================================

export const ejemplosGrupos: EjemploGrupo[] = [];

// ============================================================================
// NOTES
// ============================================================================

/**
 * This file is intentionally empty.
 * 
 * The simple HAZOP example creates 1 Peligro, but no groups are defined.
 * Groups can be created manually through the UI to demonstrate relationships.
 */
