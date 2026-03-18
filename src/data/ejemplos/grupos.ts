/**
 * ============================================================================
 * EXAMPLE DATA - Protection Groups (Grupos de Protección)
 * ============================================================================
 *
 * This module contains example protection group data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
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
// EXAMPLE GROUPS
// ============================================================================

export const ejemplosGrupos: EjemploGrupo[] = [
  // ── GROUP 1: Simple (1 Peligro + 1 Barrera) ────────────────────────────
  {
    nombre: 'Grupo Protección Reactor R-101',
    descripcion: 'Protección básica contra sobrepresión - Válvula de alivio PSV-101',
    color: '#ef4444', // Red
    peligrosTitulos: ['Sobrepresión en Reactor R-101'],
    protectoresTitulos: ['Válvula de Alivio PSV-101'],
  },

  // ── GROUP 2: Complete (1 Peligro + 1 Barrera + 1 POE + 1 SOL) ──────────
  {
    nombre: 'Grupo Protección Línea H2S',
    descripcion: 'Sistema completo de protección para línea con H2S - Detección, monitoreo y ventilación',
    color: '#f59e0b', // Amber/Orange
    peligrosTitulos: ['Fuga de Gas H2S en Línea L-205'],
    protectoresTitulos: [
      'Detector de Gas H2S GD-205',
      'POE-002 Monitoreo de Gases Tóxicos',
      'SIS-205 Ventilación de Emergencia',
    ],
  },
];

// ============================================================================
// NOTES
// ============================================================================

/**
 * These groups are created AFTER the hallazgos from hallazgos.ts are loaded.
 * 
 * Group Structure:
 * - Each group has ONE or MORE peligros (hazards)
 * - Each group has ONE or MORE protectores (Barrera, POE, SOL)
 * - Groups are visualized with color-coded connections on the schematic
 * 
 * Related files:
 * - hallazgos.ts: Example data for standalone hallazgos
 * - analisis.ts: Example data for analyses (HAZOP, FMEA, LOPA, OCA)
 * - page.tsx: cargarDatosEjemplo() function that uses this data
 */
