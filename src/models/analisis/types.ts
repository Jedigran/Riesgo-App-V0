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

  /** Optional user-defined name to identify this analysis (e.g. "Línea A - Bomba P-201") */
  nombre?: string;

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

  /** Specific component/equipment within the node (e.g., "Bomba principal") */
  subnodo?: string;

  /** Process parameter (e.g., "Flow", "Pressure", "Temperature", "Level") */
  parametro: string;

  /** Guide word applied to parameter (e.g., "No", "More", "Less", "Reverse") */
  palabraGuia: string;

  /** Calculated deviation (Parametro + PalabraGuia combination) */
  desviacion?: string;

  /** Possible cause of the deviation */
  causa: string;

  /** Consequence of the deviation if it occurs */
  consecuencia: string;

  /** Person/community/equipment most vulnerable to impact */
  receptorImpacto?: string;

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
  /** Component/equipment being analyzed (e.g., "Bomba centrífuga P-201") */
  equipo: string;

  /** Operational purpose that must be fulfilled */
  funcion: string;

  /** Specific way the equipment can fail (e.g., "Motor no opera") */
  modoFalla: string;

  /** Person/community/equipment most vulnerable to impact */
  receptorImpacto?: string;

  /** Impact on the system or process if failure occurs */
  efecto: string;

  /**
   * Severity rating (1-10)
   * 10 = Hazardous without warning, 1 = No effect
   */
  S: number;

  /** Root cause of the failure mode */
  causa: string;

  /**
   * Occurrence rating (1-10)
   * 10 = 1 in 2 (almost certain), 1 = 1 in 1,500,000 (remote)
   */
  O: number;

  /** Existing barriers/controls that prevent or detect the failure */
  barrerasExistentes: string[];

  /**
   * Detection rating (1-10)
   * 10 = Detect <40%, 1 = Detect 99.5%
   */
  D: number;

  /**
   * Risk Priority Number (calculated field)
   * NPR = S × O × D (range: 1-1000)
   */
  RPN: number;

  /** Recommended actions to reduce S, O, or D */
  accionesRecomendadas: string[];
}

/**
 * LOPA (Layer of Protection Analysis)
 *
 * Semi-quantitative tool to evaluate if there are sufficient layers of protection
 * against a specific accident scenario.
 */
export interface CapaIPL {
  /** Name of the protection layer (e.g., "BPCS", "SIS", "Relief Valve") */
  nombre: string;

  /** Probability of Failure on Demand (PFD) for this layer */
  pfd: number;
}

export interface AnalisisLOPA {
  /** Risk scenario being analyzed (e.g., "Pérdida de bombeo de achique") */
  escenario: string;

  /** Potential impact if scenario occurs */
  consecuencia: string;

  /** Person/community/equipment most vulnerable to impact */
  receptorImpacto?: string;

  /**
   * Severity rating (1-10)
   * Based on FMEA scale
   */
  S: number;

  /** Maximum acceptable frequency (events/year) */
  riesgoTolerable: number;

  /** Root cause that triggers the scenario */
  causa: string;

  /** Initial event frequency (events/year) */
  frecuenciaInicial: number;

  /** Independent Protection Layers */
  capasIPL: CapaIPL[];

  /**
   * Total Probability of Failure on Demand (calculated)
   * PfD Total = PRODUCT(PfD_IPL_1, PfD_IPL_2, ..., PfD_IPL_n)
   */
  pfdTotal?: number;

  /**
   * Scenario risk (calculated)
   * Riesgo = Frecuencia_Causa × PfD_Total
   */
  riesgoEscenario?: number;

  /**
   * Whether risk meets tolerance criterion (calculated)
   * Cumple = Riesgo_Escenario ≤ Riesgo_Tolerable
   */
  cumpleCriterio?: boolean;

  /**
   * Target PFD for additional IPL (calculated, only if NO cumple)
   * PfD_Objetivo = Riesgo_Tolerable / Frecuencia_Causa
   */
  pfdObjetivo?: number;

  /**
   * Risk Reduction Factor required (calculated, only if NO cumple)
   * RRF = 1 / PfD_Objetivo
   */
  rrf?: number;

  /**
   * Required SIL level (calculated, only if NO cumple)
   * SIL 1: PfD 0.1-0.01 (RRF 10-100)
   * SIL 2: PfD 0.01-0.001 (RRF 100-1,000)
   * SIL 3: PfD 0.001-0.0001 (RRF 1,000-10,000)
   * SIL 4: PfD 0.0001-0.000001 (RRF 10,000-100,000)
   */
  silRequerido?: number;

  /** Recommended actions to reduce risk */
  recomendaciones: string[];
}

/**
 * OCA (Consequence Analysis)
 *
 * Analysis focused on understanding the consequences of hazardous events
 * and identifying gaps in existing protection.
 */
export interface AnalisisOCA {
  /** Chemical compound released (e.g., "H2S", "CO", "Cl2") */
  compuesto: string;

  /** Total mass available for release (lb) */
  cantidad: number;

  /** Wind speed at time of scenario (m/s) */
  viento: number;

  /** Wind correction factor (calculated) */
  factorViento?: number;

  /** Atmospheric stability class (A, B, C, D, E, F) */
  estabilidad: string;

  /** Scalability factor by stability class (calculated) */
  factorEscalabilidad?: number;

  /** Terrain classification (Urbana, Rural) */
  topografia: string;

  /** Topography adjustment factor (calculated) */
  factorTopografia?: number;

  /** Scenario conservatism level (Worst-Case, Alternativo) */
  tipoEscenario: string;

  /** Concentration/effect threshold that defines damage (mg/L or ppm) */
  endpoint: number;

  /** Mass released per unit time (calculated, lb/min) */
  tasaLiberacion?: number;

  /** Maximum radius where concentration = endpoint (calculated, miles) */
  distanciaEndpointMillas?: number;

  /** Distance converted to kilometers (calculated) */
  distanciaEndpointKm?: number;

  /** Theoretical affected circular surface area (calculated, miles²) */
  areaAfectadaMillas2?: number;

  /** Area converted to km² (calculated) */
  areaAfectadaKm2?: number;

  /** EPA regulatory classification (calculated) */
  programaRMP?: string;

  /** Qualitative consequence level classification (calculated) */
  evaluacion?: string;

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
