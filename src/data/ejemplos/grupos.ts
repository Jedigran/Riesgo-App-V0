/**
 * ============================================================================
 * EXAMPLE DATA - Protection Groups (Grupos de Protección)
 * ============================================================================
 *
 * This module contains example protection group data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * Industry Context: Mining - Sistema de Achique de Emergencia
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
// EXAMPLE GROUPS - Mining Drainage System
// ============================================================================

export const ejemplosGrupos: EjemploGrupo[] = [
  // ── GROUP 1: Thermal Protection ─────────────────────────────────────────
  {
    nombre: 'Protección térmica del motor de bomba principal',
    descripcion: 'Relación entre la inoperabilidad del motor por sobrecalentamiento y el sistema de monitoreo de temperatura para prevenir falla catastrófica',
    color: '#3b82f6', // Blue
    peligrosTitulos: ['Inoperabilidad del motor de bomba por sobrecalentamiento'],
    protectoresTitulos: ['SOL-MIN-002: Sensor de temperatura de motor'],
  },

  // ── GROUP 2: IPL Barriers for Flood Prevention ─────────────────────────
  {
    nombre: 'Barreras IPL para prevención de inundación',
    descripcion: 'Relación entre el peligro de inundación de galerías y las barreras de protección independientes (alarma automática y bomba de respaldo)',
    color: '#22c55e', // Green
    peligrosTitulos: ['Inundación de galerías por falla de bomba de achique'],
    protectoresTitulos: [
      'Barrera-MIN-001: Alarma de alto nivel automática',
      'Barrera-MIN-002: Bomba de achique automática de respaldo',
    ],
  },

  // ── GROUP 3: H2S Toxic Emission Control ────────────────────────────────
  {
    nombre: 'Control de emisión tóxica H2S en drenaje',
    descripcion: 'Relación entre la emisión de H2S desde el sistema de drenaje y el procedimiento de respuesta inmediata con evacuación del personal',
    color: '#a855f7', // Purple
    peligrosTitulos: ['Emisión tóxica de H2S desde sistema de drenaje'],
    protectoresTitulos: ['POE-MIN-002: Respuesta a detección de H2S'],
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
 * Industry Context:
 * - Underground mining drainage system (Sistema de Achique de Mina Subterránea)
 * - 3 protection groups demonstrate different safety strategies:
 *   1. Instrumented protection layer (SOL) for thermal monitoring
 *   2. Independent protection layers (IPLs) for flood prevention
 *   3. Administrative control (POE) for toxic gas response
 *
 * Related files:
 * - hallazgos.ts: Example data for 10 standalone hallazgos (4 Peligros, 3 POEs, 2 Barreras, 1 SOL)
 * - analisis.ts: Example data for 5 analyses (Registro Directo, HAZOP, FMEA, LOPA, OCA)
 * - page.tsx: cargarDatosEjemplo() function that uses this data
 */
