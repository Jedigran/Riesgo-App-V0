/**
 * ============================================================================
 * EXAMPLE DATA - Risk Analyses
 * ============================================================================
 *
 * This module contains example analysis data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * Industry Context: Mining - Sistema de Achique de Emergencia
 *
 * @module data/ejemplos/analisis
 */

import type { TipoHallazgo } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EjemploAnalisis {
  /** Analysis type */
  tipo: 'RegistroDirecto' | 'HAZOP' | 'FMEA' | 'LOPA' | 'OCA';
  /** Analysis data */
  datos: any;
  /** Hallazgos associated with this analysis */
  hallazgos: EjemploHallazgoAnalisis[];
}

export interface EjemploHallazgoAnalisis {
  /** Finding type */
  tipo: TipoHallazgo;
  /** Finding data */
  datos: any;
}

// ============================================================================
// EXAMPLE ANALYSES - Mining Drainage System
// ============================================================================

export const ejemplosAnalisis: EjemploAnalisis[] = [
  // ========================================
  // HAZOP #1 - Sistema de Achique (Bomba Principal)
  // ========================================
  {
    tipo: 'HAZOP',
    datos: {
      nombre: 'Pérdida de capacidad de achique en mina subterránea',
      nodo: 'Sistema de Achique',
      subnodo: 'Bomba principal',
      parametro: 'Flujo',
      palabraGuia: 'No',
      desviacion: 'Sin flujo',
      causa: 'Falla eléctrica del motor',
      consecuencia: 'Acumulación de agua en el área de operación',
      receptorImpacto: 'Personal/Operación',
      salvaguardasExistentes: ['Sensor de nivel', 'Alarma de alto nivel'],
      recomendaciones: ['Instalar bomba redundante'],
    },
    hallazgos: [
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
      },
      {
        tipo: 'POE',
        datos: {
          titulo: 'POE-MIN-001: Activación de sistema de achique de emergencia',
          descripcion: 'Procedimiento para activar bomba de respaldo y verificar restablecimiento del flujo en un plazo máximo de 15 minutos',
          procedimientoReferencia: 'POE-MIN-001',
          frecuenciaAplicacion: 'Según sea necesario',
          responsable: 'Operador de turno',
        },
      },
      {
        tipo: 'SOL',
        datos: {
          titulo: 'SOL-MIN-001: Control de nivel',
          descripcion: 'Sistema de monitoreo continuo del nivel de agua en la galería principal',
          capaNumero: 1,
          independiente: true,
          tipoTecnologia: 'Sensor de nivel de agua',
          parametro: 'Nivel de agua',
          valorMinimo: 0.3,
          valorMaximo: 3.5,
          unidad: 'metros (m)',
        },
      },
    ],
  },

  // ========================================
  // FMEA #1 - Bomba Principal del Sistema de Achique
  // ========================================
  {
    tipo: 'FMEA',
    datos: {
      nombre: 'Pérdida de capacidad de achique en mina subterránea',
      equipo: 'Bomba principal del Sistema de Achique',
      funcion: 'Evacuar agua acumulada del sistema de drenaje',
      modoFalla: 'Motor no opera',
      efecto: 'Pérdida de bombeo',
      causa: 'Falla eléctrica del motor',
      receptorImpacto: 'Personal / Operación',
      S: 9,
      O: 5,
      D: 3,
      RPN: 135,
      barrerasExistentes: ['Sensor de nivel', 'Alarma de alto nivel'],
      accionesRecomendadas: ['Programar mantenimiento preventivo'],
    },
    hallazgos: [
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
      },
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
      },
    ],
  },
];

// ============================================================================
// HELPER: POSITIONS FOR HALLAZGOS
// ============================================================================

/**
 * Grid positions for placing hallazgos on the map.
 * Used to spread entities across the diagram.
 */
export const posicionesHallazgos: { x: number; y: number }[] = [
  { x: 30, y: 30 }, { x: 40, y: 30 }, { x: 50, y: 30 }, { x: 60, y: 30 },
  { x: 30, y: 40 }, { x: 40, y: 40 }, { x: 50, y: 40 }, { x: 60, y: 40 },
  { x: 30, y: 50 }, { x: 40, y: 50 }, { x: 50, y: 50 }, { x: 60, y: 50 },
  { x: 30, y: 60 }, { x: 40, y: 60 }, { x: 50, y: 60 }, { x: 60, y: 60 },
];

// ============================================================================
// NOTES
// ============================================================================

/**
 * This data is used by the "Cargar Ejemplo" button.
 *
 * When loaded, it creates:
 * - 1 HAZOP analysis
 * - 1 Peligro (created by the HAZOP analysis)
 *
 * Industry Context:
 * - Underground mining drainage system (Sistema de Achique de Mina Subterránea)
 * - Simple HAZOP example demonstrating deviation analysis
 *
 * Related files:
 * - hallazgos.ts: Empty (no standalone hallazgos)
 * - grupos.ts: Empty (no groups)
 * - page.tsx: cargarAnalisisEjemplo() function that uses this data
 */
