/**
 * ============================================================================
 * EXAMPLE DATA - Risk Findings (Hallazgos)
 * ============================================================================
 *
 * This module contains example data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * NOTE: This file is intentionally empty.
 * All hallazgos are created by analyses in analisis.ts
 *
 * @module data/ejemplos/hallazgos
 */

import type { TipoHallazgo } from '@/src/models/hallazgo/types';
import type { CrearPeligroDTO, CrearBarreraDTO, CrearPOEDTO, CrearSOLDTO } from '@/src/controllers/useHallazgo';

export interface EjemploHallazgo {
  tipo: TipoHallazgo;
  datos: CrearPeligroDTO | CrearBarreraDTO | CrearPOEDTO | CrearSOLDTO;
  ubicacion: { x: number; y: number };
}

// ============================================================================
// NO STANDALONE HALLAZGOS
// ============================================================================
//
// All hallazgos are created by analyses in analisis.ts
// This file is empty for the simple HAZOP example.
//
// ============================================================================

export const ejemplosBasicos: EjemploHallazgo[] = [];

// ============================================================================
// NOTES
// ============================================================================

/**
 * This file is intentionally empty.
 * 
 * The HAZOP analysis in analisis.ts creates its own Peligro.
 * No standalone hallazgos are needed for this simple example.
 */
