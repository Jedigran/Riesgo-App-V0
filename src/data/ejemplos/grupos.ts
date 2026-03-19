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

 


];

// ============================================================================
// NOTES
// ============================================================================

/**
 * These groups are created AFTER the hallazgos from analisis.ts are loaded.
 *
 * IMPORTANT: Group creation will fail if titles don't exactly match!
 *
 * Groups Summary:
 * 1. Sistema de achique de emergencia (Blue) - ✅ Should work (HAZOP)
 * 2. Protección térmica del motor (Red) - ✅ Should work (FMEA)
 * 3. Barreras IPL para inundación (Green) - ❌ Will fail (no Peligro in LOPA)
 * 4. Control de emisión tóxica H2S (Purple) - ✅ Should work (OCA)
 *
 * Related files:
 * - analisis.ts: Example data for 4 analyses (HAZOP, FMEA, OCA, LOPA)
 * - hallazgos.ts: Empty (all hallazgos created by analyses)
 * - page.tsx: cargarDatosEjemplo() function that uses this data
 */
