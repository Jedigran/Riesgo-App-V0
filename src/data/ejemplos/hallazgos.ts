/**
 * ============================================================================
 * EXAMPLE DATA - Risk Findings (Hallazgos)
 * ============================================================================
 *
 * This module contains example data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
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
// BASIC EXAMPLES - 4 entities for simple relationship demo
// ============================================================================

export const ejemplosBasicos: EjemploHallazgo[] = [
  // ── PELIGROS ──────────────────────────────────────────────────────────────
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Sobrepresión en Reactor R-101',
      descripcion: 'Riesgo de sobrepresión durante operación normal por falla en control de presión',
      tipoPeligro: 'Inherente',
      consecuencia: 'Ruptura del reactor con liberación de material peligroso',
      severidad: 5,
      causaRaiz: 'Falla en válvula de control PIC-101',
    },
    ubicacion: { x: 35, y: 30 },
  },
  {
    tipo: 'Peligro',
    datos: {
      titulo: 'Fuga de Gas H2S en Línea L-205',
      descripcion: 'Liberación de gas sulfhídrico por corrosión en tubería de proceso',
      tipoPeligro: 'Diseño',
      consecuencia: 'Intoxicación del personal y contaminación ambiental',
      severidad: 5,
      causaRaiz: 'Corrosión acelerada por ambiente marino con H2S',
    },
    ubicacion: { x: 55, y: 25 },
  },

  // ── BARRERAS ─────────────────────────────────────────────────────────────
  {
    tipo: 'Barrera',
    datos: {
      titulo: 'Válvula de Alivio PSV-101',
      descripcion: 'Válvula de seguridad que alivia presión cuando excede el setpoint de 150 psig',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Mitigativa',
      efectividadEstimada: 4,
      elementoProtegido: 'Reactor R-101',
    },
    ubicacion: { x: 38, y: 33 },
  },
  {
    tipo: 'Barrera',
    datos: {
      titulo: 'Detector de Gas H2S GD-205',
      descripcion: 'Sistema de detección continua de gas sulfhídrico con alarma en sala de control',
      tipoBarrera: 'Fisica',
      tipoBarreraFuncion: 'Detectiva',
      efectividadEstimada: 4,
      elementoProtegido: 'Personal en área de proceso',
    },
    ubicacion: { x: 58, y: 28 },
  },

  // ── POEs ─────────────────────────────────────────────────────────────────
  {
    tipo: 'POE',
    datos: {
      titulo: 'POE-001 Inspección de Válvulas de Seguridad',
      descripcion: 'Procedimiento para inspección y calibración periódica de válvulas de alivio',
      procedimientoReferencia: 'PRO-INS-001',
      frecuenciaAplicacion: 'Mensual',
      responsable: 'Jefe de Mantenimiento',
    },
    ubicacion: { x: 32, y: 38 },
  },
  {
    tipo: 'POE',
    datos: {
      titulo: 'POE-002 Monitoreo de Gases Tóxicos',
      descripcion: 'Procedimiento para monitoreo continuo y respuesta a alarmas de H2S',
      procedimientoReferencia: 'PRO-SEG-002',
      frecuenciaAplicacion: 'Continuo',
      responsable: 'Supervisor de Seguridad Industrial',
    },
    ubicacion: { x: 52, y: 32 },
  },

  // ── SOLs ─────────────────────────────────────────────────────────────────
  {
    tipo: 'SOL',
    datos: {
      titulo: 'SIS-101 Parada de Emergencia del Reactor',
      descripcion: 'Sistema instrumentado de seguridad para parada segura ante alta presión',
      capaNumero: 1,
      independiente: true,
      tipoTecnologia: 'Sensor de presión PT-101 + Válvula de bloqueo XV-101',
      parametro: 'Presión',
      valorMinimo: 0,
      valorMaximo: 150,
      unidad: 'psig',
    },
    ubicacion: { x: 40, y: 35 },
  },
  {
    tipo: 'SOL',
    datos: {
      titulo: 'SIS-205 Ventilación de Emergencia',
      descripcion: 'Sistema de ventilación forzada para dispersar gas en caso de fuga',
      capaNumero: 2,
      independiente: true,
      tipoTecnologia: 'Detector de gas GD-205 + Ventiladores EV-205',
      parametro: 'Concentración H2S',
      valorMinimo: 0,
      valorMaximo: 10,
      unidad: 'ppm',
    },
    ubicacion: { x: 60, y: 30 },
  },
];

// ============================================================================
// NOTES FOR EXAMPLE GROUPS
// ============================================================================

/**
 * When loading example data, two protection groups (GruposProteccion) are created:
 * 
 * GROUP 1: "Grupo Protección Reactor R-101" (Red #ef4444)
 * - Peligro: Sobrepresión en Reactor R-101
 * - Barrera: Válvula de Alivio PSV-101
 * 
 * GROUP 2: "Grupo Protección Línea H2S" (Amber #f59e0b)
 * - Peligro: Fuga de Gas H2S en Línea L-205
 * - Barrera: Detector de Gas H2S GD-205
 * - POE: POE-002 Monitoreo de Gases Tóxicos
 * - SOL: SIS-205 Ventilación de Emergencia
 * 
 * Group Structure:
 * - Each group has ONE or MORE peligros (hazards)
 * - Each group has ONE or MORE protectores (Barrera, POE, SOL)
 * - Groups are visualized with color-coded connections on the schematic
 */
