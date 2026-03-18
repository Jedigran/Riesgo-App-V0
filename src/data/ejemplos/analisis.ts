/**
 * ============================================================================
 * EXAMPLE DATA - Risk Analyses (HAZOP, FMEA, LOPA, OCA)
 * ============================================================================
 *
 * This module contains example analysis data for demonstration purposes.
 * Used by the "Cargar Ejemplo" button in the main page.
 *
 * @module data/ejemplos/analisis
 */

import type { TipoHallazgo } from '@/src/models/hallazgo/types';

// ============================================================================
// TYPES
// ============================================================================

export interface EjemploAnalisis {
  /** Analysis type */
  tipo: 'HAZOP' | 'FMEA' | 'LOPA' | 'OCA';
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
// EXAMPLE ANALYSES
// ============================================================================

export const ejemplosAnalisis: EjemploAnalisis[] = [
  // ========================================
  // HAZOP #1 - Sistema de Achique
  // ========================================
  {
    tipo: 'HAZOP',
    datos: {
      nodo: 'Sistema de Achique',
      subnodo: 'Bomba principal',
      parametro: 'Flujo',
      palabraGuia: 'No',
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
          titulo: 'Pérdida de flujo de achique',
          descripcion: 'Riesgo por falla en bomba principal',
          tipoPeligro: 'Inherente',
          consecuencia: 'Acumulación de agua',
          severidad: 4,
          causaRaiz: 'Falla eléctrica',
        },
      },
      {
        tipo: 'Barrera',
        datos: {
          titulo: 'Sensor de nivel alto',
          descripcion: 'Detector de nivel para activar alarma',
          tipoBarrera: 'Fisica',
          tipoBarreraFuncion: 'Detectiva',
          efectividadEstimada: 4,
          elementoProtegido: 'Sistema de achique',
        },
      },
    ],
  },

  // ========================================
  // HAZOP #2 - Reactor R-101
  // ========================================
  {
    tipo: 'HAZOP',
    datos: {
      nodo: 'Reactor R-101',
      subnodo: 'Sistema de agitación',
      parametro: 'Presión',
      palabraGuia: 'Más de',
      causa: 'Reacción exotérmica descontrolada',
      consecuencia: 'Sobrepresión y posible ruptura del reactor',
      receptorImpacto: 'Personal/Planta',
      salvaguardasExistentes: ['PSV-101', 'Sistema de enfriamiento'],
      recomendaciones: ['Instalar disco de ruptura'],
    },
    hallazgos: [
      {
        tipo: 'Peligro',
        datos: {
          titulo: 'Sobrepresión en reactor',
          descripcion: 'Riesgo por reacción exotérmica',
          tipoPeligro: 'Inherente',
          consecuencia: 'Ruptura del reactor',
          severidad: 5,
          causaRaiz: 'Falla en control de temperatura',
        },
      },
      {
        tipo: 'SOL',
        datos: {
          titulo: 'PSV-101',
          descripcion: 'Válvula de alivio de presión',
          capaNumero: 1,
          independiente: true,
          tipoTecnologia: 'Válvula de seguridad',
          parametro: 'Presión',
          valorMinimo: 0,
          valorMaximo: 150,
          unidad: 'psig',
        },
      },
    ],
  },

  // ========================================
  // FMEA #1 - Bomba P-201
  // ========================================
  {
    tipo: 'FMEA',
    datos: {
      equipo: 'Bomba centrífuga P-201',
      funcion: 'Transferir producto del tanque T-101 a T-102',
      modoFalla: 'Falla en sello mecánico',
      receptorImpacto: 'Operadores de planta',
      efecto: 'Fuga de producto químico',
      causa: 'Desgaste por operación continua',
      S: 7,
      O: 4,
      D: 5,
      RPN: 140,
      barrerasExistentes: ['Dique de contención', 'Sensor de fugas'],
      accionesRecomendadas: ['Programar mantenimiento preventivo'],
    },
    hallazgos: [
      {
        tipo: 'Peligro',
        datos: {
          titulo: 'Fuga por falla de sello',
          descripcion: 'Fuga de producto químico por sello dañado',
          tipoPeligro: 'Diseño',
          consecuencia: 'Exposición química',
          severidad: 4,
          causaRaiz: 'Desgaste del sello',
        },
      },
      {
        tipo: 'POE',
        datos: {
          titulo: 'POE-INS-001: Inspección de bombas',
          descripcion: 'Procedimiento de inspección semanal',
          procedimientoReferencia: 'PRO-INS-001',
          frecuenciaAplicacion: 'Semanal',
          responsable: 'Jefe de Mantenimiento',
        },
      },
    ],
  },

  // ========================================
  // FMEA #2 - Compresor C-101
  // ========================================
  {
    tipo: 'FMEA',
    datos: {
      equipo: 'Compresor de aire C-101',
      funcion: 'Suministrar aire de instrumento',
      modoFalla: 'Vibración excesiva',
      receptorImpacto: 'Equipos de proceso',
      efecto: 'Daño en rodamientos',
      causa: 'Desbalanceo del rotor',
      S: 6,
      O: 3,
      D: 4,
      RPN: 72,
      barrerasExistentes: ['Monitor de vibración'],
      accionesRecomendadas: ['Balanceo dinámico'],
    },
    hallazgos: [
      {
        tipo: 'Peligro',
        datos: {
          titulo: 'Vibración excesiva',
          descripcion: 'Riesgo de falla catastrófica',
          tipoPeligro: 'Diseño',
          consecuencia: 'Falla del compresor',
          severidad: 4,
          causaRaiz: 'Desbalanceo',
        },
      },
      {
        tipo: 'Barrera',
        datos: {
          titulo: 'Monitor de vibración VM-101',
          descripcion: 'Sistema de monitoreo continuo',
          tipoBarrera: 'Fisica',
          tipoBarreraFuncion: 'Detectiva',
          efectividadEstimada: 4,
          elementoProtegido: 'Compresor C-101',
        },
      },
    ],
  },

  // ========================================
  // LOPA #1 - Escenario Crítico
  // ========================================
  {
    tipo: 'LOPA',
    datos: {
      escenario: 'Fuga en tubería de proceso',
      consecuencia: 'Incendio de vapor',
      receptorImpacto: 'Personal/Planta',
      S: 8,
      riesgoTolerable: 0.00001,
      causa: 'Corrosión en tubería',
      frecuenciaInicial: 0.1,
      capasIPL: [
        { nombre: 'BPCS - Alarma', pfd: 0.1 },
        { nombre: 'SIS - Parada', pfd: 0.01 },
      ],
      recomendaciones: ['Instalar capa IPL adicional'],
    },
    hallazgos: [
      {
        tipo: 'Peligro',
        datos: {
          titulo: 'Fuga de material inflamable',
          descripcion: 'Liberación de material por corrosión',
          tipoPeligro: 'Diseño',
          consecuencia: 'Incendio',
          severidad: 5,
          causaRaiz: 'Corrosión',
        },
      },
      {
        tipo: 'SOL',
        datos: {
          titulo: 'SIS-301 Parada de Emergencia',
          descripcion: 'Sistema instrumentado de seguridad',
          capaNumero: 2,
          independiente: true,
          tipoTecnologia: 'Sensor de presión + Válvula de bloqueo',
          parametro: 'Presión',
          valorMinimo: 0,
          valorMaximo: 200,
          unidad: 'psig',
        },
      },
    ],
  },

  // ========================================
  // OCA #1 - Dispersión de H2S
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
          titulo: 'Dispersión de H2S',
          descripcion: 'Nube tóxica por fuga de gas sulfhídrico',
          tipoPeligro: 'Inherente',
          consecuencia: 'Intoxicación del personal',
          severidad: 5,
          causaRaiz: 'Fuga en tubería',
        },
      },
      {
        tipo: 'Barrera',
        datos: {
          titulo: 'Detector de Gas H2S',
          descripcion: 'Sistema de detección continua',
          tipoBarrera: 'Fisica',
          tipoBarreraFuncion: 'Detectiva',
          efectividadEstimada: 4,
          elementoProtegido: 'Personal en planta',
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
 * - 6 analyses (2 HAZOP, 2 FMEA, 1 LOPA, 1 OCA)
 * - 12 hallazgos (findings) associated with those analyses
 * 
 * The hallazgos are positioned on the map using the posicionesHallazgos array.
 * 
 * Related files:
 * - hallazgos.ts: Example data for standalone hallazgos (not tied to analyses)
 * - page.tsx: cargarAnalisisEjemplo() function that uses this data
 */
