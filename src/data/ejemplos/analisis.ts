/**
 * ============================================================================
 * EXAMPLE DATA - Risk Analyses (Registro Directo, HAZOP, FMEA, LOPA, OCA)
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
  // REGISTRO DIRECTO #1 - Sistema de Achique
  // ========================================
  {
    tipo: 'RegistroDirecto',
    datos: {
      nombre: 'Análisis de Peligros - Sistema de Achique',
      descripcion: 'Evaluación de riesgos por falla del sistema de bombeo en galerías subterráneas',
    },
    hallazgos: [
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
      },
    ],
  },

  // ========================================
  // HAZOP #1 - Sistema de Achique (Nodo: Bomba Principal)
  // ========================================
  {
    tipo: 'HAZOP',
    datos: {
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
          severidad: 9,
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

  // ========================================
  // FMEA #1 - Bomba Principal del Sistema de Achique
  // ========================================
  {
    tipo: 'FMEA',
    datos: {
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
          severidad: 9,
          causaRaiz: 'Sobrecarga prolongada del motor',
        },
      },
      {
        tipo: 'POE',
        datos: {
          titulo: 'POE-MIN-001: Respuesta a activación de bomba de emergencia',
          descripcion: 'Procedimiento de verificación de operación de bomba de respaldo y diagnóstico de falla de bomba principal',
          procedimientoReferencia: 'POE-MIN-001',
          frecuenciaAplicacion: 'Según sea necesario',
          responsable: 'Supervisor de Mantenimiento',
        },
      },
    ],
  },

  // ========================================
  // LOPA #1 - Pérdida de Bombeo de Achique
  // ========================================
  {
    tipo: 'LOPA',
    datos: {
      escenario: 'Pérdida de bombeo de achique',
      consecuencia: 'Acumulación de agua',
      receptorImpacto: 'Personal / Operación',
      S: 7,
      riesgoTolerable: 0.00001,
      causa: 'Falla eléctrica del motor',
      frecuenciaInicial: 0.0707,
      capasIPL: [
        { nombre: 'Alarma de alto nivel', pfd: 0.0001 },
        { nombre: 'Bomba de achique automática de respaldo', pfd: 0.0001 },
      ],
      recomendaciones: ['Instalar capa IPL adicional'],
    },
    hallazgos: [
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
      },
    ],
  },

  // ========================================
  // OCA #1 - Emisión Tóxica de H2S desde Sistema de Drenaje
  // ========================================
  {
    tipo: 'OCA',
    datos: {
      compuesto: 'H2S',
      cantidad: 1000,
      viento: 1.5,
      factorViento: 1.0,
      estabilidad: 'F',
      factorEscalabilidad: 1.5,
      topografia: 'Urbana',
      factorTopografia: 0.85,
      tipoEscenario: 'Alternativo',
      endpoint: 0.0017,
      tasaLiberacion: 16.67,
      barrerasExistentes: ['Detector de gas', 'Sistema de ventilación'],
      gaps: ['Tiempo de respuesta lento'],
      recomendaciones: ['Mejorar sistema de alerta temprana'],
    },
    hallazgos: [
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
      },
      {
        tipo: 'POE',
        datos: {
          titulo: 'POE-MIN-002: Respuesta a detección de H2S',
          descripcion: 'Procedimiento de evacuación inmediata y uso de equipos de respiración autónoma cuando se detecta H2S sobre 10 ppm',
          procedimientoReferencia: 'POE-MIN-002',
          frecuenciaAplicacion: 'Según sea necesario',
          responsable: 'Todo el personal subterráneo',
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
  { x: 20, y: 20 }, { x: 40, y: 20 }, { x: 60, y: 20 }, { x: 80, y: 20 },
  { x: 20, y: 40 }, { x: 40, y: 40 }, { x: 60, y: 40 }, { x: 80, y: 40 },
  { x: 20, y: 60 }, { x: 40, y: 60 }, { x: 60, y: 60 }, { x: 80, y: 60 },
  { x: 20, y: 80 }, { x: 40, y: 80 }, { x: 60, y: 80 }, { x: 80, y: 80 },
];

// ============================================================================
// NOTES
// ============================================================================

/**
 * This data is used by the "Cargar Ejemplo" button.
 *
 * When loaded, it creates:
 * - 5 analyses (1 Registro Directo, 1 HAZOP, 1 FMEA, 1 LOPA, 1 OCA)
 * - Multiple hallazgos (findings) associated with those analyses
 *
 * Industry Context:
 * - All analyses relate to the same underground mining drainage system
 * - Demonstrates how different methodologies assess the same system from different perspectives
 * - HAZOP focuses on deviations (No Flow)
 * - FMEA focuses on equipment failure modes (Motor no opera)
 * - LOPA focuses on independent protection layers (IPLs)
 * - OCA focuses on chemical dispersion consequences (H2S release)
 *
 * The hallazgos are positioned on the map using the posicionesHallazgos array.
 *
 * Related files:
 * - hallazgos.ts: Example data for standalone hallazgos (not tied to analyses)
 * - grupos.ts: Example data for 3 protection groups
 * - page.tsx: cargarAnalisisEjemplo() function that uses this data
 */
