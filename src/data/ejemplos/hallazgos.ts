/**
 * ============================================================================
 * EXAMPLE DATA - Risk Findings (Hallazgos)
 * ============================================================================
 *
 * This module contains example data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * Industry Context: Mining - Sistema de Achique de Emergencia
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
// MINING EXAMPLES - Sistema de Achique de Emergencia
// ============================================================================
// 
// Context: Underground mining drainage system risk assessment
// 
// Unique Hallazgos: 10 total
// - 4 Peligros (Hazards)
// - 3 POEs (Standard Operating Procedures)
// - 2 Barreras (Physical Barriers / IPLs)
// - 1 SOL (Safety Instrumented Layer)
// ============================================================================

export const ejemplosBasicos: EjemploHallazgo[] = [
  // ── PELIGROS (4) ─────────────────────────────────────────────────────────

  // H1: Main hazard - referenced by Registro Directo, LOPA, Relación 2
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Inundación de galerías por falla de bomba de achique',
      descripcion: 'Falla eléctrica del motor de la bomba principal provoca acumulación de agua',
      tipoPeligro: 'Diseño',
      consecuencia: 'Inundación de galerías, paralización de operaciones, riesgo de atrapamiento del personal',
      severidad: 5,
      causaRaiz: 'Falla eléctrica del motor de la bomba principal',
    },
    ubicacion: { x: 30, y: 30 },
  },

  // H2: HAZOP hazard
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Interrupción del flujo de achique por falla eléctrica',
      descripcion: 'La bomba principal del sistema de achique deja de operar por falla eléctrica, interrumpiendo el flujo de evacuación de agua',
      tipoPeligro: 'Diseño',
      consecuencia: 'Acumulación de agua en el área de operación',
      severidad: 5,
      causaRaiz: 'Falla eléctrica del motor',
    },
    ubicacion: { x: 40, y: 30 },
  },

  // H3: FMEA hazard - referenced by Relación 1
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Inoperabilidad del motor de bomba por sobrecalentamiento',
      descripcion: 'El motor de la bomba principal se detiene por activación de protección térmica debido a sobrecarga prolongada',
      tipoPeligro: 'Diseño',
      consecuencia: 'Pérdida de bombeo, acumulación de agua en galerías',
      severidad: 5,
      causaRaiz: 'Sobrecarga prolongada del motor',
    },
    ubicacion: { x: 50, y: 30 },
  },

  // H4: OCA hazard - referenced by Relación 3
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Emisión tóxica de H2S desde sistema de drenaje',
      descripcion: 'Liberación de sulfuro de hidrógeno (H2S) desde aguas residuales acumuladas en el sistema de drenaje por reacción química con minerales sulfurados',
      tipoPeligro: 'Diseño',
      consecuencia: 'Intoxicación del personal subterráneo por exposición a gas H2S',
      severidad: 5,
      causaRaiz: 'Reacción química con minerales sulfurados',
    },
    ubicacion: { x: 70, y: 30 },
  },

  // ── POEs (3) ─────────────────────────────────────────────────────────────

  // H5: POE for HAZOP
  {
    tipo: 'POE',
    datos: {
      titulo: 'POE-MIN-001: Activación de sistema de achique de emergencia',
      descripcion: 'Procedimiento para activar bomba de respaldo y verificar restablecimiento del flujo en un plazo máximo de 15 minutos',
      procedimientoReferencia: 'POE-MIN-001',
      frecuenciaAplicacion: 'Según sea necesario',
      responsable: 'Operador de turno',
    },
    ubicacion: { x: 40, y: 40 },
  },

  // H7: POE for FMEA
  {
    tipo: 'POE',
    datos: {
      titulo: 'POE-MIN-001: Respuesta a activación de bomba de emergencia',
      descripcion: 'Procedimiento de verificación de operación de bomba de respaldo y diagnóstico de falla de bomba principal',
      procedimientoReferencia: 'POE-MIN-001',
      frecuenciaAplicacion: 'Según sea necesario',
      responsable: 'Supervisor de Mantenimiento',
    },
    ubicacion: { x: 50, y: 40 },
  },

  // H10: POE for OCA - referenced by Relación 3
  {
    tipo: 'POE',
    datos: {
      titulo: 'POE-MIN-002: Respuesta a detección de H2S',
      descripcion: 'Procedimiento de evacuación inmediata y uso de equipos de respiración autónoma cuando se detecta H2S sobre 10 ppm',
      procedimientoReferencia: 'POE-MIN-002',
      frecuenciaAplicacion: 'Según sea necesario',
      responsable: 'Todo el personal subterráneo',
    },
    ubicacion: { x: 70, y: 40 },
  },

  // ── BARRERAS (2) ─────────────────────────────────────────────────────────

  // H8: Barrera IPL 1 - referenced by Relación 2
  {
    tipo: 'Barrera',
    datos: {
      titulo: 'Barrera-MIN-001: Alarma de alto nivel automática',
      descripcion: 'Sistema de alarma que se activa cuando el nivel de agua en la poza alcanza 2.0 m, alertando al operador de turno',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Detectiva',
      efectividadEstimada: 4,
      elementoProtegido: 'Sistema de achique',
    },
    ubicacion: { x: 60, y: 40 },
  },

  // H9: Barrera IPL 2 - referenced by Relación 2
  {
    tipo: 'Barrera',
    datos: {
      titulo: 'Barrera-MIN-002: Bomba de achique automática de respaldo',
      descripcion: 'Sistema de bombeo secundario que se activa automáticamente por interlock cuando falla la bomba principal',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Mitigativa',
      efectividadEstimada: 4,
      elementoProtegido: 'Sistema de drenaje subterráneo',
    },
    ubicacion: { x: 65, y: 35 },
  },

  // ── SOLs (1) ─────────────────────────────────────────────────────────────

  // H6: SOL for HAZOP - referenced by Relación 1
  {
    tipo: 'SOL',
    datos: {
      titulo: 'SOL-MIN-002: Sensor de temperatura de motor',
      descripcion: 'Termopares en devanados del motor que alertan antes de alcanzar temperatura crítica',
      capaNumero: 1,
      independiente: true,
      tipoTecnologia: 'Termopares en devanados del motor',
      parametro: 'Temperatura del motor',
      valorMinimo: 20,
      valorMaximo: 90,
      unidad: 'Grados Celsius (°C)',
    },
    ubicacion: { x: 45, y: 35 },
  },
];

// ============================================================================
// NOTES FOR EXAMPLE GROUPS
// ============================================================================

/**
 * When loading example data, three protection groups (GruposProteccion) are created:
 *
 * GROUP 1: "Protección térmica del motor de bomba principal" (Blue #3b82f6)
 * - Peligro: Inoperabilidad del motor de bomba por sobrecalentamiento (H3)
 * - Control: SOL-MIN-002: Sensor de temperatura de motor (H6)
 *
 * GROUP 2: "Barreras IPL para prevención de inundación" (Green #22c55e)
 * - Peligro: Inundación de galerías por falla de bomba de achique (H1)
 * - Controls: 
 *   - Barrera-MIN-001: Alarma de alto nivel automática (H8)
 *   - Barrera-MIN-002: Bomba de achique automática de respaldo (H9)
 *
 * GROUP 3: "Control de emisión tóxica H2S en drenaje" (Purple #a855f7)
 * - Peligro: Emisión tóxica de H2S desde sistema de drenaje (H4)
 * - Control: POE-MIN-002: Respuesta a detección de H2S (H10)
 *
 * Group Structure:
 * - Each group has ONE or MORE peligros (hazards)
 * - Each group has ONE or MORE protectores (Barrera, POE, SOL)
 * - Groups are visualized with color-coded connections on the schematic
 *
 * Industry Context:
 * - Underground mining drainage system (Sistema de Achique de Mina Subterránea)
 * - Multiple risk assessment methodologies applied to the same system
 * - Demonstrates relationships between hazards and their protective layers
 */
