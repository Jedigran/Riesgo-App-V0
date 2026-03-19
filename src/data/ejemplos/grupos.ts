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
// EXAMPLE GROUPS - Mining Drainage System (4 Groups)
// ============================================================================
//
// IMPORTANT: Titles must EXACTLY match the hallazgos created in analisis.ts
// ============================================================================

export const ejemplosGrupos: EjemploGrupo[] = [
  // ── GROUP 1: Emergency Drainage System (from HAZOP) ─────────────────────
  {
    nombre: 'Sistema de achique de emergencia',
    descripcion: 'Relación entre la interrupción del flujo de achique y los procedimientos de activación de bomba de respaldo junto con el monitoreo de nivel de agua',
    color: '#3b82f6', // Blue
    peligrosTitulos: [
      'Interrupción del flujo de achique por falla eléctrica',
    ],
    protectoresTitulos: [
      'POE-MIN-001: Activación de sistema de achique de emergencia',
      'SOL-MIN-001: Control de nivel',
    ],
  },

  // ── GROUP 2: Motor Thermal Protection (from FMEA) ───────────────────────
  {
    nombre: 'Protección térmica del motor de bomba principal',
    descripcion: 'Relación entre la inoperabilidad del motor por sobrecalentamiento y el sistema de monitoreo de temperatura para prevenir falla catastrófica',
    color: '#ef4444', // Red
    peligrosTitulos: [
      'Inoperabilidad del motor de bomba por sobrecalentamiento',
    ],
    protectoresTitulos: [
      'SOL-MIN-002: Sensor de temperatura de motor',
    ],
  },

  // ── GROUP 3: IPL Barriers for Flood Prevention (from LOPA) ──────────────
  {
    nombre: 'Barreras IPL para prevención de inundación',
    descripcion: 'Relación entre el peligro de inundación de galerías y las barreras de protección independientes (alarma automática y bomba de respaldo)',
    color: '#22c55e', // Green
    peligrosTitulos: [
      'Inundación de galerías por falla de bomba de achique',
    ],
    protectoresTitulos: [
      'Barrera-MIN-001: Alarma de alto nivel automática',
      'Barrera-MIN-002: Bomba de achique automática de respaldo',
      'POE-MIN-001: Respuesta a activación de bomba de emergencia',
    ],
  },

  // ── GROUP 4: H2S Toxic Emission Control (from OCA) ──────────────────────
  {
    nombre: 'Control de emisión tóxica H2S en drenaje',
    descripcion: 'Relación entre la emisión de H2S desde el sistema de drenaje y el procedimiento de respuesta inmediata con evacuación del personal',
    color: '#a855f7', // Purple
    peligrosTitulos: [
      'Emisión tóxica de H2S desde sistema de drenaje',
    ],
    protectoresTitulos: [
      'POE-MIN-002: Respuesta a detección de H2S',
    ],
  },
];

// ============================================================================
// NOTES
// ============================================================================

/**
 * These groups are created AFTER the hallazgos from analisis.ts are loaded.
 *
 * Group Structure:
 * - Each group has ONE Peligro (hazard)
 * - Each group has ONE or MORE protectores (Barrera, POE, SOL)
 * - Groups are visualized with color-coded connections on the schematic
 *
 * Groups Summary:
 * 1. Sistema de achique de emergencia (Blue #3b82f6)
 *    - From HAZOP analysis
 *    - 1 Peligro + 2 Controles (POE + SOL)
 *
 * 2. Protección térmica del motor de bomba principal (Red #ef4444)
 *    - From FMEA analysis
 *    - 1 Peligro + 1 Control (SOL)
 *
 * 3. Barreras IPL para prevención de inundación (Green #22c55e)
 *    - From LOPA analysis
 *    - 1 Peligro + 3 Controles (2 Barreras + POE)
 *
 * 4. Control de emisión tóxica H2S en drenaje (Purple #a855f7)
 *    - From OCA analysis
 *    - 1 Peligro + 1 Control (POE)
 *
 * IMPORTANT: All titles must EXACTLY match hallazgos in analisis.ts
 *
 * Related files:
 * - analisis.ts: Example data for 5 analyses (11 hallazgos total)
 * - hallazgos.ts: Empty (all hallazgos created by analyses)
 * - page.tsx: cargarDatosEjemplo() function that uses this data
 */
