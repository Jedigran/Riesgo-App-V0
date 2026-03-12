/**
 * ============================================================================
 * HALLAZGO (FINDING) TYPES - Domain Models for Risk Findings
 * ============================================================================
 * 
 * This module defines TypeScript interfaces for all types of findings (hallazgos)
 * that can be identified during risk analysis. Findings are the output entities
 * created from analysis methodologies and can be placed on a plant diagram.
 * 
 * Finding Types:
 * - Peligro (Hazard): Potential source of harm
 * - Barrera (Barrier): Protection measure
 * - POE (Procedimiento Operativo Estándar / SOP): Standard operating procedure
 * - SOL (Capa de Protección / Protection Layer): Independent protection layer
 * 
 * @module models/hallazgo/types
 */

// ============================================================================
// TYPE ENUMERATIONS
// ============================================================================

/**
 * Union type of all supported finding types.
 */
export type TipoHallazgo =
  | 'Peligro'
  | 'Barrera'
  | 'POE'
  | 'SOL';

/**
 * Barrier type enumeration.
 */
export type TipoBarrera =
  | 'Fisica'
  | 'Administrativa'
  | 'Humana';

/**
 * Severity rating scale (1-5).
 * 1 = Insignificant, 5 = Catastrophic
 */
export type Severidad = 1 | 2 | 3 | 4 | 5;

/**
 * Effectiveness rating scale (1-5).
 * 1 = Very Low, 5 = Very High
 */
export type Efectividad = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// BASE INTERFACE
// ============================================================================

/**
 * Location coordinates for placing findings on a plant diagram.
 * Values are percentages (0-100) for responsive positioning.
 */
export interface Ubicacion {
  /** Horizontal position as percentage (0-100) */
  x: number;

  /** Vertical position as percentage (0-100) */
  y: number;
}

/**
 * Base interface for all finding types.
 * Contains common fields shared across all hallazgos.
 */
export interface HallazgoBase {
  /** Unique identifier per session (generated client-side) */
  id: string;

  /** Short title for the finding */
  titulo: string;

  /** Detailed description of the finding */
  descripcion: string;

  /** Position on the plant diagram (percentage coordinates) */
  ubicacion: Ubicacion;

  /** Creation timestamp in ISO 8601 format */
  fechaCreacion: string;

  /** 
   * IDs of originating analyses that created this finding.
   * A finding can be created by multiple analyses (e.g., HAZOP and FMEA both identified it).
   */
  analisisOrigenIds: string[];

  /** 
   * IDs of related findings.
   * Used to establish relationships between findings (e.g., Peligro ↔ Barrera).
   */
  hallazgosRelacionadosIds: string[];
}

// ============================================================================
// SPECIFIC FINDING INTERFACES
// ============================================================================

/**
 * Peligro (Hazard)
 * 
 * A potential source of harm in the process. This is the fundamental
 * entity in risk mapping that needs to be controlled by barriers.
 */
export interface Peligro extends HallazgoBase {
  /** Fixed type identifier */
  tipo: 'Peligro';

  /** Potential consequence if the hazard is realized */
  consecuencia: string;

  /** Severity rating of the consequence (1-5) */
  severidad: Severidad;

  /** Root cause analysis of the hazard */
  causaRaiz: string;
}

/**
 * Barrera (Barrier)
 * 
 * A protection measure designed to prevent or mitigate a hazard.
 * Can be physical, administrative, or human-based.
 */
export interface Barrera extends HallazgoBase {
  /** Fixed type identifier */
  tipo: 'Barrera';

  /** Type of barrier */
  tipoBarrera: TipoBarrera;

  /** Estimated effectiveness rating (1-5) */
  efectividadEstimada: Efectividad;

  /** Element or asset being protected by this barrier */
  elementoProtegido: string;
}

/**
 * POE (Procedimiento Operativo Estándar / Standard Operating Procedure)
 * 
 * Documented procedure that must be followed to ensure safe operation.
 * Administrative control that reduces risk through standardized actions.
 */
export interface POE extends HallazgoBase {
  /** Fixed type identifier */
  tipo: 'POE';

  /** Reference code or name of the procedure document */
  procedimientoReferencia: string;

  /** How often the procedure should be applied */
  frecuenciaAplicacion: string;

  /** Role or position responsible for executing the procedure */
  responsable: string;
}

/**
 * SOL (Capa de Protección / Protection Layer)
 * 
 * An Independent Protection Layer (IPL) that provides a specific level
 * of risk reduction. Must meet independence criteria.
 */
export interface SOL extends HallazgoBase {
  /** Fixed type identifier */
  tipo: 'SOL';

  /** Layer number in the protection sequence (1 = first line of defense) */
  capaNumero: number;

  /** Whether this layer is independent from other layers */
  independiente: boolean;

  /** Technology type used in this protection layer */
  tipoTecnologia: string;
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * Union type of all specific finding structures.
 * Used for type-safe handling of any finding type.
 */
export type Hallazgo =
  | Peligro
  | Barrera
  | POE
  | SOL;

// ============================================================================
// TYPE GUARDS (Helper Functions)
// ============================================================================

/**
 * Type guard to check if a finding is Peligro type.
 * @param hallazgo - The finding to check
 * @returns True if the finding is Peligro type
 */
export function isPeligro(hallazgo: Hallazgo): hallazgo is Peligro {
  return hallazgo.tipo === 'Peligro';
}

/**
 * Type guard to check if a finding is Barrera type.
 * @param hallazgo - The finding to check
 * @returns True if the finding is Barrera type
 */
export function isBarrera(hallazgo: Hallazgo): hallazgo is Barrera {
  return hallazgo.tipo === 'Barrera';
}

/**
 * Type guard to check if a finding is POE type.
 * @param hallazgo - The finding to check
 * @returns True if the finding is POE type
 */
export function isPOE(hallazgo: Hallazgo): hallazgo is POE {
  return hallazgo.tipo === 'POE';
}

/**
 * Type guard to check if a finding is SOL type.
 * @param hallazgo - The finding to check
 * @returns True if the finding is SOL type
 */
export function isSOL(hallazgo: Hallazgo): hallazgo is SOL {
  return hallazgo.tipo === 'SOL';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Utility type to extract the specific finding type by TipoHallazgo.
 * Useful for generic functions that need to work with specific finding types.
 * 
 * @example
 * type PeligroType = HallazgoByType<'Peligro'>; // Returns Peligro
 */
export type HallazgoByType<T extends TipoHallazgo> = Extract<Hallazgo, { tipo: T }>;

/**
 * Metadata about finding relationships.
 * Used for displaying relationship information in the UI.
 */
export interface RelacionHallazgo {
  /** ID of the source finding */
  origenId: string;

  /** ID of the target finding */
  destinoId: string;

  /** Type of relationship */
  tipoRelacion:
    | 'mitiga'           // Barrera mitigates Peligro
    | 'controla'         // POE controls Peligro
    | 'contiene'         // SOL contains Barrera
    | 'requiere'         // Finding requires another
    | 'referencia';      // General reference relationship

  /** Optional description of the relationship */
  descripcion?: string;
}
