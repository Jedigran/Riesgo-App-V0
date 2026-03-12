/**
 * ============================================================================
 * ANALYSIS TYPES - Domain Models for Risk Analysis Methodologies
 * ============================================================================
 * 
 * This module defines TypeScript interfaces for all supported risk analysis
 * methodologies. Each analysis type has specific fields based on its methodology
 * standards.
 * 
 * Supported Methodologies:
 * - HAZOP (Hazard and Operability Study)
 * - FMEA (Failure Mode and Effects Analysis)
 * - LOPA (Layer of Protection Analysis)
 * - OCA (Consequence Analysis)
 * - Intuición (Expert Intuition / Informal Analysis)
 * 
 * @module models/analisis/types
 */

// ============================================================================
// TYPE ENUMERATIONS
// ============================================================================

/**
 * Union type of all supported analysis methodology types.
 */
export type TipoAnalisis =
  | 'HAZOP'
  | 'FMEA'
  | 'LOPA'
  | 'OCA'
  | 'Intuicion';

/**
 * Analysis status enumeration.
 */
export type EstadoAnalisis = 'completado' | 'en_progreso';

// ============================================================================
// BASE INTERFACE
// ============================================================================

/**
 * Base interface for all analysis forms.
 * Contains common fields shared across all methodologies.
 */
export interface AnalisisBase {
  /** Unique identifier per session (generated client-side) */
  id: string;

  /** Type of analysis methodology used */
  tipo: TipoAnalisis;

  /** Creation timestamp in ISO 8601 format */
  fechaCreacion: string;

  /** Current status of the analysis */
  estado: EstadoAnalisis;

  /** 
   * IDs of related analyses.
   * Used to establish relationships between analyses (e.g., FMEA supports HAZOP).
   */
  analisisRelacionadosIds: string[];
}

// ============================================================================
// SPECIFIC ANALYSIS INTERFACES
// ============================================================================

/**
 * HAZOP (Hazard and Operability Study) Analysis
 * 
 * Systematic examination of a process to identify hazards and operability problems.
 * Uses guide words combined with parameters to identify deviations.
 */
export interface AnalisisHAZOP {
  /** Process node or section being analyzed (e.g., "Reactor R-101", "Pipeline P-203") */
  nodo: string;

  /** Process parameter (e.g., "Flow", "Pressure", "Temperature", "Level") */
  parametro: string;

  /** Guide word applied to parameter (e.g., "No", "More", "Less", "Reverse") */
  palabraGuia: string;

  /** Possible cause of the deviation */
  causa: string;

  /** Consequence of the deviation if it occurs */
  consecuencia: string;

  /** Existing safeguards that prevent or mitigate the deviation */
  salvaguardasExistentes: string[];

  /** Recommended actions to reduce risk */
  recomendaciones: string[];
}

/**
 * FMEA (Failure Mode and Effects Analysis)
 * 
 * Step-by-step approach for identifying all possible failures in a design,
 * manufacturing process, or product/service.
 */
export interface AnalisisFMEA {
  /** Component or system element being analyzed */
  componente: string;

  /** How the component can fail (failure mode) */
  modoFalla: string;

  /** Effect of the failure on the system or process */
  efecto: string;

  /** Root cause of the failure mode */
  causa: string;

  /** Current controls that prevent or detect the failure */
  controlesActuales: string[];

  /** 
   * Severity rating (1-10)
   * 1 = No effect, 10 = Catastrophic
   */
  S: number;

  /** 
   * Occurrence rating (1-10)
   * 1 = Extremely unlikely, 10 = Inevitable
   */
  O: number;

  /** 
   * Detection rating (1-10)
   * 1 = Certain detection, 10 = Absolute uncertainty
   */
  D: number;

  /** 
   * Risk Priority Number (calculated field)
   * RPN = S × O × D (range: 1-1000)
   */
  RPN: number;

  /** Recommended actions to reduce RPN */
  accionesRecomendadas: string[];
}

/**
 * LOPA (Layer of Protection Analysis)
 * 
 * Semi-quantitative tool to evaluate if there are sufficient layers of protection
 * against a specific accident scenario.
 */
export interface AnalisisLOPA {
  /** Description of the accident scenario being analyzed */
  escenario: string;

  /** Initial event frequency (events per year) */
  frecuenciaInicial: number;

  /** Description of the consequence if all protections fail */
  consecuencia: string;

  /** 
   * Independent Protection Layers (IPLs)
   * Each layer reduces the frequency of the consequence
   */
  capasIPL: {
    /** Name of the protection layer (e.g., "BPCS", "SIS", "Relief Valve") */
    nombre: string;
    /** Probability of Failure on Demand (PFD) for this layer */
    pfd: number;
  }[];

  /** Final frequency after all IPLs are applied (events per year) */
  frecuenciaFinal: number;

  /** Target risk frequency (tolerable risk criterion) */
  objetivoRiesgo: number;
}

/**
 * OCA (Consequence Analysis)
 * 
 * Analysis focused on understanding the consequences of hazardous events
 * and identifying gaps in existing protection.
 */
export interface AnalisisOCA {
  /** Initiating event that could lead to consequences */
  eventoIniciador: string;

  /** Description of potential consequences */
  consecuencia: string;

  /** Existing barriers that prevent or mitigate consequences */
  barrerasExistentes: string[];

  /** Identified gaps in protection */
  gaps: string[];

  /** Recommendations to address gaps */
  recomendaciones: string[];
}

/**
 * Intuitive Analysis (Expert Judgment)
 * 
 * Informal analysis based on expert observation and experience.
 * Used for quick assessments or when formal methodology is not required.
 */
export interface AnalisisIntuicion {
  /** Short title for the observation */
  titulo: string;

  /** Detailed description of the observation or concern */
  descripcion: string;

  /** Additional notes or context */
  observaciones: string[];
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union type of all specific analysis data structures.
 * Used for type-safe handling of any analysis methodology.
 */
export type DatosAnalisis =
  | AnalisisHAZOP
  | AnalisisFMEA
  | AnalisisLOPA
  | AnalisisOCA
  | AnalisisIntuicion;

// ============================================================================
// WRAPPER INTERFACE
// ============================================================================

/**
 * Complete Analysis Origin Entity.
 * Combines base fields with methodology-specific data.
 * 
 * This is the main interface used throughout the application to represent
 * any type of risk analysis.
 */
export interface AnalisisOrigen {
  /** Base fields common to all analyses */
  base: AnalisisBase;

  /** Methodology-specific data */
  datos: DatosAnalisis;
}

// ============================================================================
// TYPE GUARDS (Helper Functions)
// ============================================================================

/**
 * Type guard to check if an analysis is HAZOP type.
 * @param analisis - The analysis to check
 * @returns True if the analysis is HAZOP type
 */
export function isAnalisisHAZOP(analisis: AnalisisOrigen): analisis is AnalisisOrigen & { datos: AnalisisHAZOP } {
  return analisis.base.tipo === 'HAZOP';
}

/**
 * Type guard to check if an analysis is FMEA type.
 * @param analisis - The analysis to check
 * @returns True if the analysis is FMEA type
 */
export function isAnalisisFMEA(analisis: AnalisisOrigen): analisis is AnalisisOrigen & { datos: AnalisisFMEA } {
  return analisis.base.tipo === 'FMEA';
}

/**
 * Type guard to check if an analysis is LOPA type.
 * @param analisis - The analysis to check
 * @returns True if the analysis is LOPA type
 */
export function isAnalisisLOPA(analisis: AnalisisOrigen): analisis is AnalisisOrigen & { datos: AnalisisLOPA } {
  return analisis.base.tipo === 'LOPA';
}

/**
 * Type guard to check if an analysis is OCA type.
 * @param analisis - The analysis to check
 * @returns True if the analysis is OCA type
 */
export function isAnalisisOCA(analisis: AnalisisOrigen): analisis is AnalisisOrigen & { datos: AnalisisOCA } {
  return analisis.base.tipo === 'OCA';
}

/**
 * Type guard to check if an analysis is Intuition type.
 * @param analisis - The analysis to check
 * @returns True if the analysis is Intuition type
 */
export function isAnalisisIntuicion(analisis: AnalisisOrigen): analisis is AnalisisOrigen & { datos: AnalisisIntuicion } {
  return analisis.base.tipo === 'Intuicion';
}
